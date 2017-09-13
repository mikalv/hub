const constants = require('./constants')
const sweepTransfer = require('./sweepTransfer')
const { getInputWithLowestValue } = require('./transfer')
const { updateBalances } = require('./sync')
const errors = require('./errors')

function process (iota, seed, inputs, sweeps, addresses, destination, batchSize) {
  return updateBalances(iota, addresses)
    .then(updatedAddresses => sweep(seed, inputs, sweeps, addresses, getAddressesWithBalance(updatedAddresses).filter(a => a.spending === 0), destination, batchSize))
}

function sweep (seed, inputs, sweeps, addresses, addressesToSweep, destination, batchSize) {
  destination = destination || getInputWithLowestValue(inputs)
  destination = 'address' in destination ? destination.address : destination
  const destinationIndex = inputs.findIndex(input => input.address === destination)
  if (destinationIndex === -1) {
    throw new Error(errors.DESTINATION_NOT_IN_INPUTS)
  }
  inputs[destinationIndex].pendingTransactions = (inputs[destinationIndex].pendingTransaction || 0) + 1
  batchSize = batchSize || constants.MAX_INPUTS_PER_BUNDLE
  const batches = []
  while (addressesToSweep.length > 0) {
    const batch = addressesToSweep.splice(0, batchSize)
    batch.forEach(addressToSweep => {
      const addressesIndex = addresses.findIndex(address => address.address === addressToSweep.address)
      if (addressesIndex !== -1) {
        addresses[addressesIndex].spending = (addresses[addressesIndex].spending || 0) + addressToSweep.balance
      }
    })
    const totalValue = batch.reduce((sum, address) => sum + address.balance, 0)
    batches.push({
      'inputs': batch,
      'value': totalValue,
      'transfers': [{
        'address': destination,
        'value': totalValue
      }]
    })
  }
  const preparedTransfers = batches.map(sweep => {
    const options = {
      'inputs': sweep.inputs.map(input => ({
        'address': input.address,
        'keyIndex': input.keyIndex,
        'security': 'security' in input ? sweep.address.security : 2,
        'value': input.balance
      })),
      'value': sweep.value
    }
    sweep.trytes = sweepTransfer(seed, sweep.transfers, options)
    sweeps.push(sweep)
    return sweep
  })

  const trytes = preparedTransfers.map(transfer => transfer.trytes)

  return {
    preparedTransfers,
    trytes,
    sweeps,
    inputs,
    addresses
  }
}

function getAddressesWithBalance (addresses) {
  return addresses.filter(address => address.balance > 0)
}

function getUnspentBalance (address) {
  return address.balance - (address.spending || 0)
}

module.exports = {
  process,
  getAddressesWithBalance,
  getUnspentBalance
}
