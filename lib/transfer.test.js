import test from 'ava'
import { transfer, getInputs, getInputWithLowestValue, sendTrytes, isReattachable, reattach } from './transfer'

test('transfer() removes used inputs and returns the prepared transfers', async t => {
  const iota = {
    api: {
      getBalances: function (addresses, threshold, cb) {
        cb(null, [100, 0])
      }
    }
  }
  const inputs = [
    {
      address: 'A99999999999999999999999999999999999999999999999999999999999999999999999999999999',
      keyIndex: 0,
      security: 2,
      balance: 99,
      pendingTransactions: 0
    }, {
      address: 'B99999999999999999999999999999999999999999999999999999999999999999999999999999999',
      keyIndex: 1,
      security: 2,
      balance: 0,
      pendingTransactions: 0
    }
  ]
  const transfers = [
    {
      address: 'C99999999999999999999999999999999999999999999999999999999999999999999999999999999',
      value: 9,
      obsoleteTag: '',
      message: ''
    }
  ]
  const res = await transfer(iota, 'SEED', inputs, transfers)
  t.deepEqual(res.inputs, [
    {
      address: 'B99999999999999999999999999999999999999999999999999999999999999999999999999999999',
      keyIndex: 1,
      security: 2,
      balance: 0,
      pendingTransactions: 1
    }
  ])
})

test('transfer() returns a list of transactions', async t => {
  const iota = {
    api: {
      getBalances: function (addresses, threshold, cb) {
        cb(null, [100, 0])
      }
    }
  }
  const inputs = [
    {
      address: 'A99999999999999999999999999999999999999999999999999999999999999999999999999999999',
      keyIndex: 0,
      security: 2,
      balance: 99,
      pendingTransactions: 0
    }, {
      address: 'B99999999999999999999999999999999999999999999999999999999999999999999999999999999',
      keyIndex: 1,
      security: 2,
      balance: 0,
      pendingTransactions: 0
    }
  ]
  const transfers = [
    {
      address: 'C99999999999999999999999999999999999999999999999999999999999999999999999999999999',
      value: 9,
      obsoleteTag: '',
      message: ''
    }
  ]
  const res = await transfer(iota, 'SEED', inputs, transfers)

  t.deepEqual(res.trytes.map(tx => 'TRYTES'), [
    'TRYTES',
    'TRYTES',
    'TRYTES',
    'TRYTES'
  ])
})

test('getInputs() selects the correct inputs', async t => {
  const inputs = [
    {
      address: 'C99999999999999999999999999999999999999999999999999999999999999999999999999999999',
      keyIndex: 2,
      security: 2,
      balance: 95,
      pendingTransactions: 0
    }, {
      address: 'A99999999999999999999999999999999999999999999999999999999999999999999999999999999',
      keyIndex: 0,
      security: 2,
      balance: 100,
      pendingTransactions: 0
    }, {
      address: 'B99999999999999999999999999999999999999999999999999999999999999999999999999999999',
      keyIndex: 1,
      security: 2,
      balance: 97,
      pendingTransactions: 0
    }, {
      address: 'D99999999999999999999999999999999999999999999999999999999999999999999999999999999',
      keyIndex: 3,
      security: 2,
      balance: 95,
      pendingTransactions: 1
    }, {
      address: 'E99999999999999999999999999999999999999999999999999999999999999999999999999999999',
      keyIndex: 4,
      security: 2,
      balance: 99,
      pendingTransactions: 0
    }
  ]

  const selectedInputs = getInputs(inputs, 195)

  t.deepEqual(selectedInputs, {
    inputs: [
      {
        address: 'A99999999999999999999999999999999999999999999999999999999999999999999999999999999',
        keyIndex: 0,
        security: 2,
        balance: 100,
        pendingTransactions: 0
      }, {
        address: 'C99999999999999999999999999999999999999999999999999999999999999999999999999999999',
        keyIndex: 2,
        security: 2,
        balance: 95,
        pendingTransactions: 0
      }
    ],
    balance: 195
  })
})

test('getInputWithLowestValue() works', async t => {
  const inputs = [
    {
      address: 'A99999999999999999999999999999999999999999999999999999999999999999999999999999999',
      keyIndex: 0,
      security: 2,
      balance: 3,
      pendingTransactions: 0
    }, {
      address: 'B99999999999999999999999999999999999999999999999999999999999999999999999999999999',
      keyIndex: 1,
      security: 2,
      balance: 1,
      pendingTransactions: 0
    }, {
      address: 'C99999999999999999999999999999999999999999999999999999999999999999999999999999999',
      keyIndex: 2,
      security: 2,
      balance: 2,
      pendingTransactions: 0
    }
  ]
  const input = getInputWithLowestValue(inputs)
  t.deepEqual(input, {
    address: 'B99999999999999999999999999999999999999999999999999999999999999999999999999999999',
    keyIndex: 1,
    security: 2,
    balance: 1,
    pendingTransactions: 0
  })
})

test('isReattachable() works', async t => {
  let i = 0
  let j = 0
  const bundles = [[
    {
      address: 'C99999999999999999999999999999999999999999999999999999999999999999999999999999999',
      value: 27
    }, {
      address: 'A99999999999999999999999999999999999999999999999999999999999999999999999999999999',
      value: -18
    }, {
      address: 'B99999999999999999999999999999999999999999999999999999999999999999999999999999999',
      value: -9
    }
  ], [
    {
      address: 'E99999999999999999999999999999999999999999999999999999999999999999999999999999999',
      value: 9
    }, {
      address: 'D99999999999999999999999999999999999999999999999999999999999999999999999999999999',
      value: -9
    }
  ]]
  const balances = [
    [18, 10],
    [3]
  ]
  const iota = {
    api: {
      getBundle: (hash, cb) => {
        const bundle = bundles[i]
        i++
        cb(null, bundle)
      },
      getBalances: (addresses, threshold, cb) => {
        const res = balances[j]
        j++
        cb(null, {
          balances: res
        })
      }
    }
  }
  const res = await isReattachable(iota, [
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA99999',
    'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB99999'
  ])
  t.deepEqual(res, [true, false])
})

test('sendTrytes() updates spending balance and pending transfers on addresses', async t => {
  const iota = {
    api: {
      sendTrytes: (trytes, depth, mwm, cb) => {
        cb(null, [
          {
            hash: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA99999'
          }
        ])
      }
    }
  }

  const res = await sendTrytes(iota, ['TRYTES'], 4, 14)
  t.deepEqual(res.transactions[0].bundle, [{
    hash: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA99999'
  }])

  t.deepEqual(res.pending, [])
})

test('reattach() returns transaction list with new hashes', async t => {
  let i = 0
  let j = 0
  const bundles = [[
    {
      address: 'C99999999999999999999999999999999999999999999999999999999999999999999999999999999',
      value: 27
    }, {
      address: 'A99999999999999999999999999999999999999999999999999999999999999999999999999999999',
      value: -18
    }, {
      address: 'B99999999999999999999999999999999999999999999999999999999999999999999999999999999',
      value: -9
    }
  ], [
    {
      address: 'E99999999999999999999999999999999999999999999999999999999999999999999999999999999',
      value: 9
    }, {
      address: 'D99999999999999999999999999999999999999999999999999999999999999999999999999999999',
      value: -9
    }
  ]]
  const balances = [
    [18, 10],
    [3]
  ]
  const iota = {
    api: {
      getBundle: (hash, cb) => {
        const bundle = bundles[i]
        i++
        cb(null, bundle)
      },
      getBalances: (addresses, threshold, cb) => {
        const res = balances[j]
        j++
        cb(null, {
          balances: res
        })
      },
      replayBundle: (hash, depth, mwm, cb) => {
        cb(null, [
          {
            hash: 'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC99999',
            timestamp: 3,
            attachmentTimestamp: 4
          }
        ])
      }
    }
  }
  const transactions = [
    {
      bundle: [
        {
          hash: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA99999',
          timestamp: 1,
          attachmentTimestamp: 2
        }
      ],
      hashes: [
        {
          hash: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA99999',
          timestamp: 1,
          attachmentTimestamp: 2
        }
      ]
    }, {
      bundle: {
        hash: 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB99999'
      },
      hashes: [
        {
          hash: 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB99999'
        }
      ]
    }
  ]

  const res = await reattach(iota, transactions, 4, 14)

  t.deepEqual(res, [
    {
      bundle: [
        {
          hash: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA99999',
          timestamp: 1,
          attachmentTimestamp: 2
        }
      ],
      hashes: [
        {
          hash: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA99999',
          timestamp: 1,
          attachmentTimestamp: 2
        }, {
          hash: 'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC99999',
          timestamp: 3,
          attachmentTimestamp: 4
        }
      ]
    }, {
      bundle: {
        hash: 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB99999'
      },
      hashes: [
        {
          hash: 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB99999'
        }
      ],
      isReattachable: false
    }
  ])
})
