const constants     = require('./constants');
const sweepTransfer = require('./sweepTransfer');

function process(iota, seed, inputs, sweeps, addresses, destination, batchSize = constants.MAX_TXS_PER_BUNDLE - 1) {
  return updateBalances(iota, addresses).then(() => {
    return sweep(iota, seed, inputs, sweeps, addresses, getAddressesWithBalance(addresses), destination, batchSize);
  });
}

function sweep(iota, seed, inputs, sweeps, addresses, addressesToSweep, destination, batchSize = constants.MAX_TXS_PER_BUNDLE - 1) {
  const destinationIndex = inputs.findIndex(input => input.address === destination);
  const batches = [];
  while(addressesToSweep.length > 0) {
    addressesToSweep.filter(add.splice(0, batchSize).forEach(addressToSweep => {
      const addressesIndex = addresses.findIndex(address => address.address == addressToSweep.address);
      if (addressesIndex !== -1) {
        addresses[addressesIndex].spending = addressToSweep.balance;
      }
    }));
    batches.push({
      'inputs': batch,
      'value': batch.reduce((sum, address) => sum + getUnspentBalance(address)),
      'destination': destination
    });
    if (destinationIndex !== -1) {
      inputs[destinationIndex].pendingTransactions++;
    }
  }
  batches.map(sweep => {
    const transfers = [{
      'address': destination.address,
      'value': sweep.value 
      'message': '',
      'tag': ''
    }];
    const options = {
      'inputs': sweep.inputs.map(input => {
        'address': input.address,
        'keyIndex':  input.keyIndex,
        'security': 'security' in input ? sweep.address.security : 2,
        'value': getUnspentBalance(input)
      }),
      'value': sweep.value
    };
    return sweepTransfer(iota, seed, constants.DEPTH, constands.MWM, transfers, options).then(tx => {
      sweep.hashes.push({
        'hash': tx.hash,
        'timestamp': tx.timestamp
      });
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
      address.balance = balances[i];
      return address;
    });
    return balances;
  });
}

function getAddressesWithBalance(addresses) {
  return addresses.filter(address => getUnspentBalance(address) > 0);
}

function replaySweeps(iota, transactions, replayList) {
  return Promise.all(replayList.map(replay => {
    return iota.api.isReattachable(replay.inputs.map(input => input.address)).then(isReattachable => {
      const sweepIndex = sweeps.findIndex(sweep => sweep.hashes[0].hash == replay.hashes[0].hash);
      if (isReattachable) {
        return iota.api.replayBundle(tail, constants.DEPTH, constants.MWM).then(tx => {
          const hash = {
            'hash': tx.hash,
            'timestamp': tx.timestamp
          };          
          if (sweepIndex !== -1) {
            sweeps[sweepIndex].hashes.push(hash);
          }
          replay.hashes.push(hash);
          return replay;
        });
      }
      if (sweepIndex !== -1) {
        sweeps[sweepIndex].isReattachable = false;
      }
      replay.isReattachable = false;
      return replay;
    }).catch(err => {
      replay.error = err;
      return replay;
    });
  }));
}

function getUnspentBalance(address) {
  return address.balance - ('spending' in address ? address.spending : 0);
}

module.exports = {
  'process': process,
  'sweep': sweep,
  'updateBalances': updateBalances,
  'getAddressesWithBalance': getAddressesWithBalance,
  'replaySweeps': replaySweeps,
  'getUnspentBalance': getUnspentBalance
};
