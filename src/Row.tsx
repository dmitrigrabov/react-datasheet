import { ReactNode } from 'react'
import { CellShape } from './types'

type RowProps<T> = {
  row: number
  cells: CellShape<T>[]
  children: ReactNode
}

export const Row = <T,>({ children }: RowProps<T>) => {
  return <tr>{children}</tr>
}
