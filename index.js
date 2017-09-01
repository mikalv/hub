module.exports = {
  'getAddress'              : require('./lib/address').getAddress,
  'process'                 : require('./lib/process').process,
  'sweep'                   : require('./lib/process').sweep,
  'updateBalances'          : require('./lib/process').updateBalances,
  'replay'                  : require('./lib/transfer').replay,
  'getUnspentBalance'       : require('./lib/process').getUnspentBalance,
  'getAddressesWithBalance' : require('./lib/process').getAddressesWithBalance,
  'sync'                    : require('./lib/sync').sync,
  'getPendingTrasnactions'  : require('./lib/sync').getPendingTransactions,
  'transfer'                : require('./lib/transfer').transfer,
  'getInputs'               : require('./lib/transfer').getInputs
};
