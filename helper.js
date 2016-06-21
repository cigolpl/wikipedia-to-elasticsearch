var wikipedia = require('wtf_wikipedia')
var client = require('./config/elasticsearch');
var Promise = require('bluebird');
var request = Promise.promisifyAll(require('request'));
var _ = require('lodash')
var deepMap = require('deep-map')
var fs = require('fs');
var randomstring = require("randomstring");

var wstream = fs.createWriteStream('export.json');

exports.processScript = function(options) {
  var data = wikipedia.parse(options.script)
  data.title = options.title

  var text
  if (data.text && data.text.Intro) {
    text = _.map(data.text.Intro, function(val) {
      return val.text
    })
  }
  data.text = text

  if (data.infobox) {
    data.infobox = _.mapValues(data.infobox, function(val, key) {
      return val.text
    })
  }

  data = _.omit(data, ['infobox_template', 'tables', 'translations', 'images'])

  // make sure all values are string
  // otherwise elasticsearch is crashing when we have sometimes int and sometimes string
  data = deepMap(data, function(val) {
    return '' + val
  })

  return Promise.resolve(data)
}

exports.getImage = function(data) {
  var url = 'http://af.wikipedia.org/w/api.php?action=query&titles=' + data.name + '&prop=pageimages&format=json&pithumbsize=400'
  return request.getAsync({
    url: url,
    json: true,
    gzip: true
  })
  .then(function(res) {
    var keys = _.keys(res.body.query.pages)
    var key = keys[0]
    return res.body.query.pages[key].thumbnail.source;
    //return res
  })
  .catch(function(res) {
    //console.log('cannot find image for: ' + data.name);
    return ''
  })
}

exports.getProcessedData = function(options) {
  var output
  return exports.processScript(options)
  .then(function(res) {
    output = res
    console.log(res.title);
    return exports.getImage({
      name: res.title
    })
  })
  .then(function(res) {
    //console.log('image');
    //console.log(res);
    output.image_src = res
    return output
  })
  .then(function(res) {
    return res
  })
  .catch(function(err) {
    console.log(output.title);
    console.log('error');
    console.log(err);
  })
}
