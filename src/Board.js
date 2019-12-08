import React from 'react'
import { useState, useReducer, useMemo, useCallback } from 'react'

import { getInitialBoard, reduceBoard } from './Board.model'

export const SIZE_W = 8
export const SIZE_H = 12

const isSelected = (selected, x, y) => selected ? selected.x === x && selected.y === y : false
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
        payload: {
          x: Number(x),
          y: Number(y),
        },
      })
    },
    [dispatch],
  )

  const matrixMirrored = useMemo(() => reverseMatrix(board.matrix), [board.matrix])
  // const matrixMirrored = board.matrix

  return (
    <div className="Board" style={cssVars}>
      {matrixMirrored.map(row => row.map((cell) => (
        <Cell
          key={cell.x + ':' + cell.y}
          cell={cell}
          isSelected={isSelected(board.selected, cell.x, cell.y)}
          onClick={handleCellClick}
        />
      )))}
    </div>
  )
}

export function Cell({ cell, isSelected, onClick }) {
  const { x, y, value } = cell
  const cssVars = useMemo(() => ({ '--x': x, '--y': y }), [x, y])
  const clsName = `Cell ${isSelected ? 'is-selected' : ''}`

  return (
    <div className={clsName} style={cssVars} data-x={x} data-y={y} onClick={onClick}>
      {value}
    </div>
  )
}