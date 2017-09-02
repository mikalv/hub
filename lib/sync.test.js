import test from 'ava'
import { getConfirmedTransactions, getPendingTransactions } from './sync'

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
