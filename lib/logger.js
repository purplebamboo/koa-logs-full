var logfilestream = require('logfilestream');
var chalk = require('chalk');
var STYLES = chalk.styles;
var _ = require('lodash');


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
    nameformat: '[' + env + '.]YYYY-MM-DD[.log]'
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
    return str.replace(/\{\{\#([^}]+)\}\}([^{]+)\{\{\/([^}]+)\}\}/g, function($0, $1, $2) {

      if (!_.has(STYLES, $1)) return $0;
      return STYLES[$1].open + $2 + STYLES[$1].close;

    })
  }

  function _generateLogger(cache) {

    var logger = {};
    var msg = '';

    LOG_TYPES.forEach(function(typeObj) {

      logger[typeObj.type] = function(str, notNeedSpacing) {

        if (!notNeedSpacing) str = '  ' + str;

        str = _renderColor(str);
        msg = chalk[typeObj.color](str);

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