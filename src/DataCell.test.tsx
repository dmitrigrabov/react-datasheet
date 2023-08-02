import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  render,
  screen,
  fireEvent,
  getByRole,
  waitFor,
} from '@testing-library/react'
import DataCell, { DataCellProps } from './DataCell'
import userEvent from '@testing-library/user-event'
import { CellShape } from 'types'

const getRowContainer = () => {
  const row = document.createElement('tr')
  document.body.appendChild(row)

  return row
}

describe('DataCell', () => {
  it('renders without crashing', () => {
    const row = getRowContainer()

    const user = userEvent.setup()

    const onMouseDown = vi.fn()
    const onMouseOver = vi.fn()
    const onDoubleClick = vi.fn()
    const onContextMenu = vi.fn()
    const onChange = vi.fn()
    const onNavigate = vi.fn()
    const onRevert = vi.fn()

    const result = render(
      <DataCell
        row={2}
        col={3}
        cell={{
          rowSpan: 4,
          colSpan: 5,
          value: '5',
          width: '200px',
          className: 'test',
        }}
        editing={false}
        selected={false}
        onMouseDown={onMouseDown}
        onDoubleClick={onDoubleClick}
        onMouseOver={onMouseOver}
        onContextMenu={onContextMenu}
        onChange={onChange}
        onNavigate={onNavigate}
        onRevert={onRevert}
        valueRenderer={cell => cell.value}
      />,
      { container: row },
    )

    const { container } = result

    expect(container).toMatchInlineSnapshot(`
      <tr>
        <td
          class="test cell"
          colspan="5"
          rowspan="4"
          style="width: 200px;"
        >
          <span
            class="value-viewer"
          >
            5
          </span>
        </td>
      </tr>
    `)

    const cell = screen.getByRole('cell')

    fireEvent.mouseDown(cell)
    expect(onMouseDown).toHaveBeenCalledWith(
      2,
      3,
      expect.objectContaining({ type: 'mousedown' }),
    )

    fireEvent.doubleClick(cell)
    expect(onDoubleClick).toHaveBeenCalledWith(2, 3)

    fireEvent.mouseOver(cell)
    expect(onMouseOver).toHaveBeenCalledWith(2, 3)

    fireEvent.contextMenu(cell)
    expect(onContextMenu).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'contextmenu' }),
      2,
      3,
    )
  })

  it('should properly all update functions and render reading mode to editing mode ', () => {
    const row = getRowContainer()
    const props = {
      editing: false,
      selected: false,
      cell: {
        value: '5',
        data: 5,
      },
      row: 1,
      col: 1,
      onMouseDown: () => {},
      onMouseOver: () => {},
      onDoubleClick: () => {},
      onContextMenu: () => {},
      onChange: () => {},
      onNavigate: () => {},
      onRevert: () => {},
      valueRenderer: <T,>(cell: CellShape<T>) => cell.value,
    }
    const result = render(<DataCell {...props} />, { container: row })

    const { container } = result

    expect(container).toMatchInlineSnapshot(`
      <tr>
        <td
          class="cell"
        >
          <span
            class="value-viewer"
          >
            5
          </span>
        </td>
      </tr>
    `)

    result.rerender(<DataCell {...props} editing={true} selected={true} />)

    expect(container).toMatchInlineSnapshot(`
      <tr>
        <td
          class="cell selected editing"
        >
          <input
            class="data-editor"
            value="5"
          />
        </td>
      </tr>
    `)
  })

  it('should properly render a flash when value changes', () => {
    const row = getRowContainer()
    const props = {
      editing: false,
      selected: false,
      cell: {
        value: '5',
        data: 5,
      },
      row: 1,
      col: 1,
      onMouseDown: () => {},
      onMouseOver: () => {},
      onDoubleClick: () => {},
      onContextMenu: () => {},
      onChange: () => {},
      onNavigate: () => {},
      onRevert: () => {},
      valueRenderer: <T,>(cell: CellShape<T>) => cell.value,
    }
    const result = render(<DataCell {...props} />, { container: row })

    const { container } = result

    expect(container).toMatchInlineSnapshot(`
      <tr>
        <td
          class="cell"
        >
          <span
            class="value-viewer"
          >
            5
          </span>
        </td>
      </tr>
    `)

    result.rerender(<DataCell {...props} cell={{ value: '6', data: 6 }} />)

    expect(container).toMatchInlineSnapshot(`
      <tr>
        <td
          class="cell updated"
        >
          <span
            class="value-viewer"
          >
            6
          </span>
        </td>
      </tr>
    `)
  })

  describe('editing', () => {
    const getInitialProps = () => ({
      reverting: false,
      selected: false,
      cell: {
        value: '2',
        data: '5',
      },
      row: 1,
      col: 2,
      onChange: vi.fn(),
      onRevert: () => {},
      onMouseDown: () => {},
      onDoubleClick: () => {},
      onMouseOver: () => {},
      onContextMenu: () => {},
      onNavigate: () => {},
      valueRenderer: <T,>(cell: CellShape<T>) => cell.value,
      dataRenderer: <T,>(cell: CellShape<T>) => cell.data,
    })

    it('should not call onChange if value is the same', async () => {
      const props = getInitialProps()
      const result = render(<DataCell {...props} />, {
        container: getRowContainer(),
      })

      result.rerender(<DataCell {...props} editing={true} selected={true} />)

      expect(screen.getByRole<HTMLInputElement>('textbox').value).toBe('5')

      fireEvent.change(screen.getByRole<HTMLInputElement>('textbox'), {
        target: { value: '5' },
      })

      result.rerender(<DataCell {...props} editing={false} selected={true} />)
      expect(props.onChange).not.toHaveBeenCalled()
    })

    it('should properly call onChange', () => {
      const props = getInitialProps()
      const result = render(<DataCell {...props} />, {
        container: getRowContainer(),
      })

      result.rerender(<DataCell {...props} editing={true} selected={true} />)
      fireEvent.change(screen.getByRole<HTMLInputElement>('textbox'), {
        target: { value: '6' },
      })

      result.rerender(<DataCell {...props} editing={false} selected={true} />)
      expect(props.onChange).toHaveBeenCalledWith(1, 2, '6')
    })

    it('input value should be cleared if we go into editing with clear call', () => {
      const props = getInitialProps()
      const result = render(<DataCell {...props} />, {
        container: getRowContainer(),
      })

      result.rerender(
        <DataCell {...props} editing={true} selected={true} clearing={true} />,
      )
      expect(screen.getByRole<HTMLInputElement>('textbox').value).toBe('')
    })

    it('input value should be set to value if data is null', () => {
      const props = getInitialProps()
      const result = render(<DataCell {...props} />, {
        container: getRowContainer(),
      })

      result.rerender(<DataCell {...props} cell={{ data: null, value: '2' }} />)

      result.rerender(
        <DataCell
          {...props}
          cell={{ data: null, value: '2' }}
          editing={true}
          selected={true}
          editValue="2"
        />,
      )

      expect(screen.getByRole<HTMLInputElement>('textbox').value).toBe('2')

      fireEvent.change(screen.getByRole<HTMLInputElement>('textbox'), {
        target: { value: '2' },
      })

      result.rerender(
        <DataCell
          {...props}
          cell={{ data: null, value: '2' }}
          editing={false}
          selected={true}
          editValue="2"
        />,
      )

      expect(props.onChange).not.toHaveBeenCalled()
    })
  })

  describe('DataCell with component', () => {
    describe('rendering', () => {
      it('should properly render', () => {
        const onMouseDown = vi.fn()
        const onMouseOver = vi.fn()
        const onDoubleClick = vi.fn()
        const onContextMenu = vi.fn()
        const onNavigate = vi.fn()
        const onChange = vi.fn()
        const onRevert = vi.fn()
        const cell = {
          foo: 'bar',
          readOnly: false,
          forceComponent: true,
          rowSpan: 4,
          colSpan: 5,
          value: '5',
          width: '200px',
          className: 'test',
          component: <div>HELLO</div>,
        }
        const result = render(
          <DataCell
            row={2}
            col={3}
            cell={cell}
            editing={false}
            selected={false}
            onMouseDown={onMouseDown}
            onDoubleClick={onDoubleClick}
            onMouseOver={onMouseOver}
            onContextMenu={onContextMenu}
            onNavigate={onNavigate}
            onChange={onChange}
            onRevert={onRevert}
            valueRenderer={cell => cell.value}
          />,
          { container: getRowContainer() },
        )

        expect(result.container).toMatchInlineSnapshot(`
          <tr>
            <td
              class="test cell"
              colspan="5"
              rowspan="4"
              style="width: 200px;"
            >
              <div>
                HELLO
              </div>
            </td>
          </tr>
        `)

        result.rerender(
          <DataCell
            row={2}
            col={3}
            cell={{ ...cell, forceComponent: false }}
            editing={false}
            selected={false}
            onMouseDown={onMouseDown}
            onDoubleClick={onDoubleClick}
            onMouseOver={onMouseOver}
            onContextMenu={onContextMenu}
            onNavigate={onNavigate}
            onChange={onChange}
            onRevert={onRevert}
            valueRenderer={cell => cell.value}
          />,
        )

        expect(result.container).toMatchInlineSnapshot(`
          <tr>
            <td
              class="test cell"
              colspan="5"
              rowspan="4"
              style="width: 200px;"
            >
              <span
                class="value-viewer"
              >
                5
              </span>
            </td>
          </tr>
        `)

        result.rerender(
          <DataCell
            row={2}
            col={3}
            cell={{ ...cell, forceComponent: false, value: '7' }}
            editing={false}
            selected={false}
            onMouseDown={onMouseDown}
            onDoubleClick={onDoubleClick}
            onMouseOver={onMouseOver}
            onContextMenu={onContextMenu}
            onNavigate={onNavigate}
            onChange={onChange}
            onRevert={onRevert}
            valueRenderer={cell => cell.value}
          />,
        )

        expect(result.container).toMatchInlineSnapshot(`
          <tr>
            <td
              class="test cell updated"
              colspan="5"
              rowspan="4"
              style="width: 200px;"
            >
              <span
                class="value-viewer"
              >
                7
              </span>
            </td>
          </tr>
        `)

        const cellElement = screen.getByRole('cell')

        fireEvent.mouseDown(cellElement)
        expect(onMouseDown).toHaveBeenCalledWith(
          2,
          3,
          expect.objectContaining({ type: 'mousedown' }),
        )

        fireEvent.doubleClick(cellElement)
        expect(onDoubleClick).toHaveBeenCalledWith(2, 3)

        fireEvent.mouseOver(cellElement)
        expect(onMouseOver).toHaveBeenCalledWith(2, 3)

        fireEvent.contextMenu(cellElement)
        expect(onContextMenu).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'contextmenu' }),
          2,
          3,
        )
      })
    })

    describe('rendering', () => {
      beforeEach(() => {
        vi.useFakeTimers()
      })

      afterEach(() => {
        vi.restoreAllMocks()
      })

      it('should properly render a change (flashing)', () => {
        const cell = {
          readOnly: false,
          forceComponent: true,
          value: '5',
          className: 'test',
          component: <div>HELLO</div>,
        }

        const result = render(
          <DataCell
            row={2}
            col={3}
            cell={cell}
            editing={false}
            selected={false}
            onMouseDown={() => {}}
            onDoubleClick={() => {}}
            onMouseOver={() => {}}
            onContextMenu={() => {}}
            onNavigate={() => {}}
            onChange={() => {}}
            onRevert={() => {}}
            valueRenderer={cell => cell.value}
          />,
          { container: getRowContainer() },
        )

        result.rerender(
          <DataCell
            row={2}
            col={3}
            cell={{ ...cell, value: '7' }}
            editing={false}
            selected={false}
            onMouseDown={() => {}}
            onDoubleClick={() => {}}
            onMouseOver={() => {}}
            onContextMenu={() => {}}
            onNavigate={() => {}}
            onChange={() => {}}
            onRevert={() => {}}
            valueRenderer={cell => cell.value}
          />,
        )

        expect(result.container).toMatchInlineSnapshot(`
          <tr>
            <td
              class="test cell updated"
            >
              <div>
                HELLO
              </div>
            </td>
          </tr>
        `)

        vi.runAllTimers()

        expect(result.container).toMatchInlineSnapshot(`
          <tr>
            <td
              class="test cell updated"
            >
              <div>
                HELLO
              </div>
            </td>
          </tr>
        `)
      })
    })
  })
})
