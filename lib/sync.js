function sync(iota, inputs, transactions, addresses) {
  const mapHashes = {};
  const hashes = [];
  transactions.forEach((tx, i) => {
    tx.hashes.forEach(hash => {
      mapHashes[hash] = i;
      hashes.push(hash);
    })
  });
  return iota.api.getLatestInclusion(hashes).then(states => {
    states.each((confirmed, i) => {
      if (confirmed) {
        const j = mapHashes[hashes[i]];
        transactions[j].confirmed = true;
        const destinationIndex = inputs.findIndex(input => input.address == transactions[j].destination);
        inputs[destinationIndex].pendingTransactions -= 1;
        if (addresses) {
          transactions[j].inputs.forEach(input => {
            const addressesIndex = addresses.findIndex(address => address.address == input.address);
            if (addressIndex !== -1) {
              addresses[addressIndex].spending -= input.value; 
            }
          })
        }
      }
    });
    const confirmed = getConfirmedTransactions(transactions);
    transactions = getPendingTransactions(transactions);
    return confirmedSweeps;
  });
}

const confirmedTransactionsFilter = tx => 'confirmed' in tx ? tx.confirmed : false;

function getConfirmedTransactions() {
  return sweeps.filter(confirmedTransactionsFilter);
}

function getPendingTransactions() {
  return sweeps.filter(tx => !confirmedTransactionsFilter(tx));
}

module.exports = {
  'sync': sync,
  'getPedningTransactions': getPendingTransactions,
  'getConfirmedSweeps': getConfirmedTransactions
};
