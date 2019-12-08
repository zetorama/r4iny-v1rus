import React from 'react'
import { useState, useReducer, useMemo, useCallback } from 'react'

import { getInitialBoard, reduceBoard } from './Board.model'

export const SIZE_W = 8
export const SIZE_H = 12

const isSelected = (selected, x, y) => selected && selected.x === x && selected.y === y
const reverseMatrix = (matrix) => matrix.map(row => row.slice().reverse()).reverse()

export function Board({ w = SIZE_W, h = SIZE_H }) {
  const cssVars = useMemo(() => ({ '--w': w, '--h': h }), [w, h])

  const [board, dispatch] = useReducer(reduceBoard, getInitialBoard({ w, h }))

  const handleCellClick = useCallback(
    ev => {
      ev.preventDefault()
      const { x, y } = ev.target.dataset
      dispatch({
        type: 'select',
        payload: { x, y },
      })
    },
    [dispatch],
  )

  const matrixMirrored = useMemo(() => reverseMatrix(board.matrix), [board.matrix])

  return (
    <div class="Board" style={cssVars}>
      {matrixMirrored.map(row => row.map(({ x, y, value }) => (
        <Cell
          key={x + '-' + y}
          x={x}
          y={y}
          value={value}
          isSeleected={isSelected(board.selected, x, y)}
          onClick={handleCellClick}
        />
      )))}
    </div>
  )
}

export function Cell({ x, y, value, isSelected, onClick }) {
  const cssVars = useMemo(() => ({ '--x': x, '--y': y }), [x, y])

  return (
    <div class="Cell" style={cssVars} data-x={x} data-y={y} onClick={onClick}>
      {value}
    </div>
  )
}
