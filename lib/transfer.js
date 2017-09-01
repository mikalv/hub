const isSpent = require('./address').isSpent;
const errors = require('./errors')

function transfer(iota, seed, inputs, transactions, transfers, options) {
  const value = transfers.reduce((sum, tx) => sum + tx.value);
  if ('inputs' in options && fundingInputs.some(inputs.pendingTransactions > 0)) {
    throw new Error(errors.PENDING_TRANSFERS);
  }
  const fundingInputs = 'inputs' in options ? options.inputs : getInputs(inputs, value);
  // TODO: add remainder
  inputs = inputs.filter(input => fundingInputs.indexOf(fundingInput => fundingInput.address == input.address));
  // WIP
  transfers.forEach(transfer => {
    iota.api.sendTransfer(seed, constants.DEPTH, constants.MWM, {'inputs': fundingInputs.inputs, 'address': remainderAddress});
  });
}

function replay(iota, transactions, replayList) {
  return Promise.all(replayList.map(replay => {
    return iota.api.isReattachable(replay.inputs.map(input => input.address)).then(isReattachable => {
      const txIndex = transactions.findIndex(tx => tx.hashes[0].hash == replay.hashes[0].hash);
      if (isReattachable) {
        return iota.api.replayBundle(tail, constants.DEPTH, constants.MWM).then(tx => {
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

function getInputs(inputs, value) {

}

module.exports = {
  'transfer': transfer,
  'replay': replay,
  'getInputs': getInputs,
}
