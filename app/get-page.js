const got = require('got')

const DEFAULT_USER_AGENT = `Mozilla/5.0 (compatible; allOrigins/${global.AO_VERSION}; +http://allorigins.ml/)`

module.exports = getPage

function getPage ({url, format, requestMethod, body}) {
  if (format === 'info' || requestMethod === 'HEAD') {
     return getPageInfo(url)
  } else if (format === 'raw') {
    return getRawPage(url, requestMethod, body)
  }

  return getPageContents(url, requestMethod)
}

async function getPageInfo (url) {
  const {response, error} = await request(url, 'HEAD')
  if (error) return processError(error)

  return {
    'url': url,
    'content_type': response.headers['content-type'],
    'content_length': +(response.headers['content-length']) || -1,
    'http_code': response.statusCode
  }
}

async function getRawPage (url, requestMethod, body) {
  const {content, response, error, proxy_response, proxy_request} = await request(url, requestMethod, body)
  if (error) return processError(error)
  console.log('Obteniendo el bytelength ', content)
  const contentLength = typeof(content) === 'string'? Buffer.byteLength(content):Buffer.byteLength(JSON.stringify(content));
  return {
    hasError: false,
    typeError: null, //'HTTP_ERROR', 'CUSTOM'
    content, contentType: response.headers['content-type'], contentLength, proxy_response, proxy_request}
}

async function getPageContents (url, requestMethod) {
  const {content, response, error} = await request(url, requestMethod)
  if (error) return processError(error)

  const contentLength = Buffer.byteLength(content)
  return {
    contents: content.toString(),
    status: {
      'url': url,
      'content_type': response.headers['content-type'],
      'content_length': contentLength,
      'http_code': response.statusCode,
    }
  }
}

async function request (url, requestMethod, body) {
  console.log('Haciendo peticion con este body', body)
  try {
    let options = {
      'method': requestMethod,
      ///'encoding': 'utf8',
      'headers': {
        //'user-agent': process.env.USER_AGENT || DEFAULT_USER_AGENT,
        'user-agent': 'PostmanRuntime/7.24.1',
        'Content-Type': 'application/json;charset=UTF-8',
        'Connection': 'keep-alive',
        'Accept-Encoding': '',
        'Accept-Language': 'en-US,en;q=0.8'
      },
      'timeout': 120000,
      'retry':  { limit: 0, methods: ["POST"]}

    }
    console.log('hare un request con estas opciones')

    console.log('el timeout es ', options)

    let response = null;
    if(options.method === 'POST'){
      console.log('haciendo post', new Date())
      options = {
        ...options,
        'json': body,
        'responseType': 'json',
        'hooks': {
          beforeRetry: [
              (options, error, retryCount) => {
                  console.log('Reintentando ===....')
              }
          ],
          afterResponse: [
            (response, retryWithMergedOptions) => {
                console.log('Despues de la respuesta ', response.body)
                if (response.statusCode === 500){
                  console.log('Ha ocurrido un error');
                  throw new Error({ola: 'hernan'})
                }
                return response;
            }
        ],
      }
      }
      response=  await got.post(url, options)//.json()
      console.log('=> FIN ', new Date())
      /*response = {
        body: response.body
      }*/

    }else {
      response= await got(url, options)
    }
    console.log('La respuesta obtenida es => ', response.body)
    if (options.method === 'HEAD') return {response}

    return processContent(response)
  } catch (error) {
    console.log('== ERROR ', error)
    return {error}
  }
}

async function processContent (response) {
  const res = {
    'response': response, 'content': response.body, response, proxy_response: response, proxy_request: response.request,
    status: {
      http_code: response.statusCode
    }
}
  return res
}

async function processError (e) {

  const {response} = e
  if (!response) return {contents: null, status: {error: e}}

  const {url, statusCode: http_code, body} = response
  let contentLength = typeof(body) === 'string'? Buffer.byteLength(body): Buffer.byteLength(JSON.stringify(body))
  //contentLength = 500;
  if(e.response.statusCode === 500){
    return {
      content: JSON.stringify(body),
      contents: JSON.stringify(body),
      status: {
        url, http_code,
        //'content_type': headers['content-type'],
        //'content_length': contentLength

      },
      //headers: headers,
      proxy_request: response.request,
      proxy_response: response
    }

  }
  return {
    //content: 'Error:',
    contents: body.toString(),
    status: {
      url, http_code,
      'content_type': headers['content-type'],
      'content_length': contentLength

    }
  }
}
