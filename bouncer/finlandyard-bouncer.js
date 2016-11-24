//Lets require/import the HTTP module
var http = require('http');
var fs = require('fs');
var crypto = require('crypto');

//Lets define a port we want to listen to
const PORT=8000;
const CACHE_STORE='.store/'

//We need a function which handles requests and send response
function handleRequest(request, response){
  let hash = crypto.createHash('md5').update(request.url).digest('hex');
  console.log(request.url + " -> md5 " + hash);
  fs.exists(CACHE_STORE + hash + '.json', function(exists) {
    if(exists) {
      console.log('Serving pickles');
      fs.readFile(CACHE_STORE + hash + '.json', function(err, data) {
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('content-type', 'application/json');
        response.end(data);
      })
    } else {
      http.get({
        hostname: 'rata.digitraffic.fi',
        port: 80,
        path: request.url,
        agent: false  // create a new agent just for this one request
      }, (res) => {
        // Do stuff with response
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          fs.writeFile(CACHE_STORE + hash + '.json', body, function(err) {
            if(err) {
              console.error('Error while storing');
              console.log(err);
            }
          });
          response.setHeader('Access-Control-Allow-Origin', '*');
          response.setHeader('content-type', 'application/json');
          response.end(body);
        })
      });
    }
  })
}

//Create a server
var server = http.createServer(handleRequest);

//Lets start our server
server.listen(PORT, function(){
    //Callback triggered when server is successfully listening. Hurray!
    console.log("FINLANDYARD bouncer proxy listening: http://localhost:%s", PORT);
});
