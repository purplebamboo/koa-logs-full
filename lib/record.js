//处理logo日志
//由于nodejs是单进程单线程的，所以多个请求时，由于时间差。可能造成logo混乱的问题。
//
//使用：
//var logRecord = require('./lib/logger.js');
//
//app.use(logRecord({
//   logdir: path.join(__dirname, 'logs'),
//   exportGlobalLogger:true,
//   env:'development'
// }));
//
//这样就可以 this.logger.log
//
//
var assert = require('assert');
var libLoggerFactory = require('./logger.js');
var RECORD;
var libLoggerInstance;

//var ShowError;

var Logdir;
var Env;
/**
 * Show the response time in a human readable format.
 * In milliseconds if less than 10 seconds,
 * in seconds otherwise.
 */

function _time(start) {
  var delta = new Date - start;
  delta = delta < 10000 ? delta + 'ms' : Math.round(delta / 1000) + 's';
  return delta;
}



var filter = function*(next) {
  //记录基础的请求时间,跳过静态资源
  //参考koa-logger
  var ctx = this;
  var start = new Date;
  var staticExt = /(.js)|(.html)|(.css)|(.ico)/;
  var logsMemory = []; //logs缓存，打log不会真的输出，而是记录

  ctx.logger = libLoggerInstance.generate(logsMemory);

  if (!staticExt.test(this.url)) {
    ctx.logger.log("\n\nStarted " + ctx.method + "   " + ctx.url + " for " + ctx.ip + "at " + new Date,true);
    ctx.query && ctx.logger.log("{{#magenta}}query{{/magenta}}:" + JSON.stringify(ctx.query));
    ctx.request.body && ctx.logger.log("{{#magenta}}body{{/magenta}}:" + JSON.stringify(ctx.request.body));
  }

  try{
    yield next
  }catch(err){

    this.logger.error(err.stack.replace(/^/gm, '  ')+'\n\n');
    this.logger.flush();

    ctx.throw(err);
  }

  if (staticExt.test(this.url)) return;

  var res = this.res;

  var onfinish = done.bind(null, 'finish');
  var onclose = done.bind(null, 'close');

  res.once('finish', onfinish);
  res.once('close', onclose);

  function done(event) {
    res.removeListener('finish', onfinish);
    res.removeListener('close', onclose);

    ctx.logger.log("Completed in " + _time(start) + "  " + ctx.status + "\n\n\n\n",true);
    ctx.logger.flush();

  }

}


RECORD = function(app,options) {

  //重置错误消息处理
  //koa 如果发现没有监听error事件，会默认生成一个所有错误打到console的错误处理。
  //我们要重置掉。
  app.on('error',function(err){

  })

  options = options || {};

  Logdir = options.logdir || path.join('./', 'logs');
  Env = options.env || process.env.NODE_ENV || "development";

  libLoggerInstance = libLoggerFactory({
    logdir:Logdir,
    env:Env
  });

  //暴露logger到全局
  if (options.exportGlobalLogger) {
    global.logger = libLoggerInstance.generate();
  }

  return filter;
}

module.exports = RECORD;