const constants     = require('./constants');
const sweepTransfer = require('./sweepTransfer');
const getInputWithLowestValue = require('./transfer').getInputWithLowestValue;

function process(iota, seed, inputs, sweeps, addresses, destination, batchSize) {
  return updateBalances(iota, addresses).then(() => {
    return sweep(iota, seed, inputs, sweeps, addresses, getAddressesWithBalance(addresses), destination, batchSize);
  });
}

function sweep(iota, seed, inputs, sweeps, addresses, addressesToSweep, destination, batchSize) {
  const destination = desitnation || getInputWithLowestValue(inputs);
  const destinationIndex = inputs.findIndex(input => input.address === destination);
  // TODO: check for pending/spending txs
  inputs[destinationIndex].pendingTransactions = (inputs[destinationIndex].pendingTransaction || 0) + 1;
  batchSize = batchSize || constants.MAX_TXS_PER_BUNDLE;
  const batches = [];
  while(addressesToSweep.length > 0) {
    addressesToSweep.filter(add.splice(0, batchSize).forEach(addressToSweep => {
      const addressesIndex = addresses.findIndex(address => address.address == addressToSweep.address);
      if (addressesIndex !== -1) {
        addresses[addressesIndex].spending = (addresses[addressesIndex].spending || 0) + addressToSweep.value;
      }
    }));
    batches.push({
      'inputs': batch,
      'value': batch.reduce((sum, address) => sum + getUnspentBalance(address)),
      'transfers': [{
        'address': destination.address,
        'value': sweep.value 
      }]
    });
  }
  batches.map(sweep => {
    const options = {
      'inputs': sweep.inputs.map(input => {
        'address': input.address,
        'keyIndex':  input.keyIndex,
        'security': 'security' in input ? sweep.address.security : 2,
        'value': getUnspentBalance(input)
      }),
      'value': sweep.value
    };
    return sweepTransfer(iota, seed, sweep.transfers, options).then(trytes => {
      sweep.trytes = trytes;
      sweeps.push(sweep);
      return sweep;
    }).catch(err => {
      if (destinationIndex !== -1) {
        inputs[destinationIndex].pendingTransactions--;
      }
      sweep.error = err;
      return sweep;
    });

  });
  return Promise.all(batches);
}

function updateBalances(iota, addresses) {
  return iota.api.getBalances(addresses.map(obj => obj.address), 100).then(balances => {
    addresses = addresses.map((address, i) => {
      address.value = balances[i];
      return address;
    });
    return balances;
  });
}

function getAddressesWithBalance(addresses) {
  return addresses.filter(address => getUnspentBalance(address) > 0);
}


function getUnspentBalance(address) {
  return address.value - (address.spending || 0);
}

module.exports = {
  'process': process,
  'sweep': sweep,
  'updateBalances': updateBalances,
  'getAddressesWithBalance': getAddressesWithBalance,
  'replaySweeps': replaySweeps,
  'getUnspentBalance': getUnspentBalance
};
