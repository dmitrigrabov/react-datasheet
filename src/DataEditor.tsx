import {
  ChangeEvent,
  KeyboardEvent,
  KeyboardEventHandler,
  useEffect,
  useRef,
} from 'react'
import { CellShape, EditorProps } from './types'

type DataEditorProps<T> = {
  value: string
  row: number
  col: number
  cell: CellShape<T>
  onChange: (value: string) => void
  onCommit: (value: string, event?: KeyboardEvent<HTMLInputElement>) => void
  onRevert: () => void
  onKeyDown: KeyboardEventHandler<HTMLInputElement>
}

export const DataEditor = <T,>({
  value,
  onChange,
  onKeyDown,
  ...rest
}: EditorProps<CellShape<T>>) => {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value)
  }

  // console.log('DataEditor value', value)

  return (
    <input
      ref={inputRef}
      className="data-editor"
      value={value}
      onChange={handleChange}
      onKeyDown={onKeyDown}
    />
  )
}
