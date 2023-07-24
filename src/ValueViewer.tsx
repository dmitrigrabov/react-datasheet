import CellShape from './CellShape'
import { FC } from 'react'

type ValueViewerProps = {
  row: number
  col: number
  cell: CellShape
  value: unknown
}

const ValueViewer: FC<ValueViewerProps> = ({ value }) => {
  return <span className="value-viewer">{value}</span>
}

export default ValueViewer
