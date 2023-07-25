import Cell, { DataRenderer, ValueRenderer } from './types'

export const renderValue = <T extends Cell<T, V>, V = string>(
  cell: T,
  row: number,
  col: number,
  valueRenderer: ValueRenderer<T, V>,
) => {
  const value = valueRenderer(cell, row, col)
  return value === null || typeof value === 'undefined' ? '' : value
}

export const renderData = <T extends Cell<T, V>, V = string>(
  cell: T,
  row: number,
  col: number,
  valueRenderer: ValueRenderer<T, V>,
  dataRenderer: DataRenderer<T, V>,
) => {
  const value = dataRenderer ? dataRenderer(cell, row, col) : null
  return value === null || typeof value === 'undefined'
    ? renderValue(cell, row, col, valueRenderer)
    : value
}
