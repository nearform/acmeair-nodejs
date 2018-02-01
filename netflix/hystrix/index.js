var fs = require('fs');
var Stream = require('stream');
var streamHandler = require('./streamHandler.js')

var settings = JSON.parse(fs.readFileSync('./netflix/hystrix.json', 'utf8'));
var refreshInterval = settings.hystrix.refreshInterval || 500;

var hystrixMetricsStreamHandlerFactory = this; // default to self
exports.setHystrixMetricsStreamHandlerFactory = function(handler){
	hystrixMetricsStreamHandlerFactory= handler;
}

exports.hystrixStream = function(request, reply) {
	
	if (!hystrixMetricsStreamHandlerFactory)
	{
		reply.status(503).send({error:"hystrixMetricsStreamHandlerFactory not defined."});
		return;
	}

	console.log('setup hystrix stream with:' +refreshInterval +" ms");
	
	hystrixMetricsStreamHandlerFactory.getHystrixMetricsStreamHandler(refreshInterval, function(error, instance){
		if (!instance ) { 
			console.log("Can not get instance");
			reply.status(503).send({error: 'Can not get instance'});
		} else if (error) { 
			console.log("Get instance hit error:"+error);
			reply.status(503).send({error: error});
		} else {
			//End is never called now. Where else I can shutdown the instances which will the connection count???
			request.on('end', function() {
				console.log('receive request end');
				instance.shutdown(function(){      }) 
			});
			/* initialize response */
			reply.header("Content-Type", "text/event-stream;charset=UTF-8");
			reply.header("Cache-Control", "no-cache, no-store, max-age=0, must-revalidate");
			reply.header("Pragma", "no-cache");
			var stream = new Stream;
			stream.readable = true;

			setInterval(function(){
				instance.getJsonMessageAsString(function(err, jsonMessageStr) {
					if (err) {
						console.log("error:"+err);
						reply.status(503).send({error: err});
					} else {
						if (jsonMessageStr.length==0) {
							stream.emit("data", "ping: \n")
						} else {
							stream.emit("data", jsonMessageStr);
						}
						// NodeJS http does not have a flushBuffer function
					}
				});

				reply.send(stream)
			}, refreshInterval)
		}
	})
}

exports.getHystrixMetricsStreamHandler = function(refreshInterval, callback /*error, handler*/){
	
	streamHandler.getHandler(refreshInterval,callback);
}
