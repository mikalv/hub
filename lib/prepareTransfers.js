const IOTA = require('iota.lib.js')
const errors = require('./errors')
const crypto = require('iota.crypto.js')

const Converter = crypto.converter
const Bundle = crypto.bundle
const Signing = crypto.signing
const HMAC = crypto.hmac

const iota = new IOTA()
const valid = iota.valid
const utils = iota.utils

const HASH_LENGTH = 81
const TAG_LENGTH = 27
const SIGNATURE_MESSAGE_FRAGMENT_TRYTE_LENGTH = 2187
const SIGNATURE_MESSAGE_FRAGMENT_TRIT_LENGTH = 2187 * 3
const NULL_HMAC_TRYTES = '9'.repeat(244)
const NULL_TAG_TRYTES = '9'.repeat(27)

/**
 * @method prepareTransfers
 *
 */
function prepareTransfers (seed, transfers, inputs, remainderAddress, options) {
  if (!valid.isTrytes(seed)) {
    throw new Error(errors.INVALID_SEED)
  }
  if (!inputs || !valid.isInputs(inputs) || inputs.findIndex(input => input.balance <= 0) !== -1) {
    throw new Error(errors.INVALID_INPUTS)
  }
  if (remainderAddress) {
    if (!valid.isAddress(remainderAddress)) {
      throw new Error(errors.INVALID_REMAINDER_ADDRESS)
    }
    if (remainderAddress.length === 90) {
      if (!utils.isValidChecksum(remainderAddress)) {
        throw new Error(errors.INVALID_REMAINDER_ADDRESS_CHECKSUM)
      }
      remainderAddress = utils.noChecksum(remainderAddress)
    }
  }
  if (!valid.isTransfersArray(transfers)) {
    console.log(transfers)
    throw new Error(errors.INVALID_TRANSFERS)
  }
  let hmacKey
  if (options && options.hasOwnProperty('hmacKey') && options.hmacKey) {
    hmacKey = options.hmacKey
    if (valid.isTrytes(hmacKey)) {
      throw new Error(errors.INVALID_HMAC_TRYTES)
    }
  }
  const bundle = createBundle(transfers, inputs, remainderAddress, hmacKey)
  if (bundle.bundle.filter(tx => tx.value < 0).length > 0) {
    sign(seed, bundle, inputs)
    if (hmacKey) {
      addHMAC(bundle, hmacKey)
    }
  }
  return bundle.bundle.map(tx => utils.transactionTrytes(tx)).reverse()
}

function createBundle (transfers, inputs, remainderAddress, hmacKey) {
  const bundle = new Bundle()
  const signatureMessageFragments = []
  let obsoleteTag
  let totalValue = 0
  const timestamp = Converter.trytes(Math.floor(Date.now() / 1000))
  const transfersCopy = [...transfers]
  transfersCopy.forEach((transfer, i) => {
    transfer.message = transfer.message || ''
    if (!Number.isInteger(transfer.value) || transfer.value < 0) {
      throw new Error(errors.INVALID_TRANSFER_VALUE)
    }
    transfer.value = parseInt(transfer.value)
    if (hmacKey && transfer.value > 0) {
      transfer.message = NULL_HMAC_TRYTES + transfer.message
    }
    obsoleteTag = transfer.obsoleteTag ? transfer.obsoleteTag + '9'.repeat(TAG_LENGTH - transfer.obsoleteTag.length) : NULL_TAG_TRYTES
    if (transfer.address.length === 90) {
      if (!utils.isValidChecksum(transfer.address)) {
        throw new Error(errors.INVALID_DESTINATION_ADDRESS_CHECKSUM)
      }
      transfer.address = utils.noChecksum(transfer.address)
    }
    const signatureMessageFragmentsCount = 1 + Math.floor(transfer.message.length / SIGNATURE_MESSAGE_FRAGMENT_TRYTE_LENGTH)
    for (let j = 0; j < signatureMessageFragmentsCount; j++) {
      const fragment = transfer.message.slice(j * SIGNATURE_MESSAGE_FRAGMENT_TRYTE_LENGTH, (j + 1) * SIGNATURE_MESSAGE_FRAGMENT_TRYTE_LENGTH)
      signatureMessageFragments.push(fragment + '9'.repeat(SIGNATURE_MESSAGE_FRAGMENT_TRYTE_LENGTH - fragment.length))
    }
    bundle.addEntry(signatureMessageFragmentsCount, transfer.address, transfer.value, obsoleteTag, timestamp)
    totalValue += transfer.value
  })
  inputs.forEach(input => {
    bundle.addEntry(input.security, input.address, 0 - input.balance, obsoleteTag, timestamp)
  })
  const remainderValue = inputs.reduce((sum, input) => sum + input.balance, 0) - totalValue
  if (remainderValue > 0) {
    if (!remainderAddress) {
      throw new Error(errors.UNDEFINED_REMAINDER_ADDRESS)
    }
    bundle.addEntry(1, remainderAddress, remainderValue, obsoleteTag, timestamp)
  }
  bundle.finalize()
  bundle.addTrytes(signatureMessageFragments)
  return bundle
}

function sign (seed, bundle, inputs) {
  const txs = [...bundle.bundle]
  txs.filter(tx => tx.value < 0).forEach((tx, i) => {
    const {index, security} = inputs.find(input => input.address === tx.address)
    const key = Signing.key(Converter.trits(seed), index, security)
    const normalizedBundleHash = bundle.normalizedBundle(tx.bundle)
    for (let j = 0; j < security; j++) {
      const normalizedBundleFragment = normalizedBundleHash.slice(j * HASH_LENGTH / 3, (j + 1) * HASH_LENGTH / 3)
      const keyFragment = key.slice(j * SIGNATURE_MESSAGE_FRAGMENT_TRIT_LENGTH, (j + 1) * SIGNATURE_MESSAGE_FRAGMENT_TRIT_LENGTH)
      bundle.bundle[i + j].signatureMessageFragment = Converter.trytes(Signing.signatureFragment(normalizedBundleFragment, keyFragment))
    }
  })
}

function addHMAC (bundle, key) {
  const hmac = new HMAC(key)
  hmac(bundle)
}

module.exports = prepareTransfers
