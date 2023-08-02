import Sheet from './Sheet'
import Row from './Row'
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
import { CellRenderer, CellShape, DataRenderer, EditorProps, RowRenderer, SheetRenderer, ValueRenderer, ValueViewerProps } from 'types'
import { ComponentType, MouseEvent, TdHTMLAttributes, useCallback, useEffect, useRef, useState } from 'react'

const isEmpty = (obj: Record<string, unknown> | undefined) => {
  return typeof obj !== 'undefined' && Object.keys(obj).length === 0
}

const range = (start:number, end: number) => {
  const array = []
  const inc = end - start > 0
  for (let i = start; inc ? i <= end : i >= end; inc ? i++ : i--) {
    inc ? array.push(i) : array.unshift(i)
  }
  return array
}

const defaultParsePaste = (str:string) => {
  return str.split(/\r\n|\n|\r/).map(row => row.split('\t'))
}

type IJ = {
  i: number
  j: number
}

type CellSelection = {
  start: IJ
  end: IJ
}

type DataSheetProps<T> = {
  data: CellShape<T>[][]
  className?: string
  disablePageClick?: boolean
  overflow?: 'wrap' | 'nowrap' | 'clip'
  onChange?: (data: unknown[][]) => void
  onCellsChanged?: (changes: CellShape<T>[][], additions?:CellShape<T>[][]) => void
  onContextMenu?: (e: MouseEvent, cell: CellShape<T>, i:number, j:number) => void
  onSelect?: (selection: unknown) => void
  isCellNavigable?: (cell: CellShape<T>, i: number, j: number) => boolean
  selected?: CellSelection
  valueRenderer: ValueRenderer
  dataRenderer?: DataRenderer
  sheetRenderer: SheetRenderer<T>
  rowRenderer: RowRenderer<T>
  cellRenderer: CellRenderer<T>
  valueViewer?: ComponentType<ValueViewerProps<T>>
  dataEditor?: ComponentType<EditorProps<CellShape<T>>>
  parsePaste?: (str: string) => unknown[][]
  attributesRenderer?: (
    cell: CellShape<T>,
    row: number,
    col: number,
  ) => TdHTMLAttributes<HTMLTableCellElement>
  keyFn?: (row: number, col?: number) => string
  handleCopy?: (data: unknown[][]) => void
  editModeChanged?: (row: number, col: number, value: boolean) => void
  onPaste?: (changes: unknown[][]) => void
}



// DataSheet.defaultProps = {
//   sheetRenderer: Sheet,
//   rowRenderer: Row,
//   cellRenderer: Cell,
//   valueViewer: ValueViewer,
//   dataEditor: DataEditor,
// }

// constructor(props) {
//   super(props)
//   this.onMouseDown = this.onMouseDown.bind(this)
//   this.onMouseUp = this.onMouseUp.bind(this)
//   this.onMouseOver = this.onMouseOver.bind(this)
//   this.onDoubleClick = this.onDoubleClick.bind(this)
//   this.onContextMenu = this.onContextMenu.bind(this)
//   this.handleNavigate = this.handleNavigate.bind(this)
//   this.handleKey = this.handleKey.bind(this).bind(this)
//   this.handleCut = this.handleCut.bind(this)
//   this.handleCopy = this.handleCopy.bind(this)
//   this.handlePaste = this.handlePaste.bind(this)
//   this.pageClick = this.pageClick.bind(this)
//   this.onChange = this.onChange.bind(this)
//   this.onRevert = this.onRevert.bind(this)
//   this.isSelected = this.isSelected.bind(this)
//   this.isEditing = this.isEditing.bind(this)
//   this.isClearing = this.isClearing.bind(this)
//   this.handleComponentKey = this.handleComponentKey.bind(this)

//   this.handleKeyboardCellMovement = this.handleKeyboardCellMovement.bind(this)

//   this.defaultState = {
//     start: {},
//     end: {},
//     selecting: false,
//     forceEdit: false,
//     editing: {},
//     clear: {},
//   }
//   this.state = this.defaultState

//   this.removeAllListeners = this.removeAllListeners.bind(this)
//   this.handleIEClipboardEvents = this.handleIEClipboardEvents.bind(this)
// }

type DataSheetState = {
  start: IJ | undefined
  end: IJ | undefined
  selecting: boolean
  forceEdit: boolean
  editing: IJ | undefined
  clear: Record<string, unknown> | undefined
}

const defaultState: DataSheetState = {
  start: undefined,
  end: undefined,
  selecting: false,
  forceEdit: false,
  editing: undefined,
  clear: undefined,
}

export const DataSheet = <T,>(props:DataSheetProps<T>) => {
  const [start, setStart] = useState<IJ>()
  const [end, setEnd] = useState<IJ>()
  const [selecting, setSelecting] = useState(false)
  const [forceEdit, setForceEdit] = useState(false)
  const [editing, setEditing] = useState<IJ>()
  const [clear, setClear] = useState<Record<string, unknown>>()

  const {selected, editModeChanged, disablePageClick,
    dataRenderer, valueRenderer, data, parsePaste,
    onCellsChanged, onPaste, isCellNavigable
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

  // Add listener scoped to the DataSheet that catches otherwise unhandled
  // keyboard events when displaying components
  useEffect(() => {  
    parent &&
    parent.addEventListener('keydown', handleComponentKey)

    return () => {
      parent &&
      parent.removeEventListener('keydown', handleComponentKey)
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
      let { selected, onSelect } = props
    
      if (!start) {
        start = selected && 'start' in selected ? selected.start : undefined
      }
      
      if (!end) {
        end = selected && 'end' in selected ? selected.end : undefined
      }

      onSelect && onSelect({ start, end })
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

  const pageClick = useCallback( (e) => {
    if (disablePageClick) {
      return
    }

    const element = parentRef.current
    
    if (!element.contains(e.target)) {
      setStart(defaultState.start)
      setEnd(defaultState.end)
      setSelecting(defaultState.selecting)
      setForceEdit(defaultState.forceEdit)
      setEditing(defaultState.editing)
      setClear(defaultState.clear)

      removeAllListeners()
    }
  }, [])

  const handleCut = useCallback((e) => {
    if (!editing) {
      e.preventDefault()
      
      handleCopy(e)
      const { start, end } = getState()
      clearSelectedCells(start, end)
    }
  }, [])

  const handleIEClipboardEvents = useCallback( (e) => {
    if (e.ctrlKey) {
      if (e.keyCode === 67) {
        // C - copy
        handleCopy(e)
      } else if (e.keyCode === 88) {
        // X - cut
        handleCut(e)
      } else if (e.keyCode === 86 || e.which === 86) {
        // P - patse
        handlePaste(e)
      }
    }
  }, [])

  const handleCopy = useCallback((e) => {
    if (!editing) {
      return
    }

    e.preventDefault()

    const { start, end } = getState()

    if( props.handleCopy) {
      props.handleCopy({
        event: e,
        dataRenderer,
        valueRenderer,
        data,
        start,
        end,
        range,
      })
      return 
    }

    const text = start && end ? range(start.i, end.i)
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
      .join('\n') : ''


    if (window.clipboardData && window.clipboardData.setData) {
      window.clipboardData.setData('Text', text)
    } else {
      e.clipboardData.setData('text/plain', text)
    }
  }, [])

  const handlePaste = useCallback((e) => {
    if (editing) {
      return
    }

    const { start: initialStart, end: initialEnd } = getState()

    const start = initialStart && initialEnd ? { i: Math.min(initialStart.i, initialEnd.i), j: Math.min(initialStart.j, initialEnd.j) } : undefined
    const end = initialStart && initialEnd ? { i: Math.max(initialStart.i, initialEnd.i), j: Math.max(initialStart.j, initialEnd.j) }  : undefined

    const parse = parsePaste || defaultParsePaste

    const changes:CellShape<T>[][] = []
    let pasteData:T[][] = [] 
    if (window.clipboardData && window.clipboardData.getData) {
      // IE
      pasteData = parse(window.clipboardData.getData('Text'))
    } else if (e.clipboardData && e.clipboardData.getData) {
      pasteData = parse(e.clipboardData.getData('text/plain'))
    }

    // in order of preference
    // const { data, onCellsChanged, onPaste, onChange } = this.props
    if (onCellsChanged) {
      const additions:CellShape<T>[][] = []
      pasteData.forEach((row, i) => {
        row.forEach((value, j) => {
          end = { i: start.i + i, j: start.j + j }
          const cell = data[end.i] && data[end.i][end.j]
          if (!cell) {
            additions.push({ row: end.i, col: end.j, value })
          } else if (!cell.readOnly) {
            changes.push({ cell, row: end.i, col: end.j, value })
          }
        })
      })

      if (additions.length) {
        onCellsChanged(changes, additions)
      } else {
        onCellsChanged(changes)
      }
    } else if (onPaste) {
      pasteData.forEach((row, i) => {
        const rowData:CellShape<T>[] = []
        row.forEach((pastedData, j) => {
          end = { i: start.i + i, j: start.j + j }
          const cell = data[end.i] && data[end.i][end.j]
          rowData.push({ cell: cell, data: pastedData })
        })
        changes.push(rowData)
      })
      onPaste(changes)
    } else if (props.onChange) {
      pasteData.forEach((row, i) => {
        row.forEach((value, j) => {
          end = { i: start.i + i, j: start.j + j }
          const cell = data[end.i] && data[end.i][end.j]
          if (cell && !cell.readOnly) {
            props.onChange(cell, end.i, end.j, value)
          }
        })
      })
    }
    _setState({ end })
    
  },  [])

  const handleKeyboardCellMovement = (e, commit = false) => {
    const { start, editing } = getState()

    const isEditing = editing && !isEmpty(editing)
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

  const handleKey = (e) => {
    if (e.isPropagationStopped && e.isPropagationStopped()) {
      return
    }
    const keyCode = e.which || e.keyCode
    const { start, end, editing } = getState()
    const isEditing = Boolean(editing)
    const noCellsSelected = !start || isEmpty(start)
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
        187 /* equal */, 189 /* substract */, 190 /* period */, 107 /* add */,
        109 /* decimal point */, 110,
      ].indexOf(keyCode) > -1

    if (noCellsSelected || ctrlKeyPressed) {
      return true
    }

    if (!isEditing) {
      handleKeyboardCellMovement(e)
      if (deleteKeysPressed) {
        e.preventDefault()
        clearSelectedCells(start, end)
      } else if (currentCell && !currentCell.readOnly) {
        if (enterKeyPressed) {
          _setState({ editing: start, clear: {}, forceEdit: true })
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

  const getSelectedCells = (cellData, start, end) => {
    const selected = []
    
    range(start.i, end.i).map(row => {
      range(start.j, end.j).map(col => {
        if (cellData[row] && cellData[row][col]) {
          selected.push({ cell: cellData[row][col], row, col })
        }
      })
    })

    return selected
  }

  const clearSelectedCells = (start:IJ, end:IJ) => {
    // const { data, onCellsChanged, onChange } = this.props
    const cells = getSelectedCells(data, start, end)
      .filter(cell => !cell.cell.readOnly)
      .map(cell => ({ ...cell, value: '' }))
    if (onCellsChanged) {
      onCellsChanged(cells)
      onRevert()
    } else if (props.onChange) {
      // ugly solution brought to you by https://reactjs.org/docs/react-component.html#setstate
      // setState in a loop is unreliable
      setTimeout(() => {
        cells.forEach(({ cell, row, col, value }) => {
          props.onChange(cell, row, col, value)
        })
        props.onRevert()
      }, 0)
    }
  }

  const updateLocationSingleCell = (location:IJ | undefined) => {
    _setState({
      start: location,
      end: location,
      editing: undefined,
    })
  }

  const updateLocationMultipleCells = (offsets:IJ) => {
    const { start, end } = getState()

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

  const searchForNextSelectablePos = (isCellNavigable:(cell: CellShape<T>, i: number, j: number) => boolean, dataArg:CellShape<T>[][], start:IJ, offsets:IJ, jumpRow?: boolean):IJ|null => {
    const previousRow = (location:IJ) => ({
      i: location.i - 1,
      j: dataArg[0].length - 1,
    })
    const nextRow = (location:IJ) => ({ i: location.i + 1, j: 0 })
    const advanceOffset = (location:IJ) => ({
      i: location.i + offsets.i,
      j: location.j + offsets.j,
    })
    const isCellDefined = ({ i, j }:IJ) =>
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

  const handleNavigate = (e, offsets:IJ, jumpRow?: boolean) => {
    if (offsets && (offsets.i || offsets.j)) {
    
      const { start } = getState()

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

  const handleComponentKey = (e) => {
    // handles keyboard events when editing components
    const keyCode = e.which || e.keyCode
    if (![ENTER_KEY, ESCAPE_KEY, TAB_KEY].includes(keyCode)) {
      return
    }


    if (Boolean(editing)) {
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
          parent && parent.focus({ preventScroll: true })
        }, 1)
      }
    }
  }

  const onContextMenu = (evt:MouseEvent, i:number, j:number) => {
    let cell = data[i][j]
    if (props.onContextMenu) {
      props.onContextMenu(evt, cell, i, j)
    }
  }

  const onDoubleClick = (i:number, j:number) => {
    let cell = data[i][j]
    if (!cell.readOnly) {
      _setState({ editing: { i: i, j: j }, forceEdit: true, clear: {} })
    }
  }

  const onMouseDown = (i:number, j:number, e:MouseEvent) => {
    const isNowEditingSameCell = editing && editing.i === i && editing.j === j
    let updatedEditing = !editing || editing.i !== i || editing.j !== j ? undefined : editing

    _setState({
      selecting: !isNowEditingSameCell,
      start: e.shiftKey ? getState().start : { i, j },
      end: { i, j },
      editing: updatedEditing,
      forceEdit: !!isNowEditingSameCell,
    })

    var ua = window.navigator.userAgent
    var isIE = /MSIE|Trident/.test(ua)
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

  const onMouseOver = (i:number, j: number) => {
    if (selecting && !editing) {
      _setState({ end: { i, j } })
    }
  }

  const onMouseUp = useCallback(() => {
    _setState({ selecting: false })
    document.removeEventListener('mouseup', onMouseUp)
  }, [])

  const onChange = (row:number, col:number, value:string) => {
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
      parent && parent.focus({ preventScroll: true })
    }, 1)
  }

  componentDidUpdate(prevProps, prevState) {
    let { start, end } = this.state
    let prevEnd = prevState.end
    if (
      !isEmpty(end) &&
      !(end.i === prevEnd.i && end.j === prevEnd.j) &&
      !this.isSelectionControlled()
    ) {
      this.props.onSelect && this.props.onSelect({ start, end })
    }
  }

  const isSelectedRow = (rowIndex: number) => {
    const { start, end } = getState()

    const startY = start.i
    const endY = end.i
    
    if (startY <= endY) {
      return rowIndex >= startY && rowIndex <= endY
    } else {
      return rowIndex <= startY && rowIndex >= endY
    }
  }

  const isSelected = (i:number, j:number) => {
    const { start, end } = getState()

    const posX = j >= start.j && j <= end.j
    const negX = j <= start.j && j >= end.j
    const posY = i >= start.i && i <= end.i
    const negY = i <= start.i && i >= end.i

    return (posX && posY) || (negX && posY) || (negX && negY) || (posX && negY)
  }

  const isEditingFn = (i:number, j:number) => {
    return editing && editing.i === i && editing.j === j
  }

  const isClearing = (i:number, j:number) => {
    return clear && clear.i === i && clear.j === j
  }


  const {
    sheetRenderer: SheetRenderer,
    rowRenderer: RowRenderer,
    cellRenderer,
    dataEditor,
    valueViewer,
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
        className={['data-grid', className, overflow]
          .filter(a => a)
          .join(' ')}
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



