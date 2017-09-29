const IOTA = require('iota.lib.js')
const constants = require('./constants')
const errors = require('./errors')
const iota = new IOTA()

function getAddress (seed, index, security = constants.SECURITY_LEVEL, checksum = false) {
  if (!index) {
    throw new Error(errors.UNDEFINED_INDEX)
  }
  const address = iota.api._newAddress(seed, index, security, checksum)
  return {
    address,
    index,
    security
  }
}

function validate (seed, address) {
  if (!iota.valid.isTrytes(seed)) {
    throw new Error(errors.INVALID_SEED)
  }
  if (!iota.valid.isAddress(address.address)) {
    throw new Error(errors.INVALID_ADDRESS)
  }
  return getAddress(seed, address.index, address.security, false) === iota.utils.noChecksum(address.address)
}

function isSpent (iota, addresses) {
}

module.exports = {
  getAddress,
  validate,
  isSpent
}
