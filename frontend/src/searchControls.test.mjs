import assert from 'node:assert/strict'
import test from 'node:test'
import { inputNumber, capResults, validCounts } from './searchControls.ts'

test('vaciar y reescribir candidatos conserva un top-k utilizable', () => {
  const cleared = inputNumber(Number.NaN)
  const results = capResults(5, cleared)
  assert.equal(cleared, '')
  assert.equal(results, 5)
  assert.equal(validCounts(cleared, results, 24), false)
  assert.equal(validCounts(inputNumber(20), results, 24), true)
})

test('reducir candidatos limita top-k y permite editar un campo vacío', () => {
  assert.equal(capResults(5, 3), 3)
  assert.equal(capResults('', 3), '')
  assert.equal(validCounts(3, inputNumber(Number.NaN), 24), false)
  assert.equal(validCounts(3, inputNumber(2), 24), true)
})

test('no se habilitan cantidades negativas, fraccionarias o mayores que el lote', () => {
  for (const value of ['', 0, -1, 1.5, 25]) assert.equal(validCounts(value, 1, 24), false)
  assert.equal(validCounts(8, 9, 24), false)
  assert.equal(validCounts(24, 24, 24), true)
})
