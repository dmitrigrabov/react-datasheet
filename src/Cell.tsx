import PropTypes from 'prop-types'
import CellShape from './CellShape'
import { FC, MouseEventHandler, ReactNode, TouchEventHandler } from 'react'

type CellProps = {
  row: number
  col: number
  cell: CellShape
  selected?: boolean
  editing?: boolean
  updated?: boolean
  attributesRenderer?: (cell: CellShape, row: number, col: number) => object
  onMouseDown: MouseEventHandler<HTMLTableCellElement>
  onMouseOver: MouseEventHandler<HTMLTableCellElement>
  onDoubleClick: MouseEventHandler<HTMLTableCellElement>
  onContextMenu: MouseEventHandler<HTMLTableCellElement>
  onTouchEnd: TouchEventHandler<HTMLTableDataCellElement>
  className?: string
  style?: object
  children?: ReactNode
}

const Cell: FC<CellProps> = ({
  cell,
  row,
  col,
  attributesRenderer = () => {},
  className,
  style,
  onMouseDown,
  onMouseOver,
  onDoubleClick,
  onContextMenu,
  onTouchEnd,
  children,
}) => {
  const { colSpan, rowSpan } = cell
  const attributes = attributesRenderer
    ? attributesRenderer(cell, row, col)
    : {}

  return (
    <td
      className={className}
      onMouseDown={onMouseDown}
      onMouseOver={onMouseOver}
      onDoubleClick={onDoubleClick}
      onTouchEnd={onTouchEnd}
      onContextMenu={onContextMenu}
      colSpan={colSpan}
      rowSpan={rowSpan}
      style={style}
      {...attributes}
    >
      {children}
    </td>
  )
}
