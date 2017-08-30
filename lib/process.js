const constants     = require('./constants');
const sweepTransfer = require('./sweepTransfer');

function process(iota, seed, addresses, sweeps, inputs, destination, batchSize = constants.MAX_INPUTS_PER_SWEEP) {
  return updateBalances(iota, addresses).then(() => {
    return sweep(iota, seed, addresses, sweeps, inputs, getAddressesWithBalance(addresses), destination, batchSize);
  });
}

function sweep(iota, seed, addresses, sweeps, inputs, toSweep, destination, batchSize = constants.MAX_INPUS_PER_SWEEP) {
  const destinationIndex = inputs.findIndex(input => input.address == destination);
  const batches = [];
  while(toSweep.length > 0) {
    const batch = toSweep.splice(0, batchSize);
    batch.forEach(addressToSweep => {
      const addressesIndex = addresses.findIndex(address => address.address == addressToSweep.address);
      if (addressesIndex !== -1) {
        const spending = getUnspentBalance(addressToSweep);
        addresses[addressesIndex].spending = 'spending' in addresses[addressesIndex] ? addresses[addressesIndex].spending + spending : spending;
      }
    });
    batches.push({
      'inputs': batch,
      'value': batch.reduce((sum, address) => sum + getUnspentBalance(address)),
      'destination': destination
    });
     if (destinationIndex !== -1) {
      inputs[destinationIndex].pendingSweeps++;
    }
  }
  batches.map((sweep) => {
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
    return sweepTransfer(iota, seed, transfers, options).then(tx => {
      sweep.hashes.push({
        'hash': tx.hash,
        'timestamp': tx.timestamp
      });
      sweeps.push(sweep);
      return sweep;
    }).catch(err => {
      if (destinationIndex !== -1) {
        inputs[destinationIndex].pendingSweeps--;
      }
      return err;
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

function replaySweeps(iota, sweeps, replayList) {
  return Promise.all(replayList.map(replay => {
    return iota.api.isReattachable(inputs.map(input => input.address)).then(isReattachable => {
      if (isReattachable) {
        return iota.api.replayBundle(tail, constants.DEPTH, constants.MWM).then(tx => {
          const hash = {
            'hash': tx.hash,
            'timestamp': tx.timestamp
          };
          const sweepIndex = sweeps.findIndex(sweep => sweep.hashes[0].hash == replay.hashes[0].hash);
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
