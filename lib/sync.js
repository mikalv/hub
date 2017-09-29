const pify = require('pify')
const constants = require('./constants')
const { getNewAddress } = require('./address')

// TODO:  - recover state in syncFromSeed()
//        - deal witht missing txs after snapshots

function sync (iota, transactions, inputs, addresses) {
  const getLatestInclusion = pify(iota.api.getLatestInclusion.bind(iota.api))
  const mapHashes = {}
  const hashes = []
  transactions.forEach((tx, i) => {
    tx.hashes.forEach(hash => {
      mapHashes[hash] = i
      hashes.push(hash)
    })
  })
  return getLatestInclusion(hashes)
  .then(states => {
    states.forEach((confirmed, i) => {
      if (confirmed) {
        const j = mapHashes[hashes[i]]
        transactions[j].confirmed = true
        if (inputs) {
          transactions[j].transfers.forEach(transfer => {
            const destinationIndex = inputs.findIndex(input => input.address === transfer.address)
            if (destinationIndex !== -1) {
              inputs[destinationIndex].pendingTransactions -= 1
            }
          })
        }
        if (addresses) {
          transactions[j].inputs.forEach(input => {
            const addressIndex = addresses.findIndex(address => address.address === input.address)
            if (addressIndex !== -1 && 'spending' in addresses[addressIndex]) {
              addresses[addressIndex].spending -= input.balance
            }
          })
        }
      }
    })
    const confirmed = getConfirmedTransactions(transactions)
    const pending = getPendingTransactions(transactions)
    const result = {
      confirmed: confirmed,
      pending: pending
    }
    if (addresses) {
      result.addresses = [...addresses]
    }
    if (inputs) {
      result.inputs = [...inputs]
    }
    return result
  })
}

function getConfirmedTransactions (transactions) {
  return [...transactions].filter(tx => tx.confirmed)
}

function getPendingTransactions (transactions) {
  return [...transactions].filter(tx => !tx.confirmed)
}

function updateBalances (iota, addresses) {
  const addressesCopy = [...addresses]
  return _updateBalances(iota, addressesCopy)
}

function _updateBalances (iota, addresses) {
  const getBalances = pify(iota.api.getBalances.bind(iota.api))
  return getBalances(addresses.map(obj => obj.address), 100)
  .then(balances => {
    return addresses.map((address, i) => {
      address.balance = balances[i]
      return address
    })
  })
}

function syncFromSeed (iota, seed, {security = constants.SECURITY, start = 0, end = constants.MAX_INDEX_TO_SCAN}) {
  const findTransactionObjects = pify(iota.api.findTransactionObjects, iota.api)
  security = Array.isArray(security) ? security : [security]
  const addresses = []
  let index = start
  while (index <= end) {
    for (const level of security) {
      addresses.push(getNewAddress(seed, index, level, false))
    }
    index++
  }
  _updateBalances(addresses).filter(address => address.balance !== 0)
  findTransactionObjects()
  .then(txs => {
    if (txs.reduce((sum, tx) => sum + tx, 0) === 0) {
      return txs
    }
    // update spending & pendingTransactions on addresses
    // categorize unspent addresses as inputs
    // construct pending sweeps
  })
}

module.exports = {
  sync,
  getPendingTransactions,
  getConfirmedTransactions,
  updateBalances,
  //syncFromSeed
}
