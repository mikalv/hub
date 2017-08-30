module.exports = {
  'getAddress'              : require('./lib/address').getAddress,
  'process'                 : require('./lib/process').process,
  'sweep'                   : require('./lib/process').sweep,
  'updateBalances'          : require('./lib/process').updateBalances,
  'replaySweeps'            : require('./lib/process').replaySweeps,
  'getUnspentBalance'       : require('./lib/process').getUnspentBalance,
  'getAddressesWithBalance' : require('./lib/process').getAddressesWithBalance,
  'sync'                    : require('./lib/sync'),
  'transfer'                : require('./lib/transfer').tranfer,
  'getPendingTransfers'     : require('./lib/transfer').getPendingTransfers,
  'replayTransfer'          : require('./lib/transfer').replayTransfer
};
