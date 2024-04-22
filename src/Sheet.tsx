import { ReactNode } from 'react'
import { CellShape } from 'types'

type SheetProps<T> = {
  className?: string
  data: CellShape<T>[][]
  children: ReactNode
}

export const Sheet = <T,>({ className, children }: SheetProps<T>) => (
  <table className={className}>
    <tbody>{children}</tbody>
  </table>
)
