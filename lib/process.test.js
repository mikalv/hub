import test from 'ava'
import { process, getAddressesWithBalance } from './process'

test('process() updates balance and spending on swept addresses ', async t => {
  const iota = {
    api: {
      getBalances: (addresses, threshold, cb) => {
        cb(null, [0, 19, 0, 4])
      }
    }
  }
  const inputs = [
    {
      address: 'E99999999999999999999999999999999999999999999999999999999999999999999999999999999',
      balance: 0
    }
  ]
  const addresses = [
    {
      address: 'A99999999999999999999999999999999999999999999999999999999999999999999999999999999',
      keyIndex: 0,
      balance: 0,
      spending: 0
    }, {
      address: 'B99999999999999999999999999999999999999999999999999999999999999999999999999999999',
      keyIndex: 1,
      balance: 10,
      spending: 10
    }, {
      address: 'C99999999999999999999999999999999999999999999999999999999999999999999999999999999',
      keyIndex: 2,
      balance: 9,
      spending: 0
    }, {
      address: 'D99999999999999999999999999999999999999999999999999999999999999999999999999999999',
      keyIndex: 3,
      balance: 12,
      spending: 0
    }
  ]

  const destination = {
    address: 'E99999999999999999999999999999999999999999999999999999999999999999999999999999999'
  }
  const res = await process(iota, 'SEED', inputs, [], addresses, destination)

  t.deepEqual(res.addresses, [
    {
      address: 'A99999999999999999999999999999999999999999999999999999999999999999999999999999999',
      keyIndex: 0,
      balance: 0,
      spending: 0
    }, {
      address: 'B99999999999999999999999999999999999999999999999999999999999999999999999999999999',
      keyIndex: 1,
      balance: 19,
      spending: 10
    }, {
      address: 'C99999999999999999999999999999999999999999999999999999999999999999999999999999999',
      keyIndex: 2,
      balance: 0,
      spending: 0
    }, {
      address: 'D99999999999999999999999999999999999999999999999999999999999999999999999999999999',
      keyIndex: 3,
      balance: 4,
      spending: 4
    }
  ])
})

test('getAddressesWithBalance() works', t => {
  const addresses = [
    {
      address: 'A99999999999999999999999999999999999999999999999999999999999999999999999999999999',
      balance: 0
    }, {
      address: 'B99999999999999999999999999999999999999999999999999999999999999999999999999999999',
      balance: 10
    }
  ]

  t.deepEqual(getAddressesWithBalance(addresses), [
    {
      address: 'B99999999999999999999999999999999999999999999999999999999999999999999999999999999',
      balance: 10
    }
  ])
})
