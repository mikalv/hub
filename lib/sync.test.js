import test from 'ava'
import { sync, getConfirmedTransactions, getPendingTransactions, updateBalances } from './sync'

test('sync() updates pendingTransfers in inputs', async (t) => {
  const iota = {
    api: {
      getLatestInclusion: (hashes, cb) => {
        const states = Array(hashes.length).fill(false)
        states[1] = true
        states[2] = true
        cb(null, states)
      }
    }
  }
  const inputs = [
    {
      address: 'AA9999999999999999999999999999999999999999999999999999999999999999999999999999999',
      pendingTransactions: 2
    }, {
      address: 'AB9999999999999999999999999999999999999999999999999999999999999999999999999999999',
      pendingTransactions: 1
    }
  ]
  const transactions = [
    {
      hashes: [
        'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA99999',
        'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB99999'
      ],
      transfers: [
        {
          address: 'AA9999999999999999999999999999999999999999999999999999999999999999999999999999999'
        }, {
          address: 'AB9999999999999999999999999999999999999999999999999999999999999999999999999999999'
        }
      ]
    }, {
      hashes: [
        'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC99999'
      ],
      transfers: [
        {
          address: 'AA9999999999999999999999999999999999999999999999999999999999999999999999999999999'
        }
      ]
    }
  ]

  await sync(iota, transactions, inputs)

  t.deepEqual(inputs, [
    {
      address: 'AA9999999999999999999999999999999999999999999999999999999999999999999999999999999',
      pendingTransactions: 0
    }, {
      address: 'AB9999999999999999999999999999999999999999999999999999999999999999999999999999999',
      pendingTransactions: 0
    }
  ])
})

test('sync() updates spending balance in swept addresses', async (t) => {
  const iota = {
    api: {
      getLatestInclusion: (hashes, cb) => {
        const states = Array(hashes.lenght).fill(false)
        states[0] = true
        cb(null, states)
      }
    }
  }
  const addresses = [
    {
      address: 'AA9999999999999999999999999999999999999999999999999999999999999999999999999999999',
      spending: 1
    }, {
      address: 'AB9999999999999999999999999999999999999999999999999999999999999999999999999999999',
      spending: 3
    }
  ]
  const transactions = [
    {
      hashes: [
        'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA99999'
      ],
      inputs: [
        {
          address: 'AA9999999999999999999999999999999999999999999999999999999999999999999999999999999',
          balance: 1
        }, {
          address: 'AB9999999999999999999999999999999999999999999999999999999999999999999999999999999',
          balance: 2
        }
      ]
    }
  ]

  await sync(iota, transactions, null, addresses)

  t.deepEqual(addresses, [
    {
      address: 'AA9999999999999999999999999999999999999999999999999999999999999999999999999999999',
      spending: 0
    }, {
      address: 'AB9999999999999999999999999999999999999999999999999999999999999999999999999999999',
      spending: 1
    }
  ])
})

test('sync() returns the correct transactions', async (t) => {
  const iota = {
    api: {
      getLatestInclusion: (hashes, cb) => {
        const states = [true, false, false, true]
        cb(null, states)
      }
    }
  }
  const transactions = [
    {
      hashes: [
        'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA99999'
      ]
    }, {
      hashes: [
        'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB99999'
      ]
    }, {
      hashes: [
        'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC99999',
        'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD99999'
      ]
    }
  ]

  const res = await sync(iota, transactions)

  t.deepEqual(res, {
    confirmed: [
      {
        hashes: [
          'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA99999'
        ],
        confirmed: true
      }, {
        hashes: [
          'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC99999',
          'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD99999'
        ],
        confirmed: true
      }
    ],
    pending: [
      {
        hashes: [
          'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB99999'
        ]
      }
    ]
  })
})

test('getConfirmedTransactions() works', t => {
  const transactions = [
    {
      hash: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA99999',
      confirmed: true
    }, {
      hash: 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB99999'
    }
  ]
  const confirmedTxs = getConfirmedTransactions(transactions)

  t.deepEqual(confirmedTxs, [
    {
      hash: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA99999',
      confirmed: true
    }
  ])
})

test('getPendingTransactions() works', t => {
  const transactions = [
    {
      hash: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA99999',
      confirmed: true
    }, {
      hash: 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB99999'
    }
  ]
  const pendingTxs = getPendingTransactions(transactions)

  t.deepEqual(pendingTxs, [
    {
      hash: 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB99999'
    }
  ])
})

test('updateBalances() works', async t => {
  const iota = {
    api: {
      getBalances: (addresses, threshold, cb) => {
        cb(null, [0, 9, 2, 27])
      }
    }
  }
  const addresses = [
    {
      address: 'A99999999999999999999999999999999999999999999999999999999999999999999999999999999',
      balance: 7,
      keyIndex: 2
    }, {
      address: 'B99999999999999999999999999999999999999999999999999999999999999999999999999999999',
      balance: 0
    }, {
      address: 'C99999999999999999999999999999999999999999999999999999999999999999999999999999999',
      balance: 2
    }, {
      address: 'D99999999999999999999999999999999999999999999999999999999999999999999999999999999',
      balance: 10
    }
  ]
  const updatedAddresses = await updateBalances(iota, addresses)
  t.deepEqual(updatedAddresses, [
    {
      address: 'A99999999999999999999999999999999999999999999999999999999999999999999999999999999',
      balance: 0,
      keyIndex: 2
    }, {
      address: 'B99999999999999999999999999999999999999999999999999999999999999999999999999999999',
      balance: 9
    }, {
      address: 'C99999999999999999999999999999999999999999999999999999999999999999999999999999999',
      balance: 2
    }, {
      address: 'D99999999999999999999999999999999999999999999999999999999999999999999999999999999',
      balance: 27
    }
  ])
})
