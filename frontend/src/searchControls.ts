export type CountValue = number | ''

export function inputNumber(value: number): CountValue {
  return Number.isFinite(value) ? value : ''
}

export function capResults(current: CountValue, candidates: CountValue): CountValue {
  if (typeof candidates === 'number' && Number.isInteger(candidates) && candidates > 0
    && typeof current === 'number') return Math.min(current, candidates)
  return current
}

export function validCounts(candidates: CountValue, results: CountValue, available: number): boolean {
  return typeof candidates === 'number' && Number.isInteger(candidates)
    && candidates >= 1 && candidates <= available
    && typeof results === 'number' && Number.isInteger(results)
    && results >= 1 && results <= candidates
}
