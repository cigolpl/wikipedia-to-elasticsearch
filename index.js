#! /usr/bin/env node
//stream a big wikipedia xml.bz2 file into mongodb
//node index.js afwiki-latest-pages-articles.xml.bz2
var fs = require('fs')
var XmlStream = require('xml-stream')
var wikipedia = require('wtf_wikipedia')
var bz2 = require('unbzip2-stream');
var helper = require('./helper')

var program = require('commander');

program
    .usage('node index.js afwiki-latest-pages-articles.xml.bz2 [options]')
    .option('-w, --worker [worker]', 'Use worker (redis required)')
    .parse(process.argv);

var file = process.argv[2]
if (!file) {
  console.log('please supply a filename to the wikipedia article dump')
  process.exit(1)
}
var lang = file.match(/([a-z][a-z])wiki-/) || []
lang = lang[1] || '-'


var queue
// make redis and queue requirement optional
if (program.worker) {
  queue = require('./config/queue');
}

// Create a file stream and pass it to XmlStream
var stream = fs.createReadStream(file).pipe(bz2());
var xml = new XmlStream(stream);
xml._preserveAll = true //keep newlines

var i = 1;
xml.on('endElement: page', function(page) {
  if (page.ns === '0') {
    var script = page.revision.text['$text'] || ''

    //console.log(page.title + ' ' + i);
    ++i;

    var data = {
      title: page.title, script: script
    }

    if (program.worker) {
      // we send job to job queue (redis)
      // run job queue dashboard to see statistics
      // node node_modules/kue/bin/kue-dashboard -p 3050
      queue.create('article', data)
      .removeOnComplete(true)
      .attempts(3).backoff({delay: 10 * 1000, type:'exponential'})
      .save()
    } else {
      //helper.processScript(data)
      helper.getProcessedData(data)
    }
  }
});

xml.on('error', function(message) {
  console.log('Parsing as ' + (encoding || 'auto') + ' failed: ' + message);
  db.close();
});

xml.on('end', function() {
  console.log('=================done!========')
  setTimeout(function() { //let the remaining async writes finish up
    db.close();
  }, 20000)
});
