const pify = require('pify')

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
                addresses[addressIndex].spending -= input.value
              }
            })
          }
        }
      })
      const confirmedSweeps = getConfirmedTransactions(transactions)
      transactions = getPendingTransactions(transactions)
      return confirmedSweeps
    })
}

const confirmedTransactionsFilter = tx => 'confirmed' in tx ? tx.confirmed : false

function getConfirmedTransactions (transactions) {
  return transactions.filter(confirmedTransactionsFilter)
}

function getPendingTransactions (transactions) {
  return transactions.filter(tx => !confirmedTransactionsFilter(tx))
}

function updateBalances (iota, addresses) {
  return new Promise((resolve, reject) => iota.api.getBalances(addresses.map(obj => obj.address), 100, (err, balances) => err ? reject(err) : resolve(balances)))
    .then(balances => {
      addresses = addresses.map((address, i) => {
        address.value = balances[i]
        return address
      })
      return balances
    })
}

module.exports = {
  sync,
  getPendingTransactions,
  getConfirmedTransactions,
  updateBalances
}
