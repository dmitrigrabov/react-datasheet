import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  render,
  screen,
  fireEvent,
  getByRole,
  waitFor,
  within,
} from '@testing-library/react'
import DataCell, { DataCellProps } from './DataCell'
import { CellShape } from 'types'
import { DataSheet } from './DataSheet'

const getRowContainer = () => {
  const row = document.createElement('tr')
  document.body.appendChild(row)

  return row
}

describe('DataSheet component', () => {
  const getData = () => [
    [
      {
        className: 'test1',
        data: 4,
        overflow: 'clip' as const,
      },
      {
        className: 'test2',
        data: 2,
        key: 'custom_key',
      },
    ],
    [
      {
        className: 'test3',
        data: 0,
        width: '25%',
      },
      {
        className: 'test4',
        data: 5,
        width: 100,
      },
    ],
  ]

  describe('rendering with varying props', () => {
    it('renders the proper elements', () => {
      const data = getData()

      render(
        <DataSheet
          keyFn={i => 'custom_key_' + i}
          className={'test'}
          overflow="nowrap"
          data={data}
          valueRenderer={cell =>
            cell.data !== undefined ? `${cell.data}` : ''
          }
          onChange={
            (cell, i, j, value) =>
              (data[i][j].data = (value as unknown) as number) // @TODO: fix this
          }
        />,
      )

      expect(screen.getByRole('table')).toBeInTheDocument()
      const classes = [...screen.getByRole('table').classList.values()]
      expect(classes).toEqual(['data-grid', 'test', 'nowrap'])

      const cells = screen.getAllByRole('cell')

      expect(cells.length).toEqual(4)
      expect(cells.at(0)).toContainHTML(
        '<td class="test1 cell clip"><span class="value-viewer">4</span></td>',
      )
      expect(cells.at(1)).toContainHTML(
        '<td class="test2 cell"><span class="value-viewer">2</span></td>',
      )
      expect(cells.at(2)).toContainHTML(
        '<td class="test3 cell" style="width: 25%;"><span class="value-viewer">0</span></td>',
      )
      expect(cells.at(3)).toContainHTML(
        '<td class="test4 cell"><span class="value-viewer">5</span></td>',
      )
    })

    // Removed 'renders the proper keys' since keys are not accessible
    // Removed 'sets the proper classes for the cells' since check is included above

    it('renders the data in the input properly if dataRenderer is set', () => {
      const data = getData()

      render(
        <DataSheet
          data={data}
          dataRenderer={cell => '=+' + cell.data}
          valueRenderer={cell =>
            cell.data !== undefined ? `${cell.data}` : ''
          }
          onChange={
            (cell, i, j, value) =>
              (data[i][j].data = (value as unknown) as number) // @TODO: fix this
          }
        />,
      )

      const cell = screen.getAllByRole('cell').at(0)

      fireEvent.doubleClick(cell as HTMLElement)

      const input = within(cell as HTMLElement).getByRole('textbox')

      expect(input).toHaveValue('=+4')
    })

    it('renders proper elements by column', () => {
      const data = getData()

      const withDates = data.map((row, rowIndex) => [
        { data: new Date('2017-0' + (rowIndex + 1) + '-01') },
        ...row,
      ])

      render(
        <DataSheet<Date | number>
          data={withDates}
          valueRenderer={(cell, i, j) =>
            j === 0 && cell.data instanceof Date
              ? cell.data.toUTCString()
              : cell.data
          }
          dataRenderer={(cell, i, j) =>
            j === 0 && cell.data instanceof Date
              ? cell.data.toISOString()
              : cell.data
          }
          onChange={(cell, i, j, value) =>
            (data[i][j].data = (value as unknown) as number)
          }
        />,
      )

      const cells = screen.getAllByRole('cell')

      expect(cells.length).toEqual(6)
      expect(cells.at(0)).toHaveTextContent('Sun, 01 Jan 2017 00:00:00 GMT')
      expect(cells.at(1)).toHaveTextContent('4')
      expect(cells.at(2)).toHaveTextContent('2')
      expect(cells.at(3)).toHaveTextContent('Wed, 01 Feb 2017 00:00:00 GMT')
      expect(cells.at(4)).toHaveTextContent('0')
      expect(cells.at(5)).toHaveTextContent('5')
    })

    it('renders data in the input properly if dataRenderer is set by column', () => {
      const data = getData()

      const withDates = data.map((row, index) => [
        { data: new Date('2017-0' + (index + 1) + '-01') },
        ...row,
      ])

      render(
        <DataSheet<Date | number>
          data={withDates}
          data-thing="test"
          valueRenderer={(cell, i, j) =>
            j === 0 && cell.data instanceof Date
              ? cell.data.toUTCString()
              : cell.data
          }
          dataRenderer={(cell, i, j) =>
            j === 0 && cell.data instanceof Date
              ? cell.data.toISOString()
              : cell.data
          }
          onChange={(cell, i, j, value) =>
            (data[i][j].data = (value as unknown) as number)
          }
        />,
      )

      const cell = screen.getAllByRole('cell').at(0)

      fireEvent.doubleClick(cell as HTMLElement)

      const input = within(cell as HTMLElement).getByRole('textbox')

      expect(input).toHaveValue('2017-01-01T00:00:00.000Z')
    })

    it('renders the attributes to the cell if the attributesRenderer is set', () => {
      const data = getData()

      render(
        <DataSheet
          data={data}
          valueRenderer={cell => cell.data}
          dataRenderer={cell => cell.data}
          attributesRenderer={(cell, i, j) => {
            if (i === 0 && j === 0) {
              return { 'data-hint': 'Not valid' }
            } else if (i === 1 && j === 1) {
              return { 'data-hint': 'Valid' }
            }

            return null
          }}
          onChange={(cell, i, j, value) =>
            (data[i][j].data = (value as unknown) as number)
          }
        />,
      )

      const cells = screen.getAllByRole('cell')

      const firstCell = cells.at(0)
      expect(firstCell).toHaveAttribute('data-hint', 'Not valid')

      const lastCell = cells.at(cells.length - 1)
      expect(lastCell).toHaveAttribute('data-hint', 'Valid')
    })

    it('renders a component properly', () => {
      const data = getData()

      render(
        <DataSheet
          data={[
            [
              {
                component: (
                  <div className="custom-component">COMPONENT RENDERED</div>
                ),
              },
            ],
          ]}
          valueRenderer={() => 'VALUE RENDERED'}
          onChange={(cell, i, j, value) =>
            (data[i][j].data = (value as unknown) as number)
          }
        />,
      )
      const cell = screen.getByRole('cell')

      expect(cell).toHaveTextContent('VALUE RENDERED')

      fireEvent.doubleClick(cell)

      expect(cell).toHaveTextContent('COMPONENT RENDERED')
    })

    it('forces a component rendering', () => {
      const data = getData()

      render(
        <DataSheet
          data={[
            [
              {
                forceComponent: true,
                component: (
                  <div className={'custom-component'}>COMPONENT RENDERED</div>
                ),
              },
            ],
          ]}
          valueRenderer={() => 'VALUE RENDERED'}
          onChange={(cell, i, j, value) =>
            (data[i][j].data = (value as unknown) as number)
          }
        />,
      )

      const cell = screen.getByRole('cell')

      expect(cell).toHaveTextContent('COMPONENT RENDERED')
      fireEvent.mouseDown(cell)
      fireEvent.mouseOver(cell)
      fireEvent.doubleClick(cell)
      expect(cell).toHaveTextContent('COMPONENT RENDERED')
    })

    // it('handles  a custom editable component and exits on ENTER_KEY', done => {
    //   customWrapper = mount(
    //     <DataSheet
    //       data={[
    //         [
    //           { value: 1 },
    //           { component: <input className={'custom-component'} /> },
    //           { value: 2 },
    //         ],
    //       ]}
    //       valueRenderer={cell => 'VALUE RENDERED'}
    //       onChange={(cell, i, j, value) => (data[i][j].data = value)}
    //     />,
    //   )
    //   const cell = customWrapper.find('td').at(1)
    //   cell.simulate('mouseDown')
    //   cell.simulate('doubleClick')

    //   expect(customWrapper.state('start')).toEqual({ i: 0, j: 1 })
    //   cell.find('.custom-component').first().simulate('doubleClick')
    //   triggerEvent(customWrapper.find('.data-grid-container').node, TAB_KEY)
    //   setTimeout(() => {
    //     expect(customWrapper.state('start')).toEqual({ i: 0, j: 2 })
    //     done()
    //   }, 50)
    // })

    // it('handles  a custom editable component and exits', done => {
    //   customWrapper = mount(
    //     <DataSheet
    //       data={[
    //         [
    //           { value: 1 },
    //           { component: <input className={'custom-component'} /> },
    //           { value: 2 },
    //         ],
    //       ]}
    //       valueRenderer={cell => 'VALUE RENDERED'}
    //       onChange={(cell, i, j, value) => (data[i][j].data = value)}
    //     />,
    //   )
    //   const cell = customWrapper.find('td').at(1)

    //   const selectCell = () => {
    //     cell.simulate('mouseDown')
    //     cell.simulate('doubleClick')
    //   }

    //   const checkEnterKey = callback => {
    //     selectCell()
    //     expect(customWrapper.state('start')).toEqual({ i: 0, j: 1 })
    //     cell.find('.custom-component').first().simulate('doubleClick')
    //     triggerEvent(customWrapper.find('.data-grid-container').node, ENTER_KEY)
    //     setTimeout(() => {
    //       expect(customWrapper.state('start')).toEqual({ i: 0, j: 1 })
    //       callback()
    //     }, 50)
    //   }
    //   const checkTabKey = callback => {
    //     selectCell()
    //     expect(customWrapper.state('start')).toEqual({ i: 0, j: 1 })
    //     cell.find('.custom-component').first().simulate('doubleClick')
    //     triggerEvent(customWrapper.find('.data-grid-container').node, TAB_KEY)
    //     setTimeout(() => {
    //       expect(customWrapper.state('start')).toEqual({ i: 0, j: 2 })
    //       callback()
    //     }, 50)
    //   }
    //   checkEnterKey(() => checkTabKey(done))
    // })

    // it('renders a cell with readOnly field properly', () => {
    //   customWrapper = mount(
    //     <DataSheet
    //       data={[
    //         [
    //           { data: 12, readOnly: true },
    //           { data: 24, readOnly: false },
    //         ],
    //       ]}
    //       valueRenderer={cell => cell.data}
    //       dataRenderer={cell => '=+' + cell.data}
    //       onChange={(cell, i, j, value) => (data[i][j].data = value)}
    //     />,
    //   )
    //   expect(customWrapper.find('td.cell').at(0).text()).toEqual(12)
    //   expect(customWrapper.find('td.cell').at(1).text()).toEqual(24)
    //   customWrapper.find('td').at(0).simulate('mouseDown')
    //   customWrapper.find('td').at(0).simulate('doubleClick')
    //   customWrapper.find('td').at(1).simulate('mouseDown')
    //   customWrapper.find('td').at(1).simulate('doubleClick')

    //   expect(customWrapper.find('td.cell').at(0).text()).toEqual(12)
    //   expect(
    //     customWrapper.find('td.cell').at(1).find('input').props().value,
    //   ).toEqual('=+24')

    //   expect(customWrapper.find('td.cell').at(0).html()).toEqual(
    //     '<td class="cell read-only"><span class="value-viewer">12</span></td>',
    //   )
    //   expect(customWrapper.find('td.cell').at(1).html()).toEqual(
    //     '<td class="cell selected editing"><input class="data-editor" value="=+24"></td>',
    //   )
    // })

    // it('renders a cell with disabled events', () => {
    //   customWrapper = mount(
    //     <DataSheet
    //       data={[
    //         [
    //           { data: 12, disableEvents: true },
    //           { data: 24, disableEvents: true },
    //         ],
    //       ]}
    //       valueRenderer={cell => cell.data}
    //       onChange={(cell, i, j, value) => (data[i][j].data = value)}
    //     />,
    //   )
    //   customWrapper.find('td').at(0).simulate('mouseDown')
    //   customWrapper.find('td').at(0).simulate('doubleClick')
    //   expect(customWrapper.state()).toEqual({
    //     start: {},
    //     end: {},
    //     selecting: false,
    //     editing: {},
    //     forceEdit: false,
    //     clear: {},
    //   })
    // })
  })

  // describe('selection', () => {
  //   it('selects a single field properly', () => {
  //     expect(wrapper.find('td.cell.selected').length).toEqual(0)
  //     wrapper.find('td').at(1).simulate('mouseDown')
  //     wrapper.find('td').at(1).simulate('mouseUp')
  //     expect(wrapper.find('td.cell.selected').length).toEqual(1)
  //     expect(wrapper.find('td.cell.selected span').nodes[0].innerHTML).toEqual(
  //       '2',
  //     )
  //   })

  //   it('selects multiple field properly 2x2 (hold left click)', () => {
  //     expect(wrapper.find('td.cell.selected').length).toEqual(0)
  //     wrapper.find('td').at(0).simulate('mouseDown')
  //     wrapper.find('td').at(3).simulate('mouseOver')
  //     expect(wrapper.find('td.cell.selected').length).toEqual(4)
  //     expect(
  //       wrapper.find('td.cell.selected span').nodes.map(n => n.innerHTML),
  //     ).toEqual(['4', '2', '0', '5'])

  //     expect(wrapper.state('selecting')).toEqual(true)
  //     expect(wrapper.state('editing')).toEqual({})
  //     expect(wrapper.state('start')).toEqual({
  //       i: 0,
  //       j: 0,
  //     })
  //     expect(wrapper.state('end')).toEqual({
  //       i: 1,
  //       j: 1,
  //     })
  //   })

  //   it('selects multiple field properly 2x2 and stay selected after releasing mouse button', () => {
  //     let mouseUpEvt = document.createEvent('HTMLEvents')
  //     mouseUpEvt.initEvent('mouseup', false, true)

  //     expect(wrapper.find('.selected').length).toEqual(0)
  //     expect(wrapper.find('td.cell').length).toEqual(4)
  //     wrapper.find('td').at(0).simulate('mouseDown')
  //     wrapper.find('td').at(3).simulate('mouseOver')
  //     expect(wrapper.state('start')).toEqual({ i: 0, j: 0 })
  //     expect(wrapper.state('end')).toEqual({ i: 1, j: 1 })
  //     expect(wrapper.state('selecting')).toEqual(true)
  //     document.dispatchEvent(mouseUpEvt)
  //     expect(wrapper.state('selecting')).toEqual(false)
  //   })

  //   it('calls onSelect prop when a new element is selected', done => {
  //     customWrapper = mount(
  //       <DataSheet
  //         data={data}
  //         onSelect={({ start, end }) => {
  //           try {
  //             expect(start).toEqual({ i: 0, j: 0 })
  //             expect(end).toEqual({ i: 0, j: 0 })
  //             done()
  //           } catch (err) {
  //             done(err)
  //           }
  //         }}
  //         valueRenderer={cell => cell.data}
  //         onChange={(cell, i, j, value) => (custData[i][j].data = value)}
  //       />,
  //     )
  //     customWrapper.find('td').at(0).simulate('mouseDown')
  //     expect(customWrapper.state('end')).toEqual({ i: 0, j: 0 })
  //   })

  //   it('calls onSelect prop when a new element is selected and the selection is controlled', done => {
  //     customWrapper = mount(
  //       <DataSheet
  //         data={data}
  //         selected={selected}
  //         onSelect={({ start, end }) => {
  //           try {
  //             selected = { start, end }
  //             expect(start).toEqual({ i: 0, j: 0 })
  //             expect(end).toEqual({ i: 0, j: 0 })
  //             done()
  //           } catch (err) {
  //             done(err)
  //           }
  //         }}
  //         valueRenderer={cell => cell.data}
  //         onChange={(cell, i, j, value) => (custData[i][j].data = value)}
  //       />,
  //     )
  //     customWrapper.find('td').at(0).simulate('mouseDown')
  //     expect(selected.end).toEqual({ i: 0, j: 0 })
  //   })

  //   it('selects a single cell if passed in the "selected" prop', () => {
  //     customWrapper = mount(
  //       <DataSheet
  //         data={data}
  //         selected={{ start: { i: 0, j: 0 }, end: { i: 0, j: 0 } }}
  //         valueRenderer={cell => cell.data}
  //       />,
  //     )
  //     expect(customWrapper.find('td.cell.selected').length).toEqual(1)
  //   })

  //   it('selects multiple cells if passed in the "selected" prop', () => {
  //     customWrapper = mount(
  //       <DataSheet
  //         data={data}
  //         selected={{ start: { i: 0, j: 0 }, end: { i: 1, j: 1 } }}
  //         valueRenderer={cell => cell.data}
  //       />,
  //     )
  //     expect(customWrapper.find('td.cell.selected').length).toEqual(4)
  //   })

  //   it('does not select cells if passed "null" in the "selected" prop', () => {
  //     customWrapper = mount(
  //       <DataSheet
  //         data={data}
  //         selected={null}
  //         valueRenderer={cell => cell.data}
  //       />,
  //     )
  //     expect(customWrapper.find('td.cell.selected').length).toEqual(0)
  //   })

  //   it('does not select cells if missing "start" in the "selected" prop', () => {
  //     customWrapper = mount(
  //       <DataSheet
  //         data={data}
  //         selected={{ end: { i: 1, j: 1 } }}
  //         valueRenderer={cell => cell.data}
  //       />,
  //     )
  //     expect(customWrapper.find('td.cell.selected').length).toEqual(0)
  //   })

  //   it('does not select cells if missing "end" in the "selected" prop', () => {
  //     customWrapper = mount(
  //       <DataSheet
  //         data={data}
  //         selected={{ start: { i: 0, j: 0 } }}
  //         valueRenderer={cell => cell.data}
  //       />,
  //     )
  //     expect(customWrapper.find('td.cell.selected').length).toEqual(0)
  //   })

  //   it('selects multiple cells when click and drag over other cells and selection is controlled', () => {
  //     customWrapper = mount(
  //       <DataSheet
  //         data={data}
  //         selected={null}
  //         onSelect={selected => customWrapper.setProps({ selected })}
  //         valueRenderer={cell => cell.data}
  //       />,
  //     )
  //     // validate inital state
  //     expect(customWrapper.find('td.cell.selected').length).toEqual(0)
  //     // perform mouse events
  //     let mouseUpEvt = document.createEvent('HTMLEvents')
  //     mouseUpEvt.initEvent('mouseup', false, true)
  //     customWrapper.find('td').at(0).simulate('mouseDown')
  //     customWrapper.find('td').at(3).simulate('mouseOver')
  //     document.dispatchEvent(mouseUpEvt)
  //     // validate
  //     expect(customWrapper.props().selected.start).toEqual({ i: 0, j: 0 })
  //     expect(customWrapper.props().selected.end).toEqual({ i: 1, j: 1 })
  //     expect(customWrapper.find('td.cell.selected').length).toEqual(4)
  //   })
  // })

  // describe('keyboard movement', () => {
  //   it('moves right with arrow keys', () => {
  //     wrapper.find('td').at(0).simulate('mouseDown')
  //     expect(wrapper.state('start')).toEqual({ i: 0, j: 0 })
  //     triggerKeyDownEvent(wrapper, RIGHT_KEY)
  //     expect(wrapper.state('start')).toEqual({ i: 0, j: 1 })
  //   })
  //   it('moves left with arrow keys', () => {
  //     wrapper.find('td').at(1).simulate('mouseDown')
  //     expect(wrapper.state('start')).toEqual({ i: 0, j: 1 })
  //     triggerKeyDownEvent(wrapper, LEFT_KEY)
  //     expect(wrapper.state('start')).toEqual({ i: 0, j: 0 })
  //   })
  //   it('moves up with arrow keys', () => {
  //     wrapper.find('td').at(3).simulate('mouseDown')
  //     expect(wrapper.state('start')).toEqual({ i: 1, j: 1 })
  //     triggerKeyDownEvent(wrapper, UP_KEY)
  //     expect(wrapper.state('start')).toEqual({ i: 0, j: 1 })
  //   })
  //   it('moves down with arrow keys', () => {
  //     wrapper.find('td').at(0).simulate('mouseDown')
  //     expect(wrapper.state('start')).toEqual({ i: 0, j: 0 })
  //     triggerKeyDownEvent(wrapper, DOWN_KEY)
  //     expect(wrapper.state('start')).toEqual({ i: 1, j: 0 })
  //   })
  //   it('moves to next row if there is no right cell', () => {
  //     wrapper.find('td').at(1).simulate('mouseDown')
  //     expect(wrapper.state('start')).toEqual({ i: 0, j: 1 })
  //     triggerKeyDownEvent(wrapper, TAB_KEY)
  //     expect(wrapper.state('start')).toEqual({ i: 1, j: 0 })
  //   })

  //   it('tab and shift tab keys', () => {
  //     wrapper.find('td').at(0).simulate('mouseDown')
  //     expect(wrapper.state('start')).toEqual({ i: 0, j: 0 })
  //     triggerKeyDownEvent(wrapper.find('td').at(0), TAB_KEY)
  //     expect(wrapper.state('start')).toEqual({ i: 0, j: 1 })
  //     triggerKeyDownEvent(wrapper.find('td').at(0), TAB_KEY, {
  //       shiftKey: true,
  //     })
  //     expect(wrapper.state('start')).toEqual({ i: 0, j: 0 })
  //   })
  // })

  // describe('editing', () => {
  //   let cells = null
  //   beforeEach(() => {
  //     cells = wrapper.find('td')
  //   })

  //   it('starts editing when double clicked', () => {
  //     expect(wrapper.find('td.cell.selected').length).toEqual(0)
  //     cells.at(3).simulate('doubleClick')
  //     expect(wrapper.state('editing')).toEqual({
  //       i: 1,
  //       j: 1,
  //     })
  //     expect(wrapper.state('forceEdit')).toEqual(true)

  //     cells.at(3).simulate('mousedown') // mousedown should not affect edit mode
  //     cells.at(2).simulate('mouseover') // mouseover should not affect edit mode
  //     expect(wrapper.state('editing')).toEqual({
  //       i: 1,
  //       j: 1,
  //     })
  //   })

  //   it('starts editing when enter key pressed', () => {
  //     cells.at(3).simulate('mousedown')
  //     triggerKeyDownEvent(cells.at(3), ENTER_KEY)
  //     expect(wrapper.state('editing')).toEqual({
  //       i: 1,
  //       j: 1,
  //     })
  //     expect(wrapper.state('forceEdit')).toEqual(true)

  //     cells.at(3).simulate('mousedown') // mousedown should not affect edit mode
  //     cells.at(2).simulate('mouseover') // mouseover should not affect edit mode
  //     expect(wrapper.state('editing')).toEqual({
  //       i: 1,
  //       j: 1,
  //     })
  //     expect(wrapper.state('clear')).toEqual({})
  //   })

  //   it('starts editing certain keys are pressed', () => {
  //     // [0  , 9 ,a , z , 0 , 9  , +  , = , decim]
  //     ;[48, 57, 65, 90, 96, 105, 107, 187, 189].map(charCode => {
  //       cells.at(0).simulate('mousedown')
  //       triggerKeyDownEvent(cells.at(0), charCode)
  //       expect(wrapper.state('editing')).toEqual({ i: 0, j: 0 })
  //       cells.at(1).simulate('mousedown')
  //       expect(wrapper.state('editing')).toEqual({})
  //     })
  //   })

  //   it('does not start editing if cell is readOnly', () => {
  //     wrapper.setProps({
  //       data: [
  //         [
  //           { data: 1, readOnly: true },
  //           { data: 2, readOnly: true },
  //         ],
  //       ],
  //     })
  //     // [0  , 9 ,a , z , 0 , 9  , +  , = , decim]
  //     ;[48, 57, 65, 90, 96, 105, 107, 187, 189].map(charCode => {
  //       cells.at(0).simulate('mousedown')
  //       triggerKeyDownEvent(cells.at(0), charCode)
  //       expect(wrapper.state('editing')).toEqual({})
  //       cells.at(1).simulate('mousedown')
  //       expect(wrapper.state('editing')).toEqual({})
  //     })
  //   })

  //   it('goes out of edit mode when another cell is clicked', () => {
  //     cells.at(0).simulate('mouseDown')
  //     triggerKeyDownEvent(cells.at(0), '1'.charCodeAt(0))
  //     wrapper.find('td.cell.selected input').node.value = 213
  //     wrapper.find('td.cell.selected input').simulate('change')
  //     cells.at(1).simulate('mouseDown')
  //     expect(data[0][0].data).toEqual(213)
  //     expect(wrapper.state('editing')).toEqual({})
  //   })

  //   it('goes out of edit mode when ENTER is clicked', () => {
  //     cells.at(0).simulate('mouseDown')
  //     triggerKeyDownEvent(cells.at(0), '1'.charCodeAt(0))
  //     wrapper.find('td.cell.selected input').node.value = 213
  //     wrapper.find('td.cell.selected input').simulate('change')
  //     wrapper
  //       .find('td.cell.selected input')
  //       .simulate('keydown', { keyCode: ENTER_KEY })
  //     expect(data[0][0].data).toEqual(213)
  //     expect(wrapper.state('editing')).toEqual({})
  //   })

  //   it('goes out of edit mode and reverts to original value when ESCAPE is pressed', () => {
  //     cells.at(0).simulate('mouseDown')
  //     triggerKeyDownEvent(cells.at(0), '1'.charCodeAt(0))
  //     wrapper.find('td.cell.selected input').node.value = 213
  //     wrapper.find('td.cell.selected input').simulate('change')
  //     triggerKeyDownEvent(wrapper.find('td.cell.editing input'), ESCAPE_KEY)
  //     expect(data[0][0].data).toEqual(4)
  //     expect(wrapper.state('editing')).toEqual({})
  //     expect(wrapper.find('td.cell.selected').first().hasClass('editing')).toBe(
  //       false,
  //     )
  //   })

  //   it('goes to the next row when editing and enter key pressed when edit started via double click', () => {
  //     cells.at(1).simulate('mousedown')
  //     triggerKeyDownEvent(cells.at(1), '1'.charCodeAt(0))
  //     expect(wrapper.state('editing')).toEqual({
  //       i: 0,
  //       j: 1,
  //     })

  //     const newPosition = { i: 1, j: 1 }
  //     triggerKeyDownEvent(wrapper.find('td.cell.editing input'), ENTER_KEY)
  //     expect(wrapper.state('editing')).toEqual({})
  //     expect(wrapper.state('start')).toEqual(newPosition)
  //     expect(wrapper.state('end')).toEqual(newPosition)
  //   })

  //   it('goes to the next row when editing and enter key pressed', () => {
  //     cells.at(1).simulate('mousedown')
  //     triggerKeyDownEvent(wrapper, ENTER_KEY)
  //     expect(wrapper.state('editing')).toEqual({
  //       i: 0,
  //       j: 1,
  //     })

  //     const newPosition = { i: 1, j: 1 }
  //     triggerKeyDownEvent(wrapper.find('td.cell.editing input'), ENTER_KEY)
  //     wrapper.update()
  //     expect(wrapper.state('editing')).toEqual({})
  //     expect(wrapper.state('start')).toEqual(newPosition)
  //     expect(wrapper.state('end')).toEqual(newPosition)
  //   })

  //   it('updates value properly after double clicking', () => {
  //     cells.at(0).simulate('mouseDown')
  //     cells.at(0).simulate('mouseUp')
  //     cells.at(0).simulate('doubleClick')

  //     expect(wrapper.state()).toEqual({
  //       start: { i: 0, j: 0 },
  //       end: { i: 0, j: 0 },
  //       selecting: true,
  //       editing: { i: 0, j: 0 },
  //       forceEdit: true,
  //       clear: {},
  //     })

  //     cells.at(0).find('input').node.value = 213
  //     cells.at(0).find('input').simulate('change')
  //     cells.at(0).find('input').simulate('keydown', { keyCode: RIGHT_KEY })
  //     expect(data[0][0].data).toEqual(4)
  //     cells.at(0).find('input').simulate('keydown', { keyCode: TAB_KEY })
  //     expect(data[0][0].data).toEqual(213)
  //   })

  //   it("moves to the next cell on left/right arrow if editing wasn't started via double click or pressing enter", () => {
  //     cells.at(0).simulate('mouseDown')
  //     cells.at(0).simulate('mouseUp')
  //     triggerKeyDownEvent(wrapper, '1'.charCodeAt(0))
  //     expect(wrapper.state()).toEqual({
  //       start: { i: 0, j: 0 },
  //       end: { i: 0, j: 0 },
  //       selecting: true,
  //       editing: { i: 0, j: 0 },
  //       forceEdit: false,
  //       clear: { i: 0, j: 0 },
  //     })
  //     wrapper.find('td.cell.selected input').node.value = 213
  //     wrapper.find('td.cell.selected input').simulate('change')

  //     expect(data[0][0].data).toEqual(4)
  //     triggerKeyDownEvent(wrapper.find('td.cell.selected input'), RIGHT_KEY)
  //     expect(data[0][0].data).toEqual(213)
  //     expect(wrapper.state()).toEqual({
  //       start: { i: 0, j: 1 }, // RIGHT_KEY movement
  //       end: { i: 0, j: 1 }, // RIGHT_KEY movement
  //       selecting: true,
  //       editing: {},
  //       forceEdit: false,
  //       clear: { i: 0, j: 0 },
  //     })
  //   })

  //   it("doesn't moves to the next cell on left/right arrow if cell is a component", () => {
  //     data[0][0].component = <div>HELLO</div>
  //     wrapper.setProps({ data: data })
  //     expect(wrapper.exists(<div>HELLO</div>)).toEqual(true)
  //     cells.at(0).simulate('mouseDown')
  //     cells.at(0).simulate('mouseUp')
  //     triggerKeyDownEvent(wrapper, '1'.charCodeAt(0))
  //     expect(wrapper.state()).toEqual({
  //       start: { i: 0, j: 0 },
  //       end: { i: 0, j: 0 },
  //       selecting: true,
  //       editing: { i: 0, j: 0 },
  //       forceEdit: false,
  //       clear: { i: 0, j: 0 },
  //     })
  //     cells.at(0).simulate('keyDown', { keyCode: RIGHT_KEY })
  //     expect(wrapper.state()).toEqual({
  //       start: { i: 0, j: 0 }, // RIGHT_KEY movement
  //       end: { i: 0, j: 0 }, // RIGHT_KEY movement
  //       selecting: true,
  //       editing: { i: 0, j: 0 },
  //       forceEdit: false,
  //       clear: { i: 0, j: 0 },
  //     })
  //   })

  //   it('copies the data properly', () => {
  //     let copied = ''
  //     const evt = document.createEvent('HTMLEvents')
  //     evt.initEvent('copy', false, true)
  //     evt.clipboardData = { setData: (type, text) => (copied = text) }

  //     cells.at(0).simulate('mouseDown')
  //     cells.at(3).simulate('mouseOver')
  //     document.dispatchEvent(evt)
  //     expect(copied).toEqual('4\t2\n0\t5')
  //   })

  //   it('copies the data from dataRenderer if it exists', () => {
  //     let copied = ''
  //     const evt = document.createEvent('HTMLEvents')
  //     evt.initEvent('copy', false, true)
  //     evt.clipboardData = { setData: (type, text) => (copied = text) }
  //     customWrapper = mount(
  //       <DataSheet
  //         data={data}
  //         valueRenderer={(cell, i, j) => cell.data}
  //         dataRenderer={(cell, i, j) => `{${i},${j}}${cell.data}`}
  //         onChange={(cell, i, j, value) => (data[i][j].data = value)}
  //       />,
  //     )
  //     customWrapper.find('td').at(0).simulate('mouseDown')
  //     customWrapper.find('td').at(3).simulate('mouseOver')

  //     document.dispatchEvent(evt)
  //     expect(copied).toEqual('{0,0}4\t{0,1}2\n{1,0}0\t{1,1}5')
  //   })

  //   it("copies no data if there isn't anything selected", () => {
  //     let pasted = ''
  //     const evt = document.createEvent('HTMLEvents')
  //     evt.initEvent('copy', false, true)
  //     evt.clipboardData = { setData: (type, text) => (pasted = text) }

  //     expect(wrapper.state('start')).toEqual({})
  //     document.dispatchEvent(evt)
  //     expect(pasted).toEqual('')
  //   })

  //   it('copies data properly, using handleCopy if defined', () => {
  //     let copied = ''
  //     const evt = document.createEvent('HTMLEvents')
  //     evt.initEvent('copy', false, true)
  //     evt.clipboardData = { setData: (type, text) => (copied = text) }
  //     customWrapper = mount(
  //       <DataSheet
  //         data={data}
  //         valueRenderer={(cell, i, j) => cell.data}
  //         dataRenderer={(cell, i, j) => `{${i},${j}}${cell.data}`}
  //         onChange={(cell, i, j, value) => (data[i][j].data = value)}
  //         handleCopy={({
  //           event,
  //           dataRenderer,
  //           valueRenderer,
  //           data,
  //           start,
  //           end,
  //           range,
  //         }) => {
  //           const text = range(start.i, end.i)
  //             .map(i =>
  //               range(start.j, end.j)
  //                 .map(j => {
  //                   const cell = data[i][j]
  //                   const value = dataRenderer ? dataRenderer(cell, i, j) : null
  //                   if (
  //                     value === '' ||
  //                     value === null ||
  //                     typeof value === 'undefined'
  //                   ) {
  //                     const val = valueRenderer(cell, i, j)
  //                     return JSON.stringify(val)
  //                   }
  //                   return JSON.stringify(value)
  //                 })
  //                 .join('\t'),
  //             )
  //             .join('\n')
  //           if (window.clipboardData && window.clipboardData.setData) {
  //             window.clipboardData.setData('Text', text)
  //           } else {
  //             event.clipboardData.setData('text/plain', text)
  //           }
  //         }}
  //       />,
  //     )
  //     customWrapper.find('td').at(0).simulate('mouseDown')
  //     customWrapper.find('td').at(3).simulate('mouseOver')

  //     document.dispatchEvent(evt)
  //     expect(copied).toEqual('"{0,0}4"\t"{0,1}2"\n"{1,0}0"\t"{1,1}5"')
  //   })

  //   it('does not paste data if no cell is selected', () => {
  //     const evt = document.createEvent('HTMLEvents')
  //     evt.initEvent('paste', false, true)
  //     evt.clipboardData = { getData: type => '99\t100\n1001\t1002' }
  //     document.dispatchEvent(evt)
  //     expect(data[0].map(d => d.data)).toEqual([4, 2])
  //     expect(data[1].map(d => d.data)).toEqual([0, 5])
  //   })
  //   it('pastes data properly', () => {
  //     cells.at(0).simulate('mouseDown')
  //     expect(wrapper.state('end')).toEqual({ i: 0, j: 0 })

  //     const evt = document.createEvent('HTMLEvents')
  //     evt.initEvent('paste', false, true)
  //     evt.clipboardData = { getData: type => '99\t100\n1001\t1002' }
  //     document.dispatchEvent(evt)

  //     expect(data[0].map(d => d.data)).toEqual(['99', '100'])
  //     expect(data[1].map(d => d.data)).toEqual(['1001', '1002'])
  //     expect(wrapper.state('end')).toEqual({ i: 1, j: 1 })
  //   })

  //   it('pastes data properly on a different cell', () => {
  //     const datacust = [
  //       [
  //         { data: 12, readOnly: true },
  //         { data: 24, readOnly: false },
  //       ],
  //     ]
  //     customWrapper = mount(
  //       <DataSheet
  //         data={datacust}
  //         valueRenderer={cell => cell.data}
  //         onChange={(cell, i, j, value) => (datacust[i][j].data = value)}
  //       />,
  //     )
  //     customWrapper.find('td').at(1).simulate('mouseDown')

  //     let evt = document.createEvent('HTMLEvents')
  //     evt.initEvent('paste', false, true)
  //     evt.clipboardData = { getData: type => '99\t100\n1001\t1002' }
  //     document.dispatchEvent(evt)

  //     expect(datacust[0].map(d => d.data)).toEqual([12, '99'])
  //   })

  //   it('pastes multiple rows correclty on windows', () => {
  //     const datacust = [
  //       [
  //         { data: 12, readOnly: true },
  //         { data: 24, readOnly: false },
  //       ],
  //       [
  //         { data: 1012, readOnly: true },
  //         { data: 1024, readOnly: false },
  //       ],
  //     ]
  //     customWrapper = mount(
  //       <DataSheet
  //         data={datacust}
  //         valueRenderer={cell => cell.data}
  //         onChange={(cell, i, j, value) => (datacust[i][j].data = value)}
  //       />,
  //     )
  //     customWrapper.find('td').at(1).simulate('mouseDown')

  //     let evt = document.createEvent('HTMLEvents')
  //     evt.initEvent('paste', false, true)
  //     evt.clipboardData = { getData: type => '99\t100\r\n1001\t1002' }
  //     document.dispatchEvent(evt)

  //     expect(datacust[1].map(d => d.data)).toEqual([1012, '1001'])
  //   })

  //   it('pastes multiple rows correclty when multiple cells are selected', () => {
  //     const datacust = [
  //       [
  //         { data: 12, readOnly: true },
  //         { data: 24, readOnly: false },
  //         { data: 25, readOnly: false },
  //       ],
  //       [
  //         { data: 1012, readOnly: true },
  //         { data: 1024, readOnly: false },
  //         { data: 1036, readOnly: false },
  //       ],
  //     ]
  //     customWrapper = mount(
  //       <DataSheet
  //         data={datacust}
  //         valueRenderer={cell => cell.data}
  //         onChange={(cell, i, j, value) => (datacust[i][j].data = value)}
  //       />,
  //     )
  //     customWrapper.find('td').at(1).simulate('mouseDown')

  //     wrapper.setState({
  //       start: { i: 1, j: 0 },
  //       end: { i: 2, j: 0 },
  //     })

  //     let evt = document.createEvent('HTMLEvents')
  //     evt.initEvent('paste', false, true)
  //     evt.clipboardData = {
  //       getData: type => '99\t100\t101\r\n1001\t1002\t1003',
  //     }
  //     document.dispatchEvent(evt)

  //     expect(datacust[1].map(d => d.data)).toEqual([1012, '1001', '1002'])
  //   })

  //   it('pastes multiple rows correclty when multiple cells are selected from bottom up', () => {
  //     const datacust = [
  //       [
  //         { data: 12, readOnly: true },
  //         { data: 24, readOnly: false },
  //         { data: 25, readOnly: false },
  //       ],
  //       [
  //         { data: 1012, readOnly: true },
  //         { data: 1024, readOnly: false },
  //         { data: 1036, readOnly: false },
  //       ],
  //     ]
  //     customWrapper = mount(
  //       <DataSheet
  //         data={datacust}
  //         valueRenderer={cell => cell.data}
  //         onChange={(cell, i, j, value) => (datacust[i][j].data = value)}
  //       />,
  //     )
  //     customWrapper.find('td').at(1).simulate('mouseDown')

  //     wrapper.setState({
  //       start: { i: 2, j: 0 },
  //       end: { i: 1, j: 0 },
  //     })

  //     let evt = document.createEvent('HTMLEvents')
  //     evt.initEvent('paste', false, true)
  //     evt.clipboardData = {
  //       getData: type => '99\t100\t101\r\n1001\t1002\t1003',
  //     }
  //     document.dispatchEvent(evt)

  //     expect(datacust[1].map(d => d.data)).toEqual([1012, '1001', '1002'])
  //   })

  //   it('doesnt auto paste data if cell is editing', () => {
  //     const datacust = [
  //       [
  //         { data: 12, readOnly: false },
  //         { data: 24, readOnly: false },
  //       ],
  //     ]
  //     customWrapper = mount(
  //       <DataSheet
  //         data={datacust}
  //         valueRenderer={cell => cell.data}
  //         onChange={(cell, i, j, value) => (datacust[i][j].data = value)}
  //       />,
  //     )
  //     customWrapper.find('td').at(1).simulate('doubleclick')

  //     let evt = document.createEvent('HTMLEvents')
  //     evt.initEvent('paste', false, true)
  //     evt.clipboardData = { getData: type => '100' }

  //     expect(datacust[0].map(d => d.data)).toEqual([12, 24])
  //   })

  //   it('pastes data properly and fires onPaste function if defined', done => {
  //     const datacust = [
  //       [
  //         { data: 12, readOnly: true },
  //         { data: 24, readOnly: false },
  //       ],
  //     ]
  //     customWrapper = mount(
  //       <DataSheet
  //         data={datacust}
  //         valueRenderer={cell => cell.data}
  //         onChange={(cell, i, j, value) => (datacust[i][j].data = value)}
  //         onPaste={pasted => {
  //           try {
  //             expect(pasted).toEqual([
  //               [
  //                 { cell: datacust[0][0], data: '99' },
  //                 { cell: datacust[0][1], data: '100' },
  //               ],
  //               [
  //                 { cell: undefined, data: '1001' },
  //                 { cell: undefined, data: '1002' },
  //               ],
  //             ])
  //             done()
  //           } catch (err) {
  //             done(err)
  //           }
  //         }}
  //       />,
  //     )
  //     customWrapper.find('td').at(0).simulate('mouseDown')
  //     let evt = document.createEvent('HTMLEvents')
  //     evt.initEvent('paste', false, true)
  //     evt.clipboardData = { getData: type => '99\t100\n1001\t1002' }
  //     document.dispatchEvent(evt)
  //   })

  //   it('pastes data properly, using parsePaste if defined', () => {
  //     const datacust = [
  //       [
  //         { data: 12, readOnly: true },
  //         { data: 24, readOnly: false },
  //       ],
  //       [
  //         { data: 1012, readOnly: true },
  //         { data: 1024, readOnly: false },
  //       ],
  //     ]
  //     customWrapper = mount(
  //       <DataSheet
  //         data={datacust}
  //         valueRenderer={cell => cell.data}
  //         onChange={(cell, i, j, value) => (datacust[i][j].data = value)}
  //         // "--" is our arbitrary row delimiter, "," is our arbitrary field delimiter
  //         parsePaste={pasted => {
  //           return pasted.split('--').map(line => line.split(','))
  //         }}
  //       />,
  //     )
  //     customWrapper.find('td').at(1).simulate('mouseDown')

  //     let evt = document.createEvent('HTMLEvents')
  //     evt.initEvent('paste', false, true)
  //     evt.clipboardData = { getData: type => '99,100--1001,1002' }
  //     document.dispatchEvent(evt)

  //     expect(datacust[1].map(d => d.data)).toEqual([1012, '1001'])
  //   })

  //   it('stops editing on outside page click', () => {
  //     const cell = wrapper.find('td').first()
  //     cell.simulate('mouseDown')
  //     cell.simulate('doubleClick')
  //     triggerMouseEvent(document, 'mousedown')

  //     expect(wrapper.state()).toEqual({
  //       start: {},
  //       end: {},
  //       selecting: false,
  //       editing: {},
  //       forceEdit: false,
  //       clear: {},
  //     })
  //   })

  //   it('pageClick does not execute if the mouse click is within', () => {
  //     const cell = wrapper.find('td').first()
  //     cell.simulate('mousedown')
  //     cell.simulate('mouseup')

  //     let evt = document.createEvent('HTMLEvents')
  //     evt.initEvent('mousedown', false, true)
  //     Object.defineProperty(evt, 'target', { value: cell.getDOMNode() })
  //     document.dispatchEvent(evt)

  //     expect(wrapper.state()).toEqual({
  //       start: { i: 0, j: 0 },
  //       end: { i: 0, j: 0 },
  //       selecting: true,
  //       editing: {},
  //       forceEdit: false,
  //       clear: {},
  //     })
  //   })
  //   it('delete on DELETE_KEY', done => {
  //     const cell = wrapper.find('td').first()
  //     data[0][1] = Object.assign(data[0][1], { readOnly: true })

  //     wrapper.find('td').at(0).simulate('mouseDown')
  //     wrapper.find('td').at(1).simulate('mouseOver')

  //     expect(data[0][0].data).toEqual(4)
  //     expect(data[0][1].data).toEqual(2)
  //     triggerKeyDownEvent(wrapper, DELETE_KEY)
  //     setTimeout(() => {
  //       expect(data[0][0].data).toEqual('')
  //       expect(data[0][1].data).toEqual(2)
  //       done()
  //     }, 0)
  //   })
  // })

  // describe('contextmenu', () => {
  //   let cells = null
  //   beforeEach(() => {
  //     cells = wrapper.find('td')
  //   })

  //   it('starts calls contextmenu with right object', done => {
  //     const datacust = [
  //       [
  //         { data: 12, readOnly: true },
  //         { data: 24, readOnly: false },
  //       ],
  //     ]
  //     customWrapper = mount(
  //       <DataSheet
  //         data={datacust}
  //         valueRenderer={cell => cell.data}
  //         onChange={(cell, i, j, value) => (datacust[i][j].data = value)}
  //         onContextMenu={(e, cell, i, j) => {
  //           try {
  //             expect(cell).toEqual({ data: 12, readOnly: true })
  //             done()
  //           } catch (err) {
  //             done(err)
  //           }
  //         }}
  //       />,
  //     )
  //     customWrapper.find('td').at(0).simulate('contextmenu')
  //   })
  // })
})
