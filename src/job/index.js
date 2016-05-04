module.exports = function (pubClient) {
  var kue = require('kue')
  var config = require('../config')
  queue = kue.createQueue({
    prefix: config.get('push_queue_prefix'),
    redis: {
      port: parseInt(config.get('redis_port') || '6379', 10),
      host: config.get('redis_host')
    }
  })
  queue.on('error', function(err) { 
    console.log('kue error', err)
  })
  queue.process(config.get('push_queue_name'), function(job, done){
    console.log('paymentid: ', job.data.paymentId)
    getPayment(job.data.paymentId, function(err, data){
      currency.sendByAssetId( data.items[0].quantity, data.userID ,data.items[0].assetId, job, function(err, resp){
        done(err, {jobid: job.id})
      })
    })
  })
  app.use('/queue', kue.app)

  
}