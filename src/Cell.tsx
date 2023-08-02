import { CellShape } from 'types'
import { CSSProperties, KeyboardEventHandler, MouseEventHandler, ReactNode, TdHTMLAttributes, TouchEventHandler } from 'react'

type CellProps<T> = {
  row: number
  col: number
  cell: CellShape<T>
  selected?: boolean
  editing?: boolean
  updated?: boolean
  attributesRenderer?: (cell: CellShape<T>, row: number, col: number) => TdHTMLAttributes<HTMLTableCellElement>
  onMouseDown: MouseEventHandler<HTMLTableCellElement>
  onMouseOver: MouseEventHandler<HTMLTableCellElement>
  onDoubleClick: MouseEventHandler<HTMLTableCellElement>
  onTouchEnd: TouchEventHandler<HTMLTableCellElement>
  onContextMenu: MouseEventHandler<HTMLTableCellElement>
  onKeyUp: KeyboardEventHandler<HTMLInputElement>
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

export const Cell = <T,>(props:CellProps<T>) => {
  const {
    row,
    col,
    cell,
    attributesRenderer,
    className,
    onMouseDown,
    onMouseOver,
    onDoubleClick,
    onTouchEnd,
    onContextMenu,
    style,
    children
  } = props


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

