let createError = require("http-errors");
let express = require("express");
let path = require("path");
// let cookieParser = require('cookie-parser');
const fs = require("fs");
const http = require("http");
var app = express();
const compression = require("compression");

// 动态获取一个文件夹下面的路由文件，并且绑定到 app上
// let routes = require('require-dir')('./routes', {recurse: true});
// Object.keys(routes).map(function (r, i) {
//   if (typeof routes[r] == 'function')
//     app.use('/' + r, routes[r]);
// });

// 1. 使用 compression 中间件压缩资源
app.use(compression({ filter: shouldCompress }));

// 2. 使用过滤器，判断哪些资源需要压缩
function shouldCompress(req, res) {
	// 2.1 如果请求 gzip 资源，跳过压缩，比如 /js/bundle.js.gz
	if (req.path.indexOf(".gz") !== -1) {
		console.log(req.path, "no neeed to compress");
		res.set("Content-Encoding", "gzip"); // 告诉浏览器服务器端返回 gzip 格式的资源
		return false;
	}
	/* 2.2 如果请求非 gzip 资源，比如 /js/bundle.js, 则 compression 会自动
         帮我们压缩它并添加 Content-Encoding 为 gzip */
	// console.log("neeed to compress");
	return compression.filter(req, res);
}

// json 处理器
app.use(express.json());

// url 编码
app.use(express.urlencoded({ extended: false }));

// cookie解析器
// app.use(cookieParser());

// 输出打包好的静态文件
console.log(__dirname);
app.use(express.static(__dirname));
// app.use(express.static(__dirname));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	next(createError(404));
});

// error handler in dev-mode
app.use(function (err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get("env") === "development" ? err : {};
	// render the error page
	res.status(err.status || 500);
	res.render("error");
});

let port = normalizePort(process.env.PORT || "4000");
// console.log("port is:", port);
app.set("port", port);
let server = http.createServer(app);
server.listen(port);
var getLocalIP = require("./address.js");
console.log(getLocalIP());
console.log(server.address());
let debug = require("debug")("server:server");

server.on("error", onError);
server.on("listening", onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
	let port = parseInt(val, 10);
	if (isNaN(port)) {
		// named pipe
		return val;
	}
	if (port >= 0) {
		// port number
		return port;
	}
	return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
	if (error.syscall !== "listen") {
		throw error;
	}

	let bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

	// handle specific listen errors with friendly messages
	switch (error.code) {
		case "EACCES":
			console.error(bind + " requires elevated privileges");
			process.exit(1);
			break;
		case "EADDRINUSE":
			console.error(bind + " is already in use");
			process.exit(1);
			break;
		default:
			throw error;
	}
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
	let addr = server.address();
	let bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
	debug("Listening on " + bind);
}

module.exports = app;
