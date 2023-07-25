import { FC, ReactNode } from 'react'
import PropTypes from 'prop-types'

type SheetProps = {
  className?: string
  data: any[]
  children: ReactNode
}

const Sheet: FC<SheetProps> = ({ className, children, data }) => (
  <table className={className}>
    <tbody>{children}</tbody>
  </table>
)

export default Sheet
