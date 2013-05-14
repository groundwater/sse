var fs      = require('fs');

var express = require('express');
var spdy    = require('spdy');

var options = {
  key:  fs.readFileSync(__dirname + '/server.key'),
  cert: fs.readFileSync(__dirname + '/server.crt'),
  ca:   fs.readFileSync(__dirname + '/server.csr'),
  windowSize: 1024
};

var app = module.exports = express();
 
// Configuration
app.configure(function(){
  app.use(express.bodyParser());
  app.use(express.static(__dirname));
});

function handleMessage(req,res,pushed){
  var msg = {
    from: "bob",
    to: "tom",
    body: "Hello Bob!",
    pushed: pushed || false
  };
  res.write(JSON.stringify(msg));
  res.end();
}

app.get('/message/:id',handleMessage);
app.get('/sse', function(req, res) {
  
  // let request last as long as possible
  res.setHeader('Content-Type','text/event-stream');
  req.socket.setTimeout(Infinity);
  
  console.log("Pushing /message/1 to the Client");
  var _headers = {
    "Content-Type": "application/json"
  }
  res.push('/message/1', _headers, function(err, stream) {
    if (err) return console.log('Push error',err);
    handleMessage(req,stream,true);
    stream.on('error',function(e){
      console.log('Aborted Push - Stream Error',e);
    })
  });
  
  setInterval(function(){
    res.write('data: /message/1\n\n');
  },5000);
  
});
 
var server = spdy.createServer(options, app);

server.listen(8443);

console.log("Express server listening on port %d", 8443);
