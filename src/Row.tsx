import { FC, ReactNode } from 'react'

import CellShape from './CellShape'

type RowProps = {
  row: number
  children: ReactNode
  cells: CellShape[]
}

const Row: FC<RowProps> = ({ children }) => <tr>{children}</tr>

export default Row
