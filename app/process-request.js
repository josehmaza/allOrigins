const getPage  = require('./get-page')

module.exports = processRequest

async function processRequest (req, res) {
  if (req.method === 'OPTIONS') {
    return res.end()
  }
  console.log('me viene una peticion con todo esot ')
  //console.log(req)
  const startTime = new Date()
  const params = parseParams(req)
  const page = await getPage(params)
  return createResponse(page, params, res, startTime)
}

function parseParams (req) {
  console.log('el body es ', req.body)
  const params = {
    requestMethod: req.method,
    ...req.query,
    ...req.params,
    body: req.body
  }
  params.requestMethod = parseRequestMethod(params.requestMethod)
  params.format = (params.format || 'json').toLowerCase()
  return params
}

function parseRequestMethod (method) {
  method = (method || '').toUpperCase()

  if (['HEAD', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return method
  }
  return 'GET'
}

function createResponse (page, params, res, startTime) {
  console.log('creating response'+page.status)
  if (params.format === 'raw' && !(page.status || {}).error) {
    console.log('into => ')
   /* for (let [key, value] of Object.entries(page.headers)) {
      //res.set(key, value)
    }*/

    //res.set('Content-Length', page.contentLength)
    //res.set('Content-Type', page.contentType)
    res.set('Content-Length',  page.contentLength || page.proxy_response.headers['content-length'])

    res.set('Content-Type', page.contentType || page.proxy_response.headers['content-type'])
    res.set('proxy_request_headers', JSON.stringify(page.proxy_request.options.headers))
    res.set('proxy_response_headers', JSON.stringify(page.proxy_response.headers))
    res.set('proxy_response_statusCode', JSON.stringify(page.proxy_response.statusCode))
    res.status(page.proxy_response.statusCode)
    return res.send(page.content)
    //return res.send('{}')
  }

  if (params.charset) res.set('Content-Type', `application/json; charset=${params.charset}`)
  else res.set('Content-Type', 'application/json')

  if (page.status) page.status.response_time = (new Date() - startTime)
  else page.response_time = (new Date() - startTime)

  if (params.callback) return res.jsonp(page)
  return res.send(JSON.stringify(page))
}
