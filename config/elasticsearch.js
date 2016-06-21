var elasticsearch = require('elasticsearch');
var Promise = require('bluebird');
var client

try {

  var conf = {
    host: 'localhost:9200',
    //log: 'trace',
    apiVersion: '1.7',
    defer: function () {
      var resolve, reject;
      var promise = new Promise(function() {
        resolve = arguments[0];
        reject = arguments[1];
      });
      return {
        resolve: resolve,
        reject: reject,
        promise: promise
      }
    }
  }

  client = new elasticsearch.Client(conf);
} catch (err) {
  console.log('Unable to initialize elasticsearch! Error :' + err.message);
}

module.exports = client
