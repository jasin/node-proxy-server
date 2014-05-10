// include required js
var http = require('http'),  
	httpProxy = require('http-proxy'),
	fs = require('fs');

// read the config file and set some variables
var obj = JSON.parse(fs.readFileSync('./config', 'utf8')),
	proxy_port = obj.proxy_port,
	web_port = obj.web_port,
	subdomain = obj.subdomain,
	error_file = obj.error_file;

// setup our proxy server to route request
var proxy = httpProxy.createProxyServer();
var server = http.createServer(function(req, res){
	if(subdomain[req.headers.host]) {
		console.log('Routing a request for ' + req.headers.host);
		proxy.web(req, res, {
			target: 'http://localhost:' + subdomain[req.headers.host]
		}, function(e) {
			console.log('Error: ' + e.code);
		});
	} else {
		console.log('Routing default request for unknown subdomain ' + req.headers.host);
		proxy.web(req, res, {
			target: 'http://localhost:' + web_port
		});
	}
}).listen(proxy_port);

// default server to route incase there is no matching subdomain
var base = http.createServer(function(req, res){
	fs.readFile(error_file, function(err, data) {
        if (err) {
            console.log(err);
            data = '<h4>There was a problem</h4>';
        }
        res.writeHead(200, {'Content-type': 'text/html'});
        res.end(data);
	});
	
}).listen(web_port);

console.log('Proxy server listening on port ' + proxy_port);
