'use strict';

var http = require('http');
var fs = require('fs');
var crypto = require('crypto');
var R = require('ramda');

// Port proxy is bound to
const PORT=8000;
const CACHE_STORE= __dirname + '/.store/'

function echoLine(line) {
  console.log('\x1b[45m[FY-BOUNCER]:\x1b[0m',  line);
}

if(!fs.existsSync(CACHE_STORE)) {
  echoLine('Store does not exist, creating it.');
  fs.mkdirSync(CACHE_STORE);
}

function persistentFileName(uri) {
    let hash = crypto.createHash('md5').update(uri).digest('hex');
    return CACHE_STORE + hash + '.json';
}

function serve(data, response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.end(data);
}

function store(filename, data) {
  echoLine('Storing: ' + filename + " " + Buffer.byteLength(data, 'utf8') + ' bytes');
  fs.writeFile(filename, data, 'utf8', function(err) {
    if(err) {
      console.error('Error while storing');
      echoLine(err);
    }
  });
}

function queryOverHttp(url, filename, response) {
  echoLine('Querying over http for ' + filename);
  http.get({
    hostname: 'rata.digitraffic.fi',
    port: 80,
    path: url,
    agent: false  // create a new agent just for this one request
  }, (res) => {
    res.setEncoding('utf8');
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      store(filename, body);
      serve(body, response);
    })
  });
}

function postResultsOnFly(req) {
  var data = '';
  req.on('data', function(chunk) {
    data += chunk;
  });
  req.on('end', function() {

    var s = R.compose(
      // :D
      R.map((r) => { return {player: r.name, score: r.money}; }),
      R.project(['name', 'money']),R.filter(R.propEq('type', 'villain')), R.filter(R.propEq('isPlayer', true))
    )(JSON.parse(data));
    echoLine("Received results:");
    echoLine(s);
    if(process.env['RESULTS_HOST']) {
      echoLine("Posting results to " + process.env['RESULTS_HOST']);
      var r = http.request({
        hostname: process.env['RESULTS_HOST'],
        port: process.env['RESULTS_PORT'],
        path: process.env['RESULTS_PATH'],
        method: 'POST',
        agent: false,  // create a new agent just for this one request,
        headers: {
          'Content-Type': 'application/json'
        }
      }, (res) => {
        res.setEncoding('utf8');
        echoLine('Sent: ' + res.statusCode);
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          echoLine(body);
        })
      });
      r.write(JSON.stringify(s));
      r.end();
    } else {
      echoLine("No 'RESULTS_HOST' in env, refusing to post");
    }
  });
}

//We need a function which handles requests and send response
function handleRequest(request, response){
  if(request.method === 'POST' && request.url === '/results') {
    postResultsOnFly(request);
    response.setHeader('content-type', 'text/plain; charset=utf-8');
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.end("Thanks for playing come again");
    return;

  }
  let filename = persistentFileName(request.url);
  fs.exists(filename, function(exists) {
    if(exists) {
      echoLine('Serving pickles from fs ' + filename);
      fs.readFile(filename, 'utf8', function(err, data) {
        if(err) {
          // Awesome self repairing
          echoLine('Error while serving pickles :(, trying http');
          queryOverHttp(request.url, filename, response);
        }
        serve(data, response);
      })
    } else {
      queryOverHttp(request.url, filename, response);
    }
  })
}


var server = http.createServer(handleRequest);
server.listen(PORT, function(){
    echoLine('FINLANDYARD bouncer proxy listening: http://localhost:' + PORT);
});
