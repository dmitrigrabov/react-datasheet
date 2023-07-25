import { KeyboardEventHandler, useEffect, useRef } from 'react'
import CellShape from './CellShape'

type V = string | number | readonly string[] | undefined

type DataEditorProps = {
  value: V
  row: number
  col: number
  cell?: CellShape
  onChange: (value: V) => void
  onCommit: (value: V) => void
  onRevert: (value: V) => void
  onKeyDown: KeyboardEventHandler<HTMLInputElement>
}

const DataEditor = ({ onChange, value, onKeyDown }: DataEditorProps) => {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <input
      ref={inputRef}
      className="data-editor"
      value={value}
      onChange={e => onChange(e.target.value)}
      onKeyDown={onKeyDown}
    />
  )
}

export default DataEditor
