const constants = require('./constants')

function getAddress (iota, seed, index, security = constants.SECURITY_LEVEL, checksum = false) {
  if (!index) {
    throw new Error('Provide an index')
  }
  return {
    'address': iota.api._newAddress(seed, index, security, checksum),
    'index': index,
    'security': security
  }
}

function isSpent (iota, address) {
  return iota.api.findTransactionObjects({'addresses': [address]}).then(txs => txs.findIndex(tx => tx.value < 0) !== -1)
}

module.exports = {
  'getAddress': getAddress,
  'isSpent': isSpent
}
