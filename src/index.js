



module.exports = (function () {
  var pubsub = require('fw_pubsub')
  var config = require('./config')
  var express = require('express')
  var stylus = require('stylus')
  var nib = require('nib')

  var app = express()
  function compile(str, path) {
  return stylus(str)
    .set('filename', path)
    .use(nib())
}

  var cookieParser = require('cookie-parser')
  app.use(cookieParser())

 // var JWTRedisSession = require("jwt-redis-session")

  //var redis = require('redis')
  var config = require('./config')
  var proxiedHttp = require('findhit-proxywrap')
  
  var bodyParser = require('body-parser')
  //var morgan = require('morgan')
  
  
  var proxyProtocol = config.get('proxy_protocol') === 'true'

  //var redisClient = redis.createClient(parseInt(config.get('redis_port') || '6379', 10), config.get('redis_host'))

  var http = require('http')
  // If proxy protocol in enabled, we will wrap the http_server we have with proxy server
  proxyProtocol && (http = proxiedHttp.proxy(http))
  var server = http.createServer(app)

  var io = require('socket.io')(server, {path: '/notifications'})
  io.on('connection', function () { console.log('io connection') })
  
  // If proxy procotol is enabled we need to fix standard headers
  if (proxyProtocol) {
    app.all('*', function (req, res, next) {
      req['X-Forwarded-For'] = req.connection.remoteAddress
      req['X-Forwarded-Proto'] = req.connection.proxyPort
      next()
    })
  }
 // app.use(morgan('combined'))
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))
  /*app.use(JWTRedisSession({
    client: store.redisClient,
    secret: 'asecret',
    keyspace: 'ccs:sessions:',
    maxAge: 86400,
    algorithm: 'HS256',
    requestKey: 'jwtSession',
    requestArg: 'jwtToken'
  }))*/

  var consumer = new pubsub.Consumer(config.get('consumer'))
  consumer.create(app)
  consumer.addVerification('socket', function(message, callback){
    if(!message.title || !message.text || !message.to)
      return callback(new Error('must contain: title, text, to'))
    callback(null, message)
  })
  consumer.on('newjob', function(job, done){
     if(job.data.type == 'socket') {
       io.to(job.data.to).emit('message', job.data.text)
     }
     done(null, { id: job.data.id, jobid: job.id })
  })
  consumer.on('message', function(name, data, id){
    console.log('looking for socket', id)
     if(io.sockets.connected[id]) {
      console.log('socket found', id)
      io.sockets.connected[id].join(data[0])
     }
    /* if(io.sockets.adapter.nsp.connected[id]) {
      console.log('socket found2', id)
     }*/
  })

  // jade, stylus, nib
  app.use('/doc', express.static(__dirname + '/doc'))
  app.set('views', __dirname + '/views')
  app.set('view engine', 'jade')
 // app.use(express.logger('dev'))
  app.use(stylus.middleware(
    { src: __dirname + '/public'
    , compile: compile
    }
  ))
  app.use(express.static(__dirname + '/public'))

  app.get('/', function (req, res) {
    res.render('index',
    { title : 'Home' }
    )
  })

  var port = config.getport()
  server.listen(port)
  console.log('Server is listening to *:' + port)

  io.use(function (socket, next){
    var handshakeData = socket.request
    if(!handshakeData._query) next(new Error('unauthorized'))
    else {
        if(handshakeData._query.token) {// valid token
          //socket.join(handshakeData._query.token)
          consumer.publish('userConnected', {userId: handshakeData._query.token }, socket.id)
          next()  
        }
        else
          next(new Error('unauthorized'))
    }
  })


  app.on('ready', function () {
    app.use(function (err, req, res, next) {
      if (err.status) {
        res.status(err.status).send({ error: err.message })
      } else {
        next(err)
      }
    })
  })

  return app
})()
