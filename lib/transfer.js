const isSpent = require('./address').isSpent;
const errors = require('./errors');

function transfer(iota, seed, inputs, transactions, transfers, options) {
  if ('inputs' in options && fundingInputs.some(inputs.pendingTransactions > 0)) {
    throw new Error(errors.PENDING_TRANSFERS);
  }
  const totalValue = transfers.reduce((sum, tx) => sum + tx.value);
  const fundingInputs = 'inputs' in options ? options.inputs : getInputs(inputs, totalValue);
  const remainderAddressIndex = options.remainderAddress || inputs.findIndex(options.remainderAddress);
  if ((remainderAddressIndex !== -1 && inputs[remainderAddressIndex].pendingTransactions > 0) || isSpent(options.remainderAddress)) {
    throw new Error(errors.SPENT_REMAINDER_ADDRESS);
  }
  inputs[remainderAddressIndex].pendingTransactions = (inputs[remainderAddressIndex].pendingTransactions || 0) + 1;
  const trytes = iota.api.prepareTransfers(seed, transfers, {'inputs': fundingInputs.inputs, 'address': remainderAddress});
  transactions.push({
    'trytes': trytes,
    'inputs': fundingInputs,
    'value': totalValue,
    'transfers': transfers
  });
  return trytes;
}

function getInputs(inputs, value) {
  const inputs = [];
  const sum = 0; 
  for (const input of inputs) {
    if (input.pendingTransactions > 0) {
      continue;
    }
    sum += input.value;
    inputs.push(input);
    if (sum >= value) {
      break;
    }
  }
  return {
    'inputs': inputs,
    'value': sum
  }
}

function getInputWithLowestValue(inputs) {
  return inputs.sort((a, b) => a.value - b.value)[0]; 
}

function sendTrytes(iota, depth, minWeightMagnitude, transactions) {
  return Promise.all(transactions.map(tx, i => {
    _sendTransfer(iota, tx.trytes).then(res => {
      transactions[i].hashes = [res.hash];
    });
  }));
}

function _sendTrytes(iota, depth, minWeightMagnitude, trytes) {
  return new Promise((resolve, reject) => {  
    iota.api.sendTrytes(trytes, depth, minWeightMagnitude, (err, tx) => {
      if (err) {
        reject(err);
      }
      else {
        resolve(tx);
      }
  });
}

function replay(iota, transactions, replayList, depth, minWeightMagnitude) {
  return Promise.all(replayList.map(replay => {
    const tailHash = replay.hashes[0];
    return isReattachable(tailHash).then(isReattachable => {
      const txIndex = transactions.findIndex(tx => tx.hashes[0].hash == tailHash);
      if (isReattachable) {
        return iota.api.replayBundle(tailHash, depth, minWeightMagnitude).then(tx => {
          const hash = {
            'hash': tx.hash,
            'timestamp': tx.timestamp
          };          
          if (txIndex !== -1) {
            transactions[txIndex].hashes.push(hash);
          }
          replay.hashes.push(hash);
          return replay;
        });
      }
      if (txIndex !== -1) {
        transactions[txIndex].isReattachable = false;
      }
      replay.isReattachable = false;
      return replay;
    }).catch(err => {
      replay.error = err;
      return replay;
    });
  }));
}

function isReattachable(iota, hash) {
  return iota.api.getBundle(tailHash).then(bundle => {
    const inputs = bundle.filter(tx => tx.value < 0).map(tx => tx.address);
    const outputs = bundle.filter(tx => tx.value > 0).reduce((sum, tx) => sum + tx.value, 0);
    return iota.api.getBalances(inputs, 100)
      .then(balances => balances.reduce((sum, balance) => sum + balance, 0))
      .then(sum => sum <= outputs);
  });
}

module.exports = {
  'transfer': transfer,
  'sendTrytes': sendTrytes,
  'getInputs': getInputs,
  'getInputWithLowestValue': getInputWithLowestValue,
  'replay': replay,
  'isReattachable': isReattachable
}
