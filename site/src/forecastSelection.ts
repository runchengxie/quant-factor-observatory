// Reviewed aggregate projection only. Security rows, formulas and model parameters stay private.
export const forecastSelection = {
  asOf: '2026-10-15',
  holdings: 20,
  cohorts: [
    { id: 'historical', candidates: 5514, common: 5193, same: 19 },
    { id: 'forward', candidates: 5550, common: 5201, same: 19 },
  ],
} as const
