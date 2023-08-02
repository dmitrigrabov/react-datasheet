import {
  FC,
  KeyboardEventHandler,
  KeyboardEvent,
  ReactNode,
  ComponentType,
  TdHTMLAttributes,
  MouseEventHandler,
  CSSProperties,
} from 'react'

export type DataRenderer<T> = (
  cell: CellShape<T>,
  row: number,
  col: number,
) => T | undefined

export type ValueRenderer<T> = (
  cell: CellShape<T>,
  row: number,
  col: number,
) => string | undefined

export interface SheetRendererProps<T> {
  /** The same data array as from main ReactDataSheet component */
  data: CellShape<T>[][]
  /** Classes to apply to your top-level element. You can add to these, but your should not overwrite or omit them unless you want to implement your own CSS also. */
  className: string
  /** The regular react props.children. You must render {props.children} within your custom renderer or you won't see your rows and cells. */
  children: ReactNode
}

/** Optional function or React Component to render the main sheet element. The default renders a table element. To wire it up, pass your function to the sheetRenderer property of the ReactDataSheet component. */
export type SheetRenderer<T> = ComponentType<SheetRendererProps<T>>

export interface RowRendererProps<T> {
  /** The current row index */
  row: number
  /** The cells in the current row */
  cells: CellShape<T>[]
  /** The regular react props.children. You must render {props.children} within your custom renderer or you won't see your cells. */
  children: ReactNode

  selected: boolean
}

/** Optional function or React Component to render each row element. The default renders a tr element. To wire it up, pass your function to the rowRenderer property of the ReactDataSheet component. */
export type RowRenderer<T> = ComponentType<RowRendererProps<T>>

export type EditorProps<T> = {
  /** The result of the dataRenderer (or valueRenderer if none) */
  value: string
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

/** The properties that will be passed to the CellRenderer component or function. */
export type CellRendererProps<T> = {
  /** The current row index */
  row: number
  /** The current column index */
  col: number
  /** The cell's raw data structure */
  cell: CellShape<T>
  /** Classes to apply to your cell element. You can add to these, but your should not overwrite or omit them unless you want to implement your own CSS also. */
  className: string
  /** Generated styles that you should apply to your cell element. This may be null or undefined. */
  style?: CSSProperties
  /** Is the cell currently selected */
  selected: boolean
  /** Is the cell currently being edited */
  editing: boolean
  /** Was the cell recently updated */
  updated: boolean
  /** As for the main ReactDataSheet component */
  attributesRenderer?: (
    cell: CellShape<T>,
    row: number,
    col: number,
  ) => TdHTMLAttributes<HTMLTableCellElement>
  /** Event handler: important for cell selection behavior */
  onMouseDown: MouseEventHandler<HTMLElement>
  /** Event handler: important for cell selection behavior */
  onMouseOver: MouseEventHandler<HTMLElement>
  /** Event handler: important for editing */
  onDoubleClick: MouseEventHandler<HTMLElement>
  /** Event handler: to launch default content-menu handling. You can safely ignore this handler if you want to provide your own content menu handling. */
  onContextMenu: MouseEventHandler<HTMLElement>
  /** Event handler: important for cell selection behavior */
  onKeyUp?: KeyboardEventHandler
  /** The regular react props.children. You must render {props.children} within your custom renderer or you won't your cell's data. */
  children: ReactNode
}

/** A function or React Component to render each cell element. The default renders a td element. To wire it up, pass it to the cellRenderer property of the ReactDataSheet component.  */
export type CellRendererType<T> = ComponentType<CellRendererProps<T>>

export type CellShape<T> = {
  readOnly?: boolean
  key?: string
  className?: string
  component?: ReactNode
  forceComponent?: boolean
  disableEvents?: boolean
  disableUpdatedFlag?: boolean
  colSpan?: number
  rowSpan?: number
  width?: number | string
  overflow?: 'wrap' | 'nowrap' | 'clip'
  dataEditor?: FC<EditorProps<CellShape<T>>>
  valueViewer?: FC
  value?: string
  data?: T
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

/* Props available for handleCopy */
export type HandleCopyProps<T> = {
  event: Event
  dataRenderer?: DataRenderer<T>
  valueRenderer: ValueRenderer<T>
  data: CellShape<T>[][]
  start: IJ
  end: IJ
  range: (start: number, end: number) => number[]
}

export type HandleCopyFunction<T> = (props: HandleCopyProps<T>) => void

export type IJ = {
  i: number
  j: number
}
