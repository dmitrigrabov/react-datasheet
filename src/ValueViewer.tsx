import { ValueViewerProps, CellShape } from 'types'

const ValueViewer = <T,>({ row, col, cell, value }: ValueViewerProps<T>) => (
  <span className="value-viewer">{value}</span>
)

export default ValueViewer
