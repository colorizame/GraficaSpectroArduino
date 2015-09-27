var fs = require('fs')
,http = require('http'),
socketio = require('socket.io'),
url = require("url"),
SerialPort = require("serialport").SerialPort

var socketServer;
var serialPort;
var portName = 'COM32'; //change this to your Arduino port
var sendData = "";

// handle contains locations to browse to (vote and poll); pathnames.
function startServer(route,handle,debug)
{
	// on request event
	function onRequest(request, response) {
	  // parse the requested url into pathname. pathname will be compared
	  // in route.js to handle (var content), if it matches the a page will
	  // come up. Otherwise a 404 will be given.
	  var pathname = url.parse(request.url).pathname;
	  console.log("Request for " + pathname + " received");
	  var content = route(handle,pathname,response,request,debug);
	}

	var httpServer = http.createServer(onRequest).listen(1337, function(){
		console.log("Listening at: http://localhost:1337");
		console.log("Server is up");
	});
	serialListener(debug);
	initSocketIO(httpServer,debug);
}

function initSocketIO(httpServer,debug)
{
	socketServer = socketio.listen(httpServer);
	if(debug == false){
		socketServer.set('log level', 1); // socket IO debug off
	}
	socketServer.on('connection', function (socket) {
	console.log("user connected");
	socket.emit('onconnection', {pollOneValue:sendData});
	socketServer.on('update', function(data) {
	socket.emit('updateData',{pollOneValue:data});
	});
	// socket.on('buttonval', function(data) {
	// 	serialPort.write(data + 'E');
	// });
	// socket.on('sliderval', function(data) {
	// 	serialPort.write(data + 'P');
	// });

    });
}

// Listen to serial port
function serialListener(debug)
{
    var receivedData = "";
    serialPort = new SerialPort(portName, {
        baudrate: 4800,
        // defaults for Arduino serial communication
         dataBits: 8,
         parity: 'none',
         stopBits: 1,
         flowControl: false
    });

    serialPort.on("open", function () {
      console.log('open serial communication');
            // Listens to incoming data
				var info = [];
        serialPort.on('data', function(data) {
             receivedData += data.toString();

        //  if (receivedData .indexOf('rgb(') >= 0 && receivedData .indexOf('-') >= 0) {
				if (!receivedData || receivedData.length === 0 || receivedData =="") {
					console.log("white");
				} else {
					//console.log(receivedData);
					if (receivedData.search("end") != -1) {
						console.log(info);
						console.log(info.length);
						socketServer.emit('info', info);
						console.log("Fin!");
					} else {
					console.log(receivedData);
					receivedData = receivedData.replace(/^\s*|\s*$|(\s*((\r?\n){2,})\s*|\s*((\r?\n){1,2})\s*)/g,"$2$4");
					sendColor = receivedData.substring(4, receivedData.indexOf('-'));
					sendData = receivedData .substring(receivedData.indexOf('-') + 1, receivedData.length);
					receivedData = '';
					if (sendColor.search(/[0-9]+,[0-9]+,[0-9]+/) != -1) {
						info.push({"color": sendColor, "val": sendData});
					}
					console.log("c:" + sendColor);
	 			 	console.log("v:"+sendData);
	 			 	console.log(" ");
					}
				}
        // }
         // send the incoming data to browser with websockets.
      });
    });
}

exports.start = startServer;
