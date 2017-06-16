/**********************************************************************
node-proxy-server
Copyright (C) 2016  Jasin Colegrove

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License

along with this program.  If not, see <http://www.gnu.org/licenses/>.
***********************************************************************/

var http = require('http'),  
	httpProxy = require('http-proxy'),
	fs = require('fs'),
	path = require('path');

// read the config file and set some variables
var obj = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'config'), 'utf8')),
	proxy_port = obj.proxy_port,
	web_port = obj.web_port,
	subdomain = obj.subdomain,
	error_file = obj.error_file;

// declare our variables
var proxy;
var serverip4;
var serverip6;

// The server that will be routing the actual request
proxy = httpProxy.createProxyServer({ ws: true });

// Setup to listen for web request on IPv4/6
serverip4 = http.createServer( function(req, res){
	webRoute(req, res);	
});

serverip6 = http.createServer( function(req, res){
	webRoute(req, res);
});

// Setup to listen for websockets on IPv4/6
serverip4.on('upgrade', function(req, res) {
	wsRoute(req, res);
});
	
serverip6.on('upgrade', function(req, res) {
	wsRoute(req, res);
});
	

// initialize listening
serverip4.listen(proxy_port, '127.0.0.1');
serverip6.listen(proxy_port, '::1');

// web route
function webRoute(req, res) {
	if(subdomain[req.headers.host]) {
			console.log('Routing web request: ' + req.headers.host + ' From: ' + req.connection.remoteAddress);
			proxy.web(req, res, {
				target: 'http://localhost:' + subdomain[req.headers.host]
			}, function(e) {
				console.log('Error: ' + e.code);
			});
		} else {
			defaultRoute(req);
		}
};

// websocket route
function wsRoute(req, res) {
	console.log('Routing websocket request: ' + req.headers.host + ' From: ' + req.connection.remoteAddress);
	proxy.ws(req, res , {
		target: 'http://localhost:' + subdomain[req.headers.host]
	}, function (e) {
		console.log('Error: ' + e.code);
	})
};

// default router
function defaultRoute(req) {
	console.log('Routing default request: ' + req.headers.host + ' From: ' + req.connection.remoteAddress);
	proxy.web(req, res, {
		target: 'http://localhost:' + web_port
	}, function(e) {
		console.log('Error: ' + e.code);
	});
};


// default server to notify user subdomain is not valid
var defaultServer = http.createServer(function(req, res){
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
