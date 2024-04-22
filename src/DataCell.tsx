import {
  CSSProperties,
  ComponentType,
  KeyboardEvent,
  KeyboardEventHandler,
  MouseEvent,
  TdHTMLAttributes,
  TouchEventHandler,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  ENTER_KEY,
  ESCAPE_KEY,
  TAB_KEY,
  RIGHT_KEY,
  LEFT_KEY,
  UP_KEY,
  DOWN_KEY,
} from './keys'
import { Cell } from './Cell'
import { DataEditor } from './DataEditor'
import ValueViewer from './ValueViewer'
import { renderValue, renderData } from './renderHelpers'
import {
  EditorProps,
  DataRenderer,
  ValueRenderer,
  CellShape,
  ValueViewerProps,
  CellRendererType,
} from 'types'

type InitialDataArgs<T> = {
  cell: CellShape<T>
  row: number
  col: number
  valueRenderer: ValueRenderer<T>
  dataRenderer?: DataRenderer<T>
}

const initialData = <T,>({
  cell,
  row,
  col,
  valueRenderer,
  dataRenderer,
}: InitialDataArgs<T>) => {
  return renderData(cell, row, col, valueRenderer, dataRenderer)
}

type InitialValueArgs<T> = {
  cell: CellShape<T>
  row: number
  col: number
  valueRenderer: ValueRenderer<T>
}

const initialValue = <T,>({
  cell,
  row,
  col,
  valueRenderer,
}: InitialValueArgs<T>) => {
  return renderValue(cell, row, col, valueRenderer)
}

const widthStyle = <T,>(cell: CellShape<T>): CSSProperties | undefined => {
  const width = typeof cell.width === 'number' ? cell.width + 'px' : cell.width
  return width ? { width } : undefined
}

export type DataCellProps<T> = {
  row: number
  col: number
  cell: CellShape<T>
  forceEdit?: boolean
  selected?: boolean
  editing?: boolean
  editValue?: unknown
  clearing?: boolean
  cellRenderer?: CellRendererType<T>
  valueRenderer: ValueRenderer<T>
  dataRenderer?: DataRenderer<T>
  valueViewer?: ComponentType<ValueViewerProps<T>>
  dataEditor?: ComponentType<EditorProps<CellShape<T>>>
  attributesRenderer?: (
    cell: CellShape<T>,
    row: number,
    col: number,
  ) => TdHTMLAttributes<HTMLTableCellElement>
  onNavigate: (event: KeyboardEvent, b: boolean) => void
  onMouseDown: (row: number, col: number, event: MouseEvent) => void
  onMouseOver: (row: number, col: number) => void
  onDoubleClick: (row: number, col: number) => void
  onTouchEnd?: TouchEventHandler<HTMLTableCellElement>
  onContextMenu: (event: MouseEvent, row: number, col: number) => void
  onChange: (row: number, col: number, value: string) => void
  onKeyUp?: KeyboardEventHandler
  onRevert: () => void
  onEdit?: () => void
}

const DataCell = <T,>(props: DataCellProps<T>) => {
  const {
    cell,
    row,
    col,
    valueRenderer,
    dataRenderer,
    onChange,
    onNavigate,
    onRevert,
    onMouseDown,
    onMouseOver,
    onDoubleClick,
    onContextMenu,
    onTouchEnd,
    onKeyUp,
    forceEdit = false,
    selected = false,
    editing = false,
    clearing = false,
    cellRenderer: CellRenderer = Cell,
    dataEditor,
    valueViewer,
    attributesRenderer,
  } = props
  const [updated, setUpdated] = useState(false)
  const [reverting, setReverting] = useState(false)
  const [committing, setCommitting] = useState(false)
  const [value, setValue] = useState('')

  const prevProps = useRef<DataCellProps<T>>()
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (!prevProps.current) {
      prevProps.current = props
      return
    }

    if (
      !cell.disableUpdatedFlag &&
      initialValue(prevProps.current) !== initialValue(props)
    ) {
      setUpdated(true)
      timeoutRef.current = setTimeout(() => setUpdated(false), 700)
    }

    if (editing === true && !prevProps.current.editing) {
      const value = clearing ? '' : initialData(props)
      setValue(value)
      setReverting(false)
    }

    if (
      prevProps.current.editing === true &&
      !editing &&
      !reverting &&
      !committing &&
      value !== initialData(props)
    ) {
      onChange(row, col, value)
    }

    prevProps.current = props
  }, [props])

  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current)
    }
  })

  const handleChange = (incomingValue: string) => {
    setValue(incomingValue)
    setCommitting(false)
  }

  const handleCommit = (
    incomingValue: string,
    e?: KeyboardEvent | undefined,
  ) => {
    if (
      incomingValue !==
      initialData({ cell, row, col, valueRenderer, dataRenderer })
    ) {
      setValue(incomingValue)
      setCommitting(true)

      onChange(row, col, value)
    } else {
      handleRevert()
    }

    if (e) {
      e.preventDefault()
      onNavigate(e, true)
    }
  }

  const handleRevert = () => {
    setReverting(true)
    onRevert()
  }

  const handleMouseDown = (e: MouseEvent) => {
    if (!cell.disableEvents) {
      onMouseDown(row, col, e)
    }
  }

  const handleMouseOver = (e: MouseEvent) => {
    if (!cell.disableEvents) {
      onMouseOver(row, col)
    }
  }

  const handleDoubleClick = (e: MouseEvent) => {
    if (!cell.disableEvents) {
      onDoubleClick(row, col)
    }
  }

  const handleContextMenu = (e: MouseEvent) => {
    if (!cell.disableEvents) {
      onContextMenu(e, row, col)
    }
  }

  const handleKey = (e: KeyboardEvent) => {
    const keyCode = e.which || e.keyCode
    if (keyCode === ESCAPE_KEY) {
      return handleRevert()
    }

    const { component } = cell

    const eatKeys = forceEdit || !!component
    const commit =
      keyCode === ENTER_KEY ||
      keyCode === TAB_KEY ||
      (!eatKeys && [LEFT_KEY, RIGHT_KEY, UP_KEY, DOWN_KEY].includes(keyCode))

    if (commit) {
      handleCommit(value, e)
    }
  }

  const renderComponent = <T,>(
    editing: boolean,
    incomingCell: CellShape<T>,
  ) => {
    if (!incomingCell) {
      return undefined
    }

    const { component, readOnly, forceComponent } = incomingCell

    if ((editing && !readOnly) || forceComponent) {
      return component
    }
  }

  const renderEditor = <T,>(
    editing: boolean,
    cell: CellShape<T>,
    row: number,
    col: number,
    dataEditor?: ComponentType<EditorProps<CellShape<T>>>,
  ) => {
    if (!editing) {
      return undefined
    }

    // console.log('EDITOR: cell.dataEditor', Boolean(cell.dataEditor))
    // console.log('EDITOR: dataEditor', Boolean(dataEditor))
    // console.log('EDITOR: DataEditor', Boolean(DataEditor))
    // console.log('EDITOR VALUE: cell', cell)

    const Editor = cell.dataEditor || dataEditor || DataEditor

    return (
      <Editor
        cell={cell}
        row={row}
        col={col}
        value={value}
        onChange={handleChange}
        onCommit={handleCommit}
        onRevert={handleRevert}
        onKeyDown={handleKey}
      />
    )
  }

  const renderViewer = <T,>(
    cell: CellShape<T>,
    row: number,
    col: number,
    valueRenderer: ValueRenderer<T>,
    valueViewer?: ComponentType<ValueViewerProps<T>>,
  ) => {
    const Viewer = cell.valueViewer || valueViewer || ValueViewer
    const value = renderValue(cell, row, col, valueRenderer)
    return <Viewer cell={cell} row={row} col={col} value={value} />
  }

  const renderedComponent = renderComponent(editing, cell)
  const renderedEditor = renderEditor(editing, cell, row, col, dataEditor)
  const renderedViewer = renderViewer(
    cell,
    row,
    col,
    valueRenderer,
    valueViewer,
  )

  const content = renderedComponent || renderedEditor || renderedViewer

  const className = [
    cell.className,
    'cell',
    cell.overflow,
    selected && 'selected',
    editing && 'editing',
    cell.readOnly && 'read-only',
    updated && 'updated',
  ]
    .filter(a => a)
    .join(' ')

  return (
    <CellRenderer
      row={row}
      col={col}
      cell={cell}
      selected={selected}
      editing={editing}
      updated={updated}
      attributesRenderer={attributesRenderer}
      className={className}
      style={widthStyle(cell)}
      onMouseDown={handleMouseDown}
      onMouseOver={handleMouseOver}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      onTouchEnd={onTouchEnd}
      onKeyUp={onKeyUp}
    >
      {content}
    </CellRenderer>
  )
}

export default DataCell

// DataCell.defaultProps = {
//   forceEdit: false,
//   selected: false,
//   editing: false,
//   clearing: false,
//   cellRenderer: Cell,
// };

// constructor(props) {
//   super(props);
//   this.handleChange = this.handleChange.bind(this);
//   this.handleCommit = this.handleCommit.bind(this);
//   this.handleRevert = this.handleRevert.bind(this);

//   this.handleKey = this.handleKey.bind(this);
//   this.handleMouseDown = this.handleMouseDown.bind(this);
//   this.handleMouseOver = this.handleMouseOver.bind(this);
//   this.handleContextMenu = this.handleContextMenu.bind(this);
//   this.handleDoubleClick = this.handleDoubleClick.bind(this);

//   this.state = {
//     updated: false,
//     reverting: false,
//     committing: false,
//     value: '',
//   };
// }

// componentDidUpdate(prevProps) {
//   if (
//     !this.props.cell.disableUpdatedFlag &&
//     initialValue(prevProps) !== initialValue(this.props)
//   ) {
//     this.setState({ updated: true });
//     this.timeout = setTimeout(() => this.setState({ updated: false }), 700);
//   }
//   if (this.props.editing === true && prevProps.editing === false) {
//     const value = this.props.clearing ? '' : initialData(this.props);
//     this.setState({ value, reverting: false });
//   }

//   if (
//     prevProps.editing === true &&
//     this.props.editing === false &&
//     !this.state.reverting &&
//     !this.state.committing &&
//     this.state.value !== initialData(this.props)
//   ) {
//     this.props.onChange(this.props.row, this.props.col, this.state.value);
//   }
// }
