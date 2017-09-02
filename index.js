module.exports = {
  'getAddress': require('./lib/address').getAddress,
  'isSpent': require('./lib/address').isSpent,
  'process': require('./lib/process').process,
  'sweep': require('./lib/process').sweep,
  'updateBalances': require('./lib/process').updateBalances,
  'getUnspentBalance': require('./lib/process').getUnspentBalance,
  'getAddressesWithBalance': require('./lib/process').getAddressesWithBalance,
  'sync': require('./lib/sync').sync,
  'getPendingTransactions': require('./lib/sync').getPendingTransactions,
  'getConfirmedTransactions': require('./lib/sync').getConfirmedTransactions,
  'transfer': require('./lib/transfer').transfer,
  'sendTrytes': require('./lib/transfer').sendTrytes,
  'getInputs': require('./lib/transfer').getInputs,
  'getInputWithLowestValue': require('./lib/').getInputWithLowestValue,
  'replay': require('./lib/transfer').replay,
  'isReattachable': require('./lib/transfer').isReattachable
}
