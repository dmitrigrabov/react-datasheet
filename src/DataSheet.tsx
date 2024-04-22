import { Sheet } from './Sheet'
import { Row } from './Row'
import { Cell } from './Cell'
import DataCell from './DataCell'
import { DataEditor } from './DataEditor'
import ValueViewer from './ValueViewer'
import {
  TAB_KEY,
  ENTER_KEY,
  DELETE_KEY,
  ESCAPE_KEY,
  BACKSPACE_KEY,
  LEFT_KEY,
  UP_KEY,
  DOWN_KEY,
  RIGHT_KEY,
} from './keys'
import {
  CellRendererType,
  CellShape,
  DataRenderer,
  EditorProps,
  HandleCopyFunction,
  IJ,
  RowRenderer,
  SheetRenderer,
  ValueRenderer,
  ValueViewerProps,
} from 'types'
import {
  KeyboardEvent,
  ComponentType,
  MouseEvent,
  TdHTMLAttributes,
  useCallback,
  useEffect,
  useRef,
  useState,
  KeyboardEventHandler,
} from 'react'

const range = (start: number, end: number) => {
  const array = []
  const inc = end - start > 0
  for (let i = start; inc ? i <= end : i >= end; inc ? i++ : i--) {
    inc ? array.push(i) : array.unshift(i)
  }
  return array
}

const defaultParsePaste = (str: string): string[][] => {
  return str.split(/\r\n|\n|\r/).map(row => row.split('\t'))
}

type CellSelection = {
  start: IJ
  end: IJ
}

type SelectedCell<T> = {
  row: number
  /** The current column index */
  col: number
  /** The cell's raw data structure */
  cell?: CellShape<T>
  value?: string
}

type RowPasteData<T> = {
  cell: CellShape<T>
  data: string
}

type DataAttributeKey = `data-${string}`

type DataAttributes = Record<DataAttributeKey, string>

type DataSheetProps<T> = {
  data: CellShape<T>[][]
  className?: string
  disablePageClick?: boolean
  overflow?: 'wrap' | 'nowrap' | 'clip'
  onChange?: (cell: CellShape<T>, i: number, j: number, value: string) => void
  onCellsChanged?: (
    changes: SelectedCell<T>[],
    additions?: SelectedCell<T>[],
  ) => void
  onContextMenu?: (
    e: MouseEvent,
    cell: CellShape<T>,
    i: number,
    j: number,
  ) => void
  onSelect?: (selection: CellSelection | undefined) => void
  isCellNavigable?: (cell: CellShape<T>, i: number, j: number) => boolean
  selected?: CellSelection | undefined
  valueRenderer: ValueRenderer<T>
  dataRenderer?: DataRenderer<T>
  sheetRenderer?: SheetRenderer<T>
  rowRenderer?: RowRenderer<T>
  cellRenderer?: CellRendererType<T>
  valueViewer?: ComponentType<ValueViewerProps<T>>
  dataEditor?: ComponentType<EditorProps<CellShape<T>>>
  parsePaste?: (str: string) => string[][]
  attributesRenderer?: (
    cell: CellShape<T>,
    row: number,
    col: number,
  ) =>
    | (TdHTMLAttributes<HTMLTableCellElement> & DataAttributes)
    | null
  keyFn?: (row: number, col?: number) => string
  handleCopy?: HandleCopyFunction<T>
  editModeChanged?: (inEditMode: boolean) => void
  onPaste?: (changes: RowPasteData<T>[][]) => void
}

type DataSheetState = {
  start: IJ | undefined
  end: IJ | undefined
  selecting: boolean
  forceEdit: boolean
  editing: IJ | undefined
  clear: IJ | undefined
}

const defaultState: DataSheetState = {
  start: undefined,
  end: undefined,
  selecting: false,
  forceEdit: false,
  editing: undefined,
  clear: undefined,
}

export const DataSheet = <T,>(props: DataSheetProps<T>) => {
  const [start, setStart] = useState<IJ>()
  const [end, setEnd] = useState<IJ>()
  const [selecting, setSelecting] = useState(false)
  const [forceEdit, setForceEdit] = useState(false)
  const [editing, setEditing] = useState<IJ>()
  const [clear, setClear] = useState<Record<string, unknown>>()

  const {
    selected,
    editModeChanged,
    disablePageClick,
    dataRenderer,
    valueRenderer,
    data,
    parsePaste,
    onCellsChanged,
    onPaste,
    isCellNavigable,
    onSelect,
  } = props

  const removeAllListeners = () => {
    document.removeEventListener('mousedown', pageClick)
    document.removeEventListener('mouseup', onMouseUp)
    document.removeEventListener('cut', handleCut)
    document.removeEventListener('copy', handleCopy)
    document.removeEventListener('paste', handlePaste)
    document.removeEventListener('keydown', handleIEClipboardEvents)
  }

  const parentRef = useRef<HTMLDivElement>(null)
  const prevEndRef = useRef<IJ>()

  // Add listener scoped to the DataSheet that catches otherwise unhandled
  // keyboard events when displaying components
  useEffect(() => {
    parentRef.current?.addEventListener('keydown', handleComponentKey)

    return () => {
      parentRef.current?.removeEventListener('keydown', handleComponentKey)
      removeAllListeners()
    }
  }, [])

  const isSelectionControlled = () => 'selected' in props

  const getState = () => {
    const state = {
      start,
      end,
      selecting,
      forceEdit,
      editing,
      clear,
    }

    if (isSelectionControlled()) {
      const { start, end } = selected || {}
      // start = start || this.defaultState.start
      // end = end || this.defaultState.end
      return { ...state, start, end }
    } else {
      return state
    }
  }

  const _setState = (state: Partial<DataSheetState>) => {
    if (editModeChanged && state.editing) {
      const wasEditing = Boolean(editing)
      const wilBeEditing = Boolean(state.editing)
      if (wasEditing != wilBeEditing) {
        editModeChanged(wilBeEditing)
      }
    }

    if (isSelectionControlled() && ('start' in state || 'end' in state)) {
      let { start, end, ...rest } = state

      if (!start) {
        start = selected && 'start' in selected ? selected.start : undefined
      }

      if (!end) {
        end = selected && 'end' in selected ? selected.end : undefined
      }

      onSelect && onSelect(start && end ? { start, end } : undefined)
      setSelecting(rest.selecting ?? false)
      setForceEdit(rest.forceEdit ?? false)
      setEditing(rest.editing)
      setClear(rest.clear)
    } else {
      setStart(state.start)
      setEnd(state.end)
      setSelecting(state.selecting ?? false)
      setForceEdit(state.forceEdit ?? false)
      setEditing(state.editing)
      setClear(state.clear)
    }
  }

  const pageClick: EventListener = useCallback(e => {
    if (disablePageClick) {
      return
    }

    const element = parentRef.current

    if (!(e.target instanceof HTMLElement) || !element?.contains(e.target)) {
      setStart(defaultState.start)
      setEnd(defaultState.end)
      setSelecting(defaultState.selecting)
      setForceEdit(defaultState.forceEdit)
      setEditing(defaultState.editing)
      setClear(defaultState.clear)

      removeAllListeners()
    }
  }, [])

  const handleCut = useCallback((event: Event) => {
    if (!editing) {
      event.preventDefault()

      handleCopy(event)
      const { start, end } = getState()
      if (start && end) {
        clearSelectedCells(start, end)
      }
    }
  }, [])

  const handleIEClipboardEvents = useCallback((event: Event) => {
    if (event instanceof KeyboardEvent && event.ctrlKey) {
      if (event.keyCode === 67) {
        // C - copy
        handleCopy(event)
      } else if (event.keyCode === 88) {
        // X - cut
        handleCut(event)
      } else if (event.keyCode === 86 || event.which === 86) {
        // P - patse
        handlePaste(event)
      }
    }
  }, [])

  const handleCopy = useCallback((event: Event) => {
    if (!editing) {
      return
    }

    event.preventDefault()

    const { start, end } = getState()

    if (!start || !end) {
      return
    }

    if (props.handleCopy) {
      return props.handleCopy({
        event,
        dataRenderer,
        valueRenderer,
        data,
        start,
        end,
        range,
      })
    }

    const text = range(start.i, end.i)
      .map(i =>
        range(start.j, end.j)
          .map(j => {
            const cell = data[i][j]
            const value = dataRenderer ? dataRenderer(cell, i, j) : null
            if (
              value === '' ||
              value === null ||
              typeof value === 'undefined'
            ) {
              return valueRenderer(cell, i, j)
            }
            return value
          })
          .join('\t'),
      )
      .join('\n')

    if (window.clipboardData && window.clipboardData.setData) {
      window.clipboardData.setData('Text', text)
    } else if (event instanceof ClipboardEvent && event.clipboardData) {
      event.clipboardData.setData('text/plain', text)
    }
  }, [])

  const handlePaste = useCallback((event: Event) => {
    if (editing) {
      return
    }

    const { start: initialStart, end: initialEnd } = getState()

    if (!initialStart || !initialEnd) {
      return
    }

    const start = {
      i: Math.min(initialStart.i, initialEnd.i),
      j: Math.min(initialStart.j, initialEnd.j),
    }

    const end = {
      i: Math.max(initialStart.i, initialEnd.i),
      j: Math.max(initialStart.j, initialEnd.j),
    }

    const parse = parsePaste || defaultParsePaste

    const changes: SelectedCell<T>[] = []
    let pasteData: string[][] = []
    if (window.clipboardData && window.clipboardData.getData) {
      // IE
      pasteData = parse(window.clipboardData.getData('Text'))
    } else if (
      event instanceof ClipboardEvent &&
      event.clipboardData &&
      event.clipboardData.getData
    ) {
      pasteData = parse(event.clipboardData.getData('text/plain'))
    }

    // in order of preference
    // const { data, onCellsChanged, onPaste, onChange } = this.props

    let tempEnd: IJ | undefined

    if (onCellsChanged) {
      const additions: SelectedCell<T>[] = []
      pasteData.forEach((row, i) => {
        row.forEach((value, j) => {
          tempEnd = { i: start.i + i, j: start.j + j } as IJ
          const cell = data[tempEnd.i] && data[tempEnd.i][tempEnd.j]
          if (!cell) {
            additions.push({ row: tempEnd.i, col: tempEnd.j, value })
          } else if (!cell.readOnly) {
            changes.push({ cell, row: tempEnd.i, col: tempEnd.j, value })
          }
        })
      })

      if (additions.length) {
        onCellsChanged(changes, additions)
      } else {
        onCellsChanged(changes)
      }
    } else if (onPaste) {
      const pasteChanges: RowPasteData<T>[][] = []
      pasteData.forEach((row, i) => {
        const rowData: RowPasteData<T>[] = []
        row.forEach((pastedData, j) => {
          tempEnd = { i: start.i + i, j: start.j + j } as IJ
          const cell = data[tempEnd.i] && data[tempEnd.i][tempEnd.j]
          rowData.push({ cell: cell, data: pastedData })
        })
        pasteChanges.push(rowData)
      })
      onPaste(pasteChanges)
    } else if (props.onChange) {
      pasteData.forEach((row, i) => {
        row.forEach((value, j) => {
          tempEnd = { i: start.i + i, j: start.j + j } as IJ
          const cell = data[tempEnd.i] && data[tempEnd.i][tempEnd.j]
          if (cell && !cell.readOnly) {
            props.onChange?.(cell, tempEnd.i, tempEnd.j, value)
          }
        })
      })
    }
    _setState({ end: tempEnd })
  }, [])

  const handleKeyboardCellMovement = (e: KeyboardEvent, commit = false) => {
    if (!(e instanceof KeyboardEvent)) {
      return
    }

    const { start, editing } = getState()
    if (!start || !editing) {
      return
    }

    const isEditing = Boolean(editing)
    const currentCell = data[start.i] && data[start.i][start.j]

    if (isEditing && !commit) {
      return false
    }
    const hasComponent = currentCell && currentCell.component

    const keyCode = e.which || e.keyCode

    if (hasComponent && isEditing) {
      e.preventDefault()
      return
    }

    if (keyCode === TAB_KEY) {
      handleNavigate(e, { i: 0, j: e.shiftKey ? -1 : 1 }, true)
    } else if (keyCode === RIGHT_KEY) {
      handleNavigate(e, { i: 0, j: 1 })
    } else if (keyCode === LEFT_KEY) {
      handleNavigate(e, { i: 0, j: -1 })
    } else if (keyCode === UP_KEY) {
      handleNavigate(e, { i: -1, j: 0 })
    } else if (keyCode === DOWN_KEY) {
      handleNavigate(e, { i: 1, j: 0 })
    } else if (commit && keyCode === ENTER_KEY) {
      handleNavigate(e, { i: e.shiftKey ? -1 : 1, j: 0 })
    }
  }

  const handleKey: KeyboardEventHandler<HTMLSpanElement> = e => {
    if (e.isPropagationStopped && e.isPropagationStopped()) {
      return
    }

    const keyCode = e.which || e.keyCode
    const { start, end, editing } = getState()
    const isEditing = Boolean(editing)

    const noCellsSelected = !start || !end // <-- added !end check. could be wrong

    const ctrlKeyPressed = e.ctrlKey || e.metaKey
    const deleteKeysPressed =
      keyCode === DELETE_KEY || keyCode === BACKSPACE_KEY
    const enterKeyPressed = keyCode === ENTER_KEY
    const numbersPressed = keyCode >= 48 && keyCode <= 57
    const lettersPressed = keyCode >= 65 && keyCode <= 90
    const latin1Supplement = keyCode >= 160 && keyCode <= 255
    const numPadKeysPressed = keyCode >= 96 && keyCode <= 105
    const currentCell = !noCellsSelected && data[start.i][start.j]
    const equationKeysPressed =
      [
        187 /* equal */,
        189 /* substract */,
        190 /* period */,
        107 /* add */,
        109 /* decimal point */,
        110,
      ].indexOf(keyCode) > -1

    if (noCellsSelected || ctrlKeyPressed) {
      return
    }

    if (!isEditing) {
      handleKeyboardCellMovement(e)
      if (deleteKeysPressed) {
        e.preventDefault()
        clearSelectedCells(start, end)
      } else if (currentCell && !currentCell.readOnly) {
        if (enterKeyPressed) {
          _setState({ editing: start, clear: undefined, forceEdit: true })
          e.preventDefault()
        } else if (
          numbersPressed ||
          numPadKeysPressed ||
          lettersPressed ||
          latin1Supplement ||
          equationKeysPressed
        ) {
          // empty out cell if user starts typing without pressing enter
          _setState({ editing: start, clear: start, forceEdit: false })
        }
      }
    }
  }

  const getSelectedCells = (dataArg: CellShape<T>[][], start: IJ, end: IJ) => {
    const selected: SelectedCell<T>[] = []

    range(start.i, end.i).map(row => {
      range(start.j, end.j).map(col => {
        if (dataArg[row] && dataArg[row][col]) {
          selected.push({ cell: dataArg[row][col], row, col })
        }
      })
    })

    return selected
  }

  const clearSelectedCells = (start: IJ, end: IJ) => {
    const cells = getSelectedCells(data, start, end)
      .filter(cell => !cell.cell?.readOnly)
      .map(cell => ({ ...cell, value: '' }))

    if (onCellsChanged) {
      onCellsChanged(cells)
      onRevert()
    } else if (props.onChange) {
      // ugly solution brought to you by https://reactjs.org/docs/react-component.html#setstate
      // setState in a loop is unreliable
      setTimeout(() => {
        cells.forEach(({ cell, row, col, value }) => {
          cell && props.onChange?.(cell, row, col, value)
        })
        onRevert()
      }, 0)
    }
  }

  const updateLocationSingleCell = (location: IJ | undefined) => {
    _setState({
      start: location,
      end: location,
      editing: undefined,
    })
  }

  const updateLocationMultipleCells = (offsets: IJ) => {
    const { start, end } = getState()

    if (!start || !end) {
      return
    }

    const oldStartLocation = { i: start.i, j: start.j }
    const newEndLocation = {
      i: end.i + offsets.i,
      j: Math.min(data[0].length - 1, Math.max(0, end.j + offsets.j)),
    }
    _setState({
      start: oldStartLocation,
      end: newEndLocation,
      editing: undefined,
    })
  }

  const searchForNextSelectablePos = (
    isCellNavigable: (cell: CellShape<T>, i: number, j: number) => boolean,
    dataArg: CellShape<T>[][],
    start: IJ,
    offsets: IJ,
    jumpRow?: boolean,
  ): IJ | null => {
    const previousRow = (location: IJ) => ({
      i: location.i - 1,
      j: dataArg[0].length - 1,
    })
    const nextRow = (location: IJ) => ({ i: location.i + 1, j: 0 })
    const advanceOffset = (location: IJ) => ({
      i: location.i + offsets.i,
      j: location.j + offsets.j,
    })
    const isCellDefined = ({ i, j }: IJ) =>
      dataArg[i] && typeof dataArg[i][j] !== 'undefined'

    let newLocation = advanceOffset(start)

    while (
      isCellDefined(newLocation) &&
      !isCellNavigable(
        dataArg[newLocation.i][newLocation.j],
        newLocation.i,
        newLocation.j,
      )
    ) {
      newLocation = advanceOffset(newLocation)
    }

    if (!isCellDefined(newLocation)) {
      if (!jumpRow) {
        return null
      }
      if (offsets.j < 0) {
        newLocation = previousRow(newLocation)
      } else {
        newLocation = nextRow(newLocation)
      }
    }

    if (
      isCellDefined(newLocation) &&
      !isCellNavigable(
        dataArg[newLocation.i][newLocation.j],
        newLocation.i,
        newLocation.j,
      )
    ) {
      return searchForNextSelectablePos(
        isCellNavigable,
        dataArg,
        newLocation,
        offsets,
        jumpRow,
      )
    } else if (isCellDefined(newLocation)) {
      return newLocation
    } else {
      return null
    }
  }

  const handleNavigate = (e: Event, offsets: IJ, jumpRow?: boolean) => {
    if (!(e instanceof KeyboardEvent)) {
      return
    }

    if (offsets && (offsets.i || offsets.j)) {
      const { start } = getState()

      if (!start) {
        return
      }

      const multiSelect = e.shiftKey && !jumpRow

      if (multiSelect) {
        updateLocationMultipleCells(offsets)
      } else {
        const newLocation = searchForNextSelectablePos(
          isCellNavigable ?? (() => true),
          data,
          start,
          offsets,
          jumpRow,
        )

        if (newLocation) {
          updateLocationSingleCell(newLocation)
        }
      }
      e.preventDefault()
    }
  }

  const handleComponentKey = (e: Event) => {
    if (!(e instanceof KeyboardEvent)) {
      return
    }
    // handles keyboard events when editing components
    const keyCode = e.which || e.keyCode
    if (![ENTER_KEY, ESCAPE_KEY, TAB_KEY].includes(keyCode)) {
      return
    }

    if (editing) {
      const currentCell = editing ? data[editing.i][editing.j] : undefined
      const offset = e.shiftKey ? -1 : 1
      if (currentCell && currentCell.component && !currentCell.forceComponent) {
        e.preventDefault()
        let func = onRevert // ESCAPE_KEY
        if (keyCode === ENTER_KEY) {
          func = () => handleNavigate(e, { i: offset, j: 0 })
        } else if (keyCode === TAB_KEY) {
          func = () => handleNavigate(e, { i: 0, j: offset }, true)
        }
        // setTimeout makes sure that component is done handling the event before we take over
        setTimeout(() => {
          func()
          parentRef.current?.focus({ preventScroll: true })
        }, 1)
      }
    }
  }

  const onContextMenu = (evt: MouseEvent, i: number, j: number) => {
    const cell = data[i][j]
    if (props.onContextMenu) {
      props.onContextMenu(evt, cell, i, j)
    }
  }

  const onDoubleClick = (i: number, j: number) => {
    const cell = data[i][j]
    if (!cell.readOnly) {
      _setState({ editing: { i: i, j: j }, forceEdit: true, clear: undefined })
    }
  }

  const onMouseDown = (i: number, j: number, e: MouseEvent) => {
    const isNowEditingSameCell = editing && editing.i === i && editing.j === j
    const updatedEditing =
      !editing || editing.i !== i || editing.j !== j ? undefined : editing

    _setState({
      selecting: !isNowEditingSameCell,
      start: e.shiftKey ? getState().start : { i, j },
      end: { i, j },
      editing: updatedEditing,
      forceEdit: !!isNowEditingSameCell,
    })

    const ua = window.navigator.userAgent
    const isIE = /MSIE|Trident/.test(ua)
    // Listen for Ctrl + V in case of IE
    if (isIE) {
      document.addEventListener('keydown', handleIEClipboardEvents)
    }

    // Keep listening to mouse if user releases the mouse (dragging outside)
    document.addEventListener('mouseup', onMouseUp)
    // Listen for any outside mouse clicks
    document.addEventListener('mousedown', pageClick)

    // Cut, copy and paste event handlers
    document.addEventListener('cut', handleCut)
    document.addEventListener('copy', handleCopy)
    document.addEventListener('paste', handlePaste)
  }

  const onMouseOver = (i: number, j: number) => {
    if (selecting && !editing) {
      _setState({ end: { i, j } })
    }
  }

  const onMouseUp = useCallback(() => {
    _setState({ selecting: false })
    document.removeEventListener('mouseup', onMouseUp)
  }, [])

  const onChange = (row: number, col: number, value: string) => {
    // const { onChange, onCellsChanged, data } = this.props
    if (onCellsChanged) {
      onCellsChanged([{ cell: data[row][col], row, col, value }])
    } else if (props.onChange) {
      props.onChange(data[row][col], row, col, value)
    }
    onRevert()
  }

  const onRevert = () => {
    _setState({ editing: undefined })
    // setTimeout makes sure that component is done handling the new state before we take over
    setTimeout(() => {
      parentRef.current?.focus({ preventScroll: true })
    }, 1)
  }

  useEffect(() => {
    if (
      start && // this may be incorrect
      onSelect &&
      end &&
      !(end.i === prevEndRef.current?.i && end.j === prevEndRef.current?.j) &&
      !isSelectionControlled()
    ) {
      onSelect({ start, end })
    }

    prevEndRef.current = end
  }, [])

  const isSelectedRow = (rowIndex: number) => {
    const { start, end } = getState()

    if (!start || !end) {
      return false
    }

    const startY = start.i
    const endY = end.i

    if (startY <= endY) {
      return rowIndex >= startY && rowIndex <= endY
    } else {
      return rowIndex <= startY && rowIndex >= endY
    }
  }

  const isSelected = (i: number, j: number) => {
    const { start, end } = getState()

    if (!start || !end) {
      return false
    }

    const posX = j >= start.j && j <= end.j
    const negX = j <= start.j && j >= end.j
    const posY = i >= start.i && i <= end.i
    const negY = i <= start.i && i >= end.i

    return (posX && posY) || (negX && posY) || (negX && negY) || (posX && negY)
  }

  const isEditingFn = (i: number, j: number) => {
    return editing && editing.i === i && editing.j === j
  }

  const isClearing = (i: number, j: number) => {
    return clear && clear.i === i && clear.j === j
  }

  const {
    sheetRenderer: SheetRenderer = Sheet,
    rowRenderer: RowRenderer = Row,
    cellRenderer = Cell,
    dataEditor = DataEditor,
    valueViewer = ValueViewer,
    attributesRenderer,
    className,
    overflow,
    keyFn,
  } = props

  return (
    <span
      ref={parentRef}
      tabIndex={0}
      className="data-grid-container"
      onKeyDown={handleKey}
    >
      <SheetRenderer
        data={data}
        className={['data-grid', className, overflow].filter(a => a).join(' ')}
      >
        {data.map((row, i) => (
          <RowRenderer
            key={keyFn ? keyFn(i) : i}
            row={i}
            cells={row}
            selected={isSelectedRow(i)}
          >
            {row.map((cell, j) => {
              const isEditing = isEditingFn(i, j)

              return (
                <DataCell
                  key={cell.key ? cell.key : `${i}-${j}`}
                  row={i}
                  col={j}
                  cell={cell}
                  forceEdit={isEditing ? forceEdit : false}
                  onMouseDown={onMouseDown}
                  onMouseOver={onMouseOver}
                  onDoubleClick={onDoubleClick}
                  onContextMenu={onContextMenu}
                  onChange={onChange}
                  onRevert={onRevert}
                  onNavigate={handleKeyboardCellMovement}
                  onKeyUp={handleKey}
                  selected={isSelected(i, j)}
                  editing={isEditing}
                  clearing={isClearing(i, j)}
                  attributesRenderer={attributesRenderer}
                  cellRenderer={cellRenderer}
                  valueRenderer={valueRenderer}
                  dataRenderer={dataRenderer}
                  valueViewer={valueViewer}
                  dataEditor={dataEditor}
                />
              )
            })}
          </RowRenderer>
        ))}
      </SheetRenderer>
    </span>
  )
}
