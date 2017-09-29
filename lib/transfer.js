const pify = require('pify')
const { updateBalances } = require('./sync')
const prepareTransfers = require('./prepareTransfers')
const errors = require('./errors')

function transfer (iota, seed, inputs, transfers, options) {
  options = options || {}
  if (options.inputs && options.inputs.some(inputs.pendingTransactions > 0)) {
    throw new Error(errors.PENDING_TRANSFERS)
  }
  const totalValue = transfers.reduce((sum, tx) => sum + tx.value, 0)
  const fundingInputs = options.inputs ? options.inputs : getInputs(inputs, totalValue).inputs
  if (fundingInputs.length === 0) {
    throw new Error(errors.NO_AVAILABLE_INPUTS)
  }
  const inputsCopy = [...inputs].filter(input => fundingInputs.findIndex(fundingInput => fundingInput.address === input.address) === -1)
  return updateBalances(iota, fundingInputs)
  .then(fundingInputs => {
    const remainderAddress = options.remainderAddress ? options.remainderAddress.address : getInputWithLowestValue(inputs).address
    const remainderAddressIndex = inputs.findIndex(input => input.address === remainderAddress)
    if (options.remainderAddress && remainderAddressIndex === -1) {
      throw new Error(errors.REMAINDER_NOT_IN_INPUTS)
    }
    inputs[remainderAddressIndex].pendingTransactions = (inputs[remainderAddressIndex].pendingTransactions || 0) + 1
    const trytes = prepareTransfers(seed, transfers, fundingInputs, remainderAddress, options)
    return {
      trytes,
      inputs: inputsCopy
    }
  })
}

function getInputs (inputs, value) {
  let confirmedInputs = [...inputs].filter(input => input.pendingTransactions === 0 && input.balance > 0)
  if (confirmedInputs.length === 0) {
    throw new Error(errors.NO_AVAILABLE_INPUTS)
  }
  if (confirmedInputs.reduce((sum, input) => sum + input.balance, 0) < value) {
    throw new Error(errors.INSUFFICIENT_BALANCE)
  }
  const byOptimalValue = (a, b, diff) => Math.abs(diff - a.balance) - Math.abs(diff - b.balance)
  const collectedInputs = []
  let balance = 0
  let diff = value
  while (diff > 0) {
    confirmedInputs.sort((a, b) => byOptimalValue(a, b, diff))
    const input = confirmedInputs.shift()
    collectedInputs.push(input)
    balance += input.balance
    diff = value - balance
  }
  return {
    inputs: collectedInputs,
    balance: balance
  }
}

function getInputWithLowestValue (inputs) {
  return [...inputs].sort((a, b) => a.balance - b.balance)[0]
}

function sendTrytes (iota, trytes, depth, minWeightMagnitude) {
  if (trytes[0] && !Array.isArray(trytes[0])) {
    trytes = [trytes]
  }
  const sendTrytes = pify(iota.api.sendTrytes.bind(iota.api))
  return Promise.all([...trytes].map((transfer, i) => sendTrytes(trytes, depth, minWeightMagnitude)
    .then(bundle => ({
      bundle,
      hashes: [{
        hash: bundle[0].hash,
        timestamp: bundle[0].timestamp,
        attachmentTimestamp: bundle[0].attachmentTimestamp
      }]
    }))
    .catch(err => {
      console.log(err.stack || err)
      return null
    })
  ))
  .then(txs => {
    const transactions = []
    const pending = []
    txs.forEach((tx, i) => {
      if (tx) {
        transactions.push(tx)
      } else {
        pending.push([...trytes[i]])
      }
    })
    return {transactions, pending}
  })
}

function isReattachable (iota, hashes) {
  hashes = Array.isArray(hashes) ? hashes : [hashes]
  const getBundle = pify(iota.api.getBundle.bind(iota.api))
  const getBalances = pify(iota.api.getBalances.bind(iota.api))
  return Promise.all(hashes.map(hash => getBundle(hash)
  .then(bundle => {
    const inputs = bundle.filter(tx => tx.value < 0).map(tx => tx.address)
    const value = bundle.filter(tx => tx.value > 0).reduce((sum, tx) => sum + tx.value, 0)
    return getBalances(inputs, 100)
    .then(balances => balances.balances.reduce((sum, balance) => sum + parseInt(balance), 0) >= value)
  })
  .catch(err => {
    console.log(err.stack || err)
    return null
  })))
}

function reattach (iota, transactions, depth, minWeightMagnitude) {
  const replayBundle = pify(iota.api.replayBundle.bind(iota.api))
  return isReattachable(iota, [...transactions].map(tx => tx.hashes[0]))
  .then(reattachable => Promise.all([...transactions].map((tx, i) => {
    if (reattachable[i]) {
      return replayBundle(tx.hashes[0], depth, minWeightMagnitude)
      .then(bundle => {
        tx.hashes.push({
          hash: bundle[0].hash,
          timestamp: bundle[0].timestamp,
          attachmentTimestamp: bundle[0].attachmentTimestamp
        })
        return tx
      })
      .catch(err => {
        console.log(err.stack || err)
        return tx
      })
    }
    tx.isReattachable = false
    return tx
  })))
}

module.exports = {
  transfer,
  sendTrytes,
  getInputs,
  getInputWithLowestValue,
  isReattachable,
  reattach
}
