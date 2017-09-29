const { getAddress, isSpent } = require('./lib/address')
const { getAddressesWithBalance, getUnspentBalance, process } = require('./lib/process')
const { getConfirmedTransactions, getPendingTransactions, sync, updateBalances } = require('./lib/sync')
const { getInputs, getInputWithLowestValue, isReattachable, reattach, sendTrytes, transfer } = require('./lib/transfer')
const errors = require('./lib/errors')

module.exports = {
  getAddress,
  isSpent,
  process,
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
  reattach,
  isReattachable,
  errors
}
