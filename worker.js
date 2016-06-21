// run job queue dashboard to see statistics
// node node_modules/kue/bin/kue-dashboard -p 3050

var util = require('util');
var cluster = require('cluster')
var clusterWorkerSize = require('os').cpus().length;
//var clusterWorkerSize = 1
var concurrency = 1;
var helper = require('./helper')
var queue = require('./config/queue');

if (cluster.isMaster) {
  for (var i = 0; i < clusterWorkerSize; i++) {
    cluster.fork();
  }
} else {
  queue.process('article', concurrency, function(job, done){
    var url = job.data.url;
    var data = job.data
    helper.getProcessedData(data)
    .then(function(res) {

      queue.create('save', res)
      .removeOnComplete(true)
      .priority('high')
      .save()

      done(null, res)
    })
    .catch(function(err) {
      done(err)
    })
  })
}
