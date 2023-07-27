import { describe, it, expect } from "vitest"
import { render, screen } from '@testing-library/react'
import DataCell from "./DataCell"

describe('DataCell', () => {
  it('renders without crashing', () => {
    render(<DataCell />)
    expect(true).toBe(true)
  })
})