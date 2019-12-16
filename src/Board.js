import React from 'react'
import { useReducer, useMemo, useCallback } from 'react'

import { getInitialBoard, reduceBoard, getStrain, INITIAL_ROWS } from './Board.model'
import {Rain} from './Rain'

const isSame = ({x, y}, optional) => optional ? optional.x === x && optional.y === y : false
const reverseMatrix = (matrix) => matrix.slice().reverse()

export function Board() {
  const [board, dispatch] = useReducer(reduceBoard, getInitialBoard())
  const cssVars = useMemo(() => ({ '--w': board.w, '--h': board.h }), [board.w, board.h])

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

  const handleReset = useCallback(ev => dispatch({ type: 'reset' }), [dispatch])
  const handleRainDrop = useCallback((payload) => {
    dispatch({ type: 'clone', payload })
  }, [dispatch])


  const strainLength = useMemo(() => getStrain(board.matrix).length, [board.matrix])
  const matrixMirrored = useMemo(() => reverseMatrix(board.matrix), [board.matrix])
  // const matrixMirrored = board.matrix

  const clsName = [
    'Board',
    board.gameOver && 'is-over',
  ].filter(Boolean).join(' ')

  return (
    <div className={clsName} style={cssVars}>

      <main className='Matrix'>
        {matrixMirrored.map(row => row.map((cell) => (
          <Cell
            key={cell.x + ':' + cell.y}
            cell={cell}
            isSelected={isSame({ x: cell.x, y: cell.y }, board.selected)}
            isCursor={isSame({ x: cell.x, y: cell.y }, board.cursor)}
            onClick={handleCellClick}
          />
        )))}

        {board.gameOver == null && (
          <Rain
            w={board.w}
            h={board.h}
            maxChars={INITIAL_ROWS}
            matrix={board.matrix}
            onDrop={handleRainDrop}
          />
        )}
      </main>

      <aside className='StatusBar'>
        <div className={['StatusBar-action', board.gameOver && 'is-blinking'].filter(Boolean).join(' ')}>
          <button onClick={handleReset}>← new game</button>
        </div>
        <div className='StatusBar-info'>
          Strain: {strainLength}
        </div>
      </aside>

      {board.gameOver && (
        <div className='Message'>
          {board.gameOver === 'win' ? 'You win' : 'Game over'}
        </div>
      )}
    </div>
  )
}

export function Cell({ cell, isSelected, isCursor, onClick }) {
  const { x, y, value } = cell
  const cssVars = useMemo(() => ({ '--x': x, '--y': y }), [x, y])
  const clsName = [
    'Cell',
    isSelected && 'is-selected',
    isCursor && 'is-cursor',
  ].filter(Boolean).join(' ')

  return (
    <div className={clsName} style={cssVars} data-x={x} data-y={y} onClick={onClick}>
      {value}
    </div>
  )
}
