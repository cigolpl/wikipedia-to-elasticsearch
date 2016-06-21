var util = require('util');
var cluster = require('cluster')
var clusterWorkerSize = 1
var concurrency = 1;
var helper = require('./helper')
var queue = require('./config/queue');

var fs = require('fs');
var wstream = fs.createWriteStream('export.json');
var randomstring = require("randomstring");

queue.process('save', concurrency, function(job, done){
  var dump = {
    _index: "wiki",
    _type: "wiki",
    _id: randomstring.generate({
      length: 12,
      charset: 'alphabetic'
    }),
    _source: job.data
  }

  wstream.write(JSON.stringify(dump) + '\n');
  done(null)
})
