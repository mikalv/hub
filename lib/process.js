const constants = require('./constants')
const prepareTransfers = require('./prepareTransfers')
const { getInputWithLowestValue } = require('./transfer')
const { updateBalances } = require('./sync')
const errors = require('./errors')

function process (iota, seed, inputs, addresses, destination, batchSize) {
  return updateBalances(iota, addresses)
  .then(syncedAddresses => {
    return sweep(seed, inputs, syncedAddresses, getAddressesWithBalance(filterSpendingAddresses(syncedAddresses)), destination, batchSize)
  })
}

function sweep (seed, inputs, addresses, addressesToSweep, destination, batchSize) {
  destination = destination || getInputWithLowestValue(inputs)
  destination = destination.address ? destination.address : destination
  const destinationIndex = inputs.findIndex(input => input.address === destination)
  if (destinationIndex === -1) {
    throw new Error(errors.DESTINATION_NOT_IN_INPUTS)
  }
  const addressesCopy = [...addresses]
  const inputsCopy = [...inputs]
  const batches = []
  inputsCopy[destinationIndex].pendingTransactions = (inputs[destinationIndex].pendingTransaction || 0) + 1
  batchSize = batchSize || constants.MAX_INPUTS_PER_BUNDLE
  while (addressesToSweep.length > 0) {
    const batch = addressesToSweep.splice(0, batchSize)
    batch.forEach(addressToSweep => {
      const addressesIndex = addresses.findIndex(address => address.address === addressToSweep.address)
      if (addressesIndex !== -1) {
        addressesCopy[addressesIndex].spending += (addresses[addressesIndex].spending || 0) + addressToSweep.balance
      }
    })
    const totalValue = batch.reduce((sum, address) => sum + address.balance, 0)
    batches.push({
      inputs: batch,
      value: totalValue,
      transfers: [{
        address: destination,
        value: totalValue,
        message: '',
        obsoleteTag: ''
      }]
    })
  }
  const transfers = batches.map(sweep => {
    sweep.trytes = prepareTransfers(seed, sweep.transfers, sweep.inputs.map(input => ({
      address: input.address,
      keyIndex: input.keyIndex,
      security: input.security ? sweep.address.security : 2,
      value: input.balance
    })))
    return sweep
  })
  const trytes = transfers.map(transfer => transfer.trytes)
  return {
    transfers,
    trytes,
    inputs: inputsCopy,
    addresses: addressesCopy
  }
}

function getAddressesWithBalance (addresses) {
  return [...addresses].filter(address => address.balance > 0)
}

function filterSpendingAddresses (addresses) {
  return [...addresses].filter(address => address.spending === 0)
}

function getUnspentBalance (address) {
  return address.balance - (address.spending || 0)
}

module.exports = {
  process,
  getAddressesWithBalance,
  getUnspentBalance
}
