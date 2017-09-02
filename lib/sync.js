function sync (iota, inputs, transactions, addresses) {
  const mapHashes = {}
  const hashes = []
  transactions.forEach((tx, i) => {
    tx.hashes.forEach(hash => {
      mapHashes[hash] = i
      hashes.push(hash)
    })
  })
  return new Promise((resolve, reject) => iota.api.getLatestInclusion(hashes, (err, state) => err ? reject(err) : resolve(states)))
    .then(states => {
      states.each((confirmed, i) => {
        if (confirmed) {
          const j = mapHashes[hashes[i]]
          transactions[j].confirmed = true
          transactions[j].transfer.forEach(transfer => {
            const destinationIndex = inputs.findIndex(input => transfer.address === transactions[j].destination)
            if (destinationIndex !== -1) {
              inputs[destinationIndex].pendingTransactions -= 1
            }
          })
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

function getConfirmedTransactions () {
  return sweeps.filter(confirmedTransactionsFilter)
}

function getPendingTransactions () {
  return sweeps.filter(tx => !confirmedTransactionsFilter(tx))
}

module.exports = {
  'sync': sync,
  'getPedningTransactions': getPendingTransactions,
  'getConfirmedSweeps': getConfirmedTransactions
}
