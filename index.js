module.exports = {
  'hub'                 : require('./lib/hub').Hub,
  'getAddress'          : require('./lib/hub').getAddress,
  'process'             : require('./lib/process').process,
  'sweep'               : require('./lib/process').sweep,
  'updateBalances'      : require('./lib/process').updateBalances,
  'replaySweeps'        : require('./lib/process').replaySweeps,
  'getUnspentBalance'   : require('./lib/process').getUnspentBalance,
  'sync'                : require('./lib/sync'),
  'transfer'            : require('./lib/transfer').tranfer,
  'getPendingTransfers' : require('./lib/transfer').getPendingTransfers,
  'replayTransfer'      : require('./lib/transfer').replayTransfer
};
