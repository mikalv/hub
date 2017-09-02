import test from 'ava'
import { sync, getConfirmedTransactions, getPendingTransactions } from './sync'

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

test('sync() updates sending in swept addresses', async (t) => {
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
          value: 1
        }, {
          address: 'AB9999999999999999999999999999999999999999999999999999999999999999999999999999999',
          value: 2
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

test('sync() returns the correct confirmed transactions', async (t) => {
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

  const confirmedTransactions = await sync(iota, transactions)

  t.deepEqual(confirmedTransactions, [
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
  ])
})

test('getConfirmedTransactions() works', t => {
  const transactions = [
    {
      id: 'abc',
      confirmed: true
    }, {
      id: 'def'
    }
  ]
  const confirmedTxs = getConfirmedTransactions(transactions)

  t.deepEqual(confirmedTxs, [
    {
      id: 'abc',
      confirmed: true
    }
  ])
})

test('getPendingTransactions() works', t => {
  const transactions = [
    {
      id: 'abc',
      confirmed: true
    }, {
      id: 'def'
    }
  ]
  const pendingTxs = getPendingTransactions(transactions)

  t.deepEqual(pendingTxs, [
    {
      id: 'def'
    }
  ])
})
