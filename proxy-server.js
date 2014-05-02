// include required js
var http = require('http'),  
    httpProxy = require('http-proxy'),
    fs = require('fs');

// read the config file and set some variables
var obj = JSON.parse(fs.readFileSync('./config', 'utf8')),
	port = obj.port,
	subdomain = obj.subdomain;

// setup our proxy server to route request
var proxy = httpProxy.createProxyServer();
var server = http.createServer(function(req, res){
    if(subdomain[req.headers.host]) {
        proxy.web(req, res, {
            target: 'http://localhost:' + subdomain[req.headers.host]
        }, function(e) {
            console.log('Error: ' + e['code']);
        });
		console.log('Routing a request for ' + req.headers.host);
    } else {
        proxy.web(req, res, {
            target: 'http://localhost:9000'
        });
		console.log('Routing default request for unknown subdomain ' + req.headers.host);
    }
}).listen(port);

// default server to route incase there is no matching subdomain
var base = http.createServer(function(req, res){
    res.writeHead(200, {'Content-type': 'text/html'});
    res.end('<h3>Oops! We had an issue, blame Rob!</h3>');
}).listen(9000);

console.log('Proxy server listening on port ' + port);
