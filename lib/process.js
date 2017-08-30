const constants = require('./constants');
const sweepTransfer = require('./sweepTransfer');

async function process(iota, seed, addresses, sweeps, inputs, destination, batchSize = constants.MAX_INPUTS_PER_SWEEP) {
  await updateBalances(iota, addresses);
  const toSweep = addresses.filter(address => getUnspentBalance(address) > 0);  
  return sweep(iota, seed, addresses, sweeps, inputs, toSweep, destination, batchSize);
}

async function sweep(iota, seed, addresses, sweeps, inputs, toSweep, destination, batchSize = constants.MAX_INPUS_PER_SWEEP) {
  const destinationIndex = inputs.findIndex(input => input.address == destination);
  const batches = [];
  while(toSweep.length > 0) {
    const batch = toSweep.splice(0, batchSize);
    batch.forEach(addressToSweep => {
      const index = addresses.findIndex(address => address.address == addressToSweep.address);
      if (index !== -1) {
        const spending = getUnspentBalance(addressToSweep);
        addresses[index].spending = 'spending' in addresses[index] ? addresses[index].spending + spending : spending;
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
  for(const sweep of batches) {
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
    const tx = await sweepTransfer(iota, seed, transfers, options);
    if (!tx) {
      if (destinationIndex !== -1) {
        inputs[destinationIndex].pendingSweeps--;
      }
      continue;
    }

    sweep.hashes.push({
      'hash': tx.hash,
      'timestamp': tx.timestamp
    });
    sweeps.push(sweep);
  }
}

async function updateBalances(iota, addresses) {
  const balances = await iota.api.getBalances(addresses.map(obj => obj.address), 100);
  addresses = addresses.map(() => {
    address.balance = balances[i];
    return address;
  }); 
}

async function replaySweeps(iota, sweeps, replayList) {
  let i = 0;
  for (sweep of replayList) => {
    const isReattachable = await iota.api.isReattachable(inputs.map(input => input.address));
    if (isReattachable) {
      const tx = await iota.api.replayBundle(tail, constants.DEPTH, constants.MWM);
      if (tx) {
        const sweepIndex = sweeps.findIndex(s => s.hashes[0].hash == sweep.hashes[0].hash);
        const hash = {
          'hash': tx.hash,
          'timestamp': tx.timestamp
        };
        replayList[i].hashes.push(hash);
        sweeps[i].hashes.push(hash); 
      }
    }
    i++;
  }
}

function getUnspentBalance(address) {
  return address.balance - ('spending' in address ? address.spending : 0);
}

module.exports = {
  'process': process,
  'sweep': sweep,
  'updateBalances': updateBalances,
  'replaySweeps': replaySweeps,
  'getUnspentBalance': getUnspentBalance
};
