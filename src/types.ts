import { FC, KeyboardEventHandler, KeyboardEvent } from 'react'

export type Renderer = <T>(
  cell: T,
  row: number,
  col: number,
) => string | number | null | void

export type EditorProps<T> = {
  /** The result of the dataRenderer (or valueRenderer if none) */
  value: string | number | null
  /** The current row index */
  row: number
  /** The current column index */
  col: number
  /** The cell's raw data structure */
  cell: T
  /** A callback for when the user changes the value during editing (for example, each time they type a character into an input). onChange does not indicate the final edited value. It works just like a controlled component in a form. */
  onChange: (newValue: string) => void
  /** An event handler that you can call to use default React-DataSheet keyboard handling to signal reverting an ongoing edit (Escape key) or completing an edit (Enter or Tab). For most editors based on an input element this will probably work. However, if this keyboard handling is unsuitable for your editor you can trigger these changes explicitly using the onCommit and onRevert callbacks. */
  onKeyDown: KeyboardEventHandler
  /** function (newValue, [event]) {} A callback to indicate that editing is over, here is the final value. If you pass a KeyboardEvent as the second argument, React-DataSheet will perform default navigation for you (for example, going down to the next row if you hit the enter key). You actually don't need to use onCommit if the default keyboard handling is good enough for you. */
  onCommit: (newValue: string, event?: KeyboardEvent) => void
  /** function () {} A no-args callback that you can use to indicate that you want to cancel ongoing edits. As with onCommit, you don't need to worry about this if the default keyboard handling works for your editor. */
  onRevert: () => void
}

export type CellShape<T> = {
  readonly?: boolean
  key?: string
  className?: string
  component?: FC
  forceComponent?: boolean
  disableEvents?: boolean
  disableUpdatedFlag?: boolean
  colSpan?: number
  rowSpan?: number
  width?: number | string
  overflow?: 'wrap' | 'nowrap' | 'clip'
  dataEditor?: FC<EditorProps<T>>
  valueViewer?: FC
}

export type ValueViewerProps<T> = {
  /** The result of the valueRenderer function */
  value: string | number | null
  /** The current row index */
  row: number
  /** The current column index */
  col: number
  /** The cell's raw data structure */
  cell: CellShape<T>
}
