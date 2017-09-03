const { getAddress, isSpent } = require('./lib/address')
const { getAddressesWithBalance, getUnspentBalance, process, sweep } = require('./lib/process')
const { getConfirmedTransactions, getPendingTransactions, sync, updateBalances } = require('./lib/sync')
const { getInputs, getInputWithLowestValue, isReattachable, replay, sendTrytes, transfer } = require('./lib/transfer')

module.exports = {
  getAddress,
  isSpent,
  process,
  sweep,
  getUnspentBalance,
  getAddressesWithBalance,
  sync,
  getPendingTransactions,
  getConfirmedTransactions,
  updateBalances,
  transfer,
  sendTrytes,
  getInputs,
  getInputWithLowestValue,
  replay,
  isReattachable
}
