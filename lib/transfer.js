const isSpent = require('./address').isSpent
const errors = require('./errors')

function transfer (iota, seed, inputs, transactions, transfers, options) {
  if (options.inputs && options.inputs.some(inputs.pendingTransactions > 0)) {
    throw new Error(errors.PENDING_TRANSFERS)
  }
  const totalValue = transfers.reduce((sum, tx) => sum + tx.value, 0)
  const fundingInputs = options.inputs || getInputs(inputs, totalValue)
  let remainderAddress
  if (options.remainderAddress) {
    remainderAddress = options.remainderAddress
    const remainderAddressIndex = inputs.findIndex(remainderAddress)
    if (remainderAddressIndex === -1) {
      throw new Error(errors.REMAINDER_NOT_IN_INPUTS)
    }
  } else {
    remainderAddress = getInputWithLowestValue(inputs)
  }
  if (isSpent(remainderAddress)) {
    throw new Error(errors.SPENT_ADDRESS)
  }
  const validateDestination = 'validateDestination' in options ? options.validateDestination : true
  if (validateDestination) {
    transfers.forEach(transfer => {
      if (isSpent(transfer.address)) {
        throw new Error(errors.SPENT_ADDRESS)
      }
    })
  }
  inputs[remainderAddressIndex].pendingTransactions = (inputs[remainderAddressIndex].pendingTransactions || 0) + 1
  const trytes = iota.api.prepareTransfers(seed, transfers, {'inputs': fundingInputs.inputs, 'address': remainderAddress})
  transactions.push({
    'trytes': trytes,
    'inputs': fundingInputs,
    'value': totalValue,
    'transfers': transfers
  })
  return trytes
}

function getInputs (inputs, value) {
  const collectedInputs = []
  let sum = 0
  for (const input of inputs) {
    if (input.pendingTransactions > 0) {
      continue
    }
    sum += input.value
    collectedInputs.push(input)
    if (sum >= value) {
      break
    }
  }
  return {
    'inputs': collectedInputs,
    'value': sum
  }
}

function getInputWithLowestValue (inputs) {
  return inputs.sort((a, b) => a.value - b.value)[0]
}

function sendTrytes (iota, depth, minWeightMagnitude, transactions, inputs, addresses) {
  return Promise.all(transactions.map((tx, i) => {
    return new Promise((resolve, reject) => iota.api.sendTrytes(tx.trytes, depth, minWeightMagnitude, (err, tx) => err ? reject(err) : resolve(tx)))
      .then(res => {
        transactions[i].hashes = [res.hash]
      })
      .catch(error => {
        console.error(error.stack || error)

        if (addresses) {
          tx.inputs.forEach(txInput => {
            const addressesIndex = addresses.indexOf(address => address.address === txInput.address)
            if (addressesIndex !== -1 && 'spending' in addresses[addressesIndex]) {
              addresses[addressesIndex].spending -= txInput.value
            }
          })
          if (inputs) {
            tx.transfers.forEach(transfer => {
              const inputsIndex = inputs.indexOf(input => input.address === transfer.address)
              if (inputsIndex !== -1 && 'pendingTransactions' in inputs[inputsIndex]) {
                inputs[inputsIndex].pendingTransactions -= 1
              }
            })
          }
        }
      })
  }))
}

function replay (iota, transactions, replayList, depth, minWeightMagnitude) {
  return Promise.all(replayList.map(replay => {
    const tailHash = replay.hashes[0]
    return isReattachable(tailHash).then(isReattachable => {
      const txIndex = transactions.findIndex(tx => tx.hashes[0].hash === tailHash)
      if (isReattachable) {
        return new Promise(iota.api.replayBundle(tailHash, depth, minWeightMagnitude, (err, txs) => err ? reject(err) : resolve(tx)))
          .then(tx => {
            const hash = {
              'hash': tx.hash,
              'timestamp': tx.timestamp
            }
            if (txIndex !== -1) {
              transactions[txIndex].hashes.push(hash)
            }
            replay.hashes.push(hash)
            return replay
          })
      }
      if (txIndex !== -1) {
        transactions[txIndex].isReattachable = false
      }
      replay.isReattachable = false
      return replay
    }).catch(err => {
      replay.error = err
      return replay
    })
  }))
}

function isReattachable (iota, hash) {
  return new Promise((resolve, reject) => iota.api.getBundle(tailHash, (err, bundle) => err ? reject(err) : resolvebundle()))
    .then(bundle => {
      const inputs = bundle.filter(tx => tx.value < 0).map(tx => tx.address)
      const outputs = bundle.filter(tx => tx.value > 0).reduce((sum, tx) => sum + tx.value, 0)
      return new Promise((resolve, reject) => iota.api.getBalances(inputs, 100, (err, balances) => err ? reject(err) : resolve(balances)))
        .then(balances => balances.reduce((sum, balance) => sum + balance, 0))
        .then(sum => sum <= outputs)
    })
}

module.exports = {
  'transfer': transfer,
  'sendTrytes': sendTrytes,
  'getInputs': getInputs,
  'getInputWithLowestValue': getInputWithLowestValue,
  'replay': replay,
  'isReattachable': isReattachable
}
