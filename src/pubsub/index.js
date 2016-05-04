module.exports = function (pubClient) {
  var Bus = require('busmq')
  var bus = Bus.create({redis: ['redis://localhost:6379'], logLevel: 'info', logger: console})
  bus.debug(true)
  bus.on('online', function() {
    console.log('bus online')
    var c = bus.channel('payment')
    c.on('connect', function() {
      console.log('connected to payment channel');
      c.send('server has connected to channel')
    })
    c.on('remote:connect', function() {
      console.log('remote: connected to payment channel');

    })
    c.on('message', function(message, id) {
    // received a message from the client

      console.log('got message: ' + message)
      c.ack(id)
      // c.send(JSON.stringify({a: 'a', b:'b'})) 
    })
    c.on('error', function(err){
        console.log('payment channel error', err)
    })
    c.listen({reliable: true}) // reverse the endpoint roles and connect to the channel 
  })
  bus.on('error', function(err) {
    console.log('bus error', err)
  })
  bus.connect()

  
}