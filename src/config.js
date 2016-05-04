var argv = require('yargs').argv;
var localconfig = null
try {
  localconfig = require('./config.local')
}
catch(e) {}

function config() {

}

config.get = function get(param) {
  return argv[param] || process.env['GWS_' + param.toUpperCase()] || process.env[param.toUpperCase()] || (localconfig ? localconfig[param] : null)
}

config.getport = function getport() {
  return argv['port'] || process.env.PORT || 9999
}

module.exports = config