var logfilestream = require('logfilestream');
var chalk = require('chalk');
var STYLES = chalk.styles;
var _ = require('lodash');
var _renderPrintf = require('printf');


var LOG_TYPES = [{
  type: 'log',
  color: 'white'
}, {
  type: 'error',
  color: 'red'
}, {
  type: 'info',
  color: 'green'
}, {
  type: 'warn',
  color: 'yellow'
}]


function Log(options) {
  var logDir = options.logdir || './logs';
  var env = options.env || process.env.NODE_ENV || "development";

  var writestream = logfilestream({
    logdir: logDir,
    nameformat: '[' + env + '.]YYYY-MM-DD[.log]',
    mkdir:true
  })


  function _write(str) {
      //only development env will output to console
      if (env === 'development') {
        console.log(str);
      }
      writestream.write(str);
    }
    //"{{#red}}{{/red}}"
  function _renderColor(str) {

    return str.replace(/\{\{([#\/])([^}]+)\}\}/g, function($0, $1, $2) {
      if (!_.has(STYLES, $2)) return $0;

      if ($1=='#') return STYLES[$2].open;
      if ($1=='/') return STYLES[$2].close;

    })
  }

  function _generateLogger(cache) {

    var logger = {};
    var msg = '';

    LOG_TYPES.forEach(function(typeObj) {

      logger[typeObj.type] = function() {

        //if (!notNeedSpacing) str = '  ' + str;
        //c风格的输出转换
        var msg = _renderPrintf.apply(this,arguments);
        //标签颜色转换
        msg = _renderColor(msg);
        //当前日志类型的总颜色转换
        msg = chalk[typeObj.color](msg);

        if (cache) {
          cache.push(msg);
        } else {
          _write(msg);
        }

      }
    })

    if (cache) {
      logger.flush = function() {
        cache.forEach(function(msg) {
          _write(msg);
        })
      }
    }

    return logger;
  }

  return {
    //如果有cache代表需要做异步处理
    generate: function(cache) {
      return _generateLogger(cache);
    }
  }
}

module.exports = Log;