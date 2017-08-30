function getAddress(iota, seed, index, security = 2, checksum = false) {
  if (!index) {
    throw new Error('Provide an index')
  }
  return {
    'address': hub.iota.api._newAddress(seed, index, security, checksum),
    'index': index,
    'security': security,
    'props': props
  }
}

module.exports = {
  'getAddress' : getAddress
};
