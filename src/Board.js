import React from 'react'
import { useReducer, useMemo, useCallback } from 'react'

import { getInitialBoard, reduceBoard, getStrain, isSameCoord, PACE_SCALE } from './Board.model'
import {Rain} from './Rain'

const reverseMatrix = (matrix) => matrix.slice().reverse()
const isClearedCell = (matrix, { x, y }) => matrix.slice(y).some(row => row[x].value != null)

export function Board() {
  const [board, dispatch] = useReducer(reduceBoard, getInitialBoard())
  const cssVars = useMemo(() => ({ '--w': board.w, '--h': board.h }), [board.w, board.h])

  const handleCellClick = useCallback(
    ({ x, y }) => dispatch({ type: 'select', payload: { x, y } }),
    [dispatch],
  )

  const handleReset = useCallback(ev => dispatch({ type: 'reset' }), [dispatch])
  const handleJumpForward = useCallback(ev => dispatch({ type: 'jump-forward' }), [dispatch])
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
            isCleared={isClearedCell(board.matrix, cell)}
            isSelected={isSameCoord(cell, board.selected)}
            isCursor={isSameCoord(cell, board.cursor)}
            onClick={handleCellClick}
          />
        )))}

        <Rain
          isActive={!board.gameOver}
          pace={board.pace / PACE_SCALE}
          w={board.w}
          h={board.h}
          minChars={2}
          maxChars={board.h / 3 + 1}
          matrix={board.matrix}
          onDrop={handleRainDrop}
        />
      </main>

      <aside className='StatusBar'>
        <div className={['StatusBar-action', board.gameOver && 'is-blinking'].filter(Boolean).join(' ')}>
          <button onClick={handleReset} title='Restart game'>＜ reset</button>
        </div>
        <div className='StatusBar-info'>
          strain: {strainLength}
        </div>
        <div className='StatusBar-info'>
          pace: {board.pace}
        </div>
        <div className='StatusBar-action'>
          <button onClick={handleJumpForward} disabled={!!board.gameOver} title='Fast-forward'>＞</button>
        </div>
      </aside>

      {board.gameOver && (
        <div className='Message'>
          {board.gameOver === 'win' ? 'threat cleared' : 'system failure'}
        </div>
      )}
    </div>
  )
}

export function Cell({ cell, isCleared, isSelected, isCursor, onClick }) {
  const cssVars = useMemo(() => ({ '--x': cell.x, '--y': cell.y, '--yMax5': Math.min(5, cell.y) }), [cell.x, cell.y])
  const clsName = [
    'Cell',
    isCleared && 'is-cleared',
    isSelected && 'is-selected',
    isCursor && 'is-cursor',
  ].filter(Boolean).join(' ')

  const handleCellClick = useCallback(() => onClick && onClick(cell), [onClick, cell])

  return (
    <div className={clsName} style={cssVars} onClick={handleCellClick}>
      {cell.value != null && (
        <div className='Cell-char'>{cell.value}</div>
      )}
    </div>
  )
}
