const process = require('./process');
const sync    = require('./sync');
const IOTA    = require('iota.lib.js');
const iota    = new IOTA();

function Hub({id = 0, seed = 0, name = 'hub', security = 2, host = 'http://localhost', port = 14700}) {
  if (!(this instanceof Hub)) {
    return new Hub(options); 
  }
  if (!seed || iota.valid.isTrytes(seed)) {
    throw new Error(errors.INVALID_SEED);
  }
  if (security < 1 || security > 3) {
    throw new Error(errors.INVALID_SECURITY_LEVEL);
  }
  this.id = id;
  this.name = name;
  this.seed = seed;
  this.security = security;
  this.iota = new IOTA({
    'host': host,
    'port': port
  });
}


function getAddress(hub, {index, security, checksum = false, ...props}) {
  if (!index) {
    throw new Error('Provide an index')
  }
  if (!security) {
    security = hub.security;
  }
  return {
    'address': hub.iota.api._newAddress(hub.seed, index, security, checksum),
    'index': index,
    'security': security,
    'props': ...props
  }
}

module.exports = {
  'hub'        : Hub,
  'getAddress' : getAddress
};
