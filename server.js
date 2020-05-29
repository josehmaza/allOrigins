/*!
 * AllOrigins
 * written by Gabriel Nunes <gabriel@multiverso.me>
 * http://github.com/gnuns
 */

const app = require('./app.js')
const port = process.env.PORT || 8085

console.log(`Starting allOrigins v${global.AO_VERSION}`)
app.listen(port, () => console.log(`Listening on localhost:${port}`))
