
export const SIZE_W = 8
export const SIZE_H = 12
export const MAX_INITIAL_Y = 8
export const INITIAL_ROWS = 5
export const INITIAL_CELLS = SIZE_W * SIZE_H / 2 + SIZE_W
export const TARGET_SUM = -1 // hence, disabled
export const ALPHABET = [0, 1, 2, 3, 4, 5, 6, 7]
// export const ALPHABET = [5]

export const PACE_SCALE = 250000
export const PACE_HOLD = 10
export const PACE_MIN = 100
export const PACE_MAX = 8110
export const PACE_INC_CLEAR = 2
export const PACE_INC_SWAP = 1

// helpers
const runSeries = (arg, callbcks) => callbcks.reduce((arg, cb) => cb(arg), arg)
const getRandomChar = () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]

const createMatrix = (w, h) =>
  Array.from({ length: h }).map((_, y) =>
    Array.from({ length: w }).map((_, x) => getInitialCell({x, y}))
  )

// const generateMatrix = (w, h, strainLength) => {
//   const matrix = createMatrix(w, h)

//   for (let i = 0, x = 0, y = 0; i < strainLength; i++) {
//     matrix[y][x].value = getRandomChar()

//     if (++x === w) {
//       // go to next row
//       x = 0
//       y++
//     }
//   }

//   return matrix
// }

const isEmptyRow = (matrix, y) => matrix[y].every(({ value }) => value == null)

const checkEmptyRows = (matrix) => {
  for (let y = matrix.length - 2; y >= 0; y--) {
    if (!isEmptyRow(matrix, y)) continue

    // put down every other row
    let tempY = y
    for (; tempY < matrix.length - 1; tempY++) {
      if (isEmptyRow(matrix, tempY + 1)) break

      // copy top row to current row
      // eslint-disable-next-line no-loop-func
      matrix = matrix.map((row, y) => y !== tempY ? row : matrix[tempY + 1].map(cell => ({ ...cell, y: tempY })))
    }

    // and cleanup the very last one
    // eslint-disable-next-line no-loop-func
    matrix = matrix.map((row, y) => y !== tempY ? row : matrix[tempY].map(cell => ({ ...cell, value: null })))
  }

  return matrix
}

const areBothOnSameLine = (one, two) =>
  one.x === two.x || one.y === two.y || Math.abs(one.x - two.x) === Math.abs(one.y - two.y)

const canSelectBoth = (matrix, one, two) => {
  if (!areBothOnSameLine(one, two)) return false

  // now, check if there's anything in between
  const stepX = one.x === two.x ? 0 : one.x < two.x ? 1 : -1
  const stepY = one.y === two.y ? 0 : one.y < two.y ? 1 : -1
  let x = one.x + stepX
  let y = one.y + stepY
  while (x !== two.x || y !== two.y) {
    if (getValueAt(matrix, { x, y }) != null) return false

    x += stepX
    y += stepY
  }

  // ok, we can interact then
  return true
}

const canEliminateBoth = (_matrix, one, two) =>
  one.value === two.value || one.value + two.value === TARGET_SUM

const swapCells = (matrix, one, two) => runSeries(matrix, [
  (m) => setValueAt(m, one, two.value),
  (m) => setValueAt(m, two, one.value),
])

const getValueAt = (matrix, cell) => cell ? matrix[cell.y]?.[cell.x]?.value : undefined
const setValueAt = (matrix, cell, value) =>
  cell
    ? matrix.map((row, curY) => cell.y !== curY ? row : row.map((curCell, curX) =>
        cell.x !== curX ? curCell : { ...curCell, value }
      ))
    : matrix

export const getStrain = (matrix) => {
  const strain = []
  for (const row of matrix) {
    for (const { value } of row) {
      if (value != null) strain.push(value)
    }
  }

  return strain
}

const advanceCursor = (matrix, cursor, isXForward, isYForward) => {
  if (!cursor) return { cursor, isXForward, isYForward }

  let edgesToReach = 2
  let nextY = cursor.y
  let nextX = cursor.x + (isXForward ? 1 : -1)
  while (!matrix[nextY]?.[nextX] || getValueAt(matrix, { x: nextX, y: nextY }) == null) {
    if (nextY < 0 || nextY >= matrix.length) {
      nextY = nextY < 0 ? 0 : matrix.length - 1
      isYForward = !isYForward

      if (--edgesToReach < 1) break
      continue
    }
    if (nextX < 0 || nextX >= matrix[nextY].length) {
      nextX = nextX < 0 ? 0 : matrix[nextY].length - 1
      nextY += isYForward ? 1 : -1
      isXForward = !isXForward
      continue
    }

    nextX += (isXForward ? 1 : -1)
  }

  if (!edgesToReach) {
    // it means, we have looked through the whole matrix, and there's no cursor anymore
    return { cursor: null, isXForward, isYForward }
  }

  return {
    cursor: { x: nextX, y: nextY },
    isXForward,
    isYForward,
  }
}

const jumpForward = (board) => ({
  ...board,
  isJumping: true,
  prevPace: board.pace,
  pace: PACE_MAX,
})

const isInitialFilled = (matrix) =>
  matrix[INITIAL_ROWS - 1].every(({ value }) => value != null)
  || getStrain(matrix).length >= INITIAL_CELLS
  || matrix[MAX_INITIAL_Y].some(({ value }) => value != null)

export const findEmptyRowIndex = (matrix, x) => {
  let y = matrix.length - 1
  while (y >= 0 && getValueAt(matrix, { x, y }) == null) {
    y--
  }

  return y + 1
}

export const isSameCoord = ({ x, y }, optional) => optional ? optional.x === x && optional.y === y : false

// model-related
export const getInitialCell = ({ x, y }) => ({
  x,
  y,
  value: null,
})

export const getInitialBoard = ({
  w = SIZE_W,
  h = SIZE_H,
} = {}) => ({
  w,
  h,
  matrix: createMatrix(w, h),
  isInitializing: true,
  isJumping: false,
  pace: PACE_MAX,
  prevPace: PACE_MIN,
  cursor: null,
  isXForward: true,
  isYForward: true,
  selected: null,
  gameOver: null,
})

export const reduceBoard = (board, { type, payload }) => {
  console.log('%c reduceBoard: [%s]', 'color: green', type, payload)

  switch (type) {
    case 'reset': {
      const { w, h, n: strainLength } = board
      return getInitialBoard({ w, h, strainLength })
    }

    case 'jump-forward': {
      if (board.gameOver) return board

      return jumpForward(board)
    }

    case 'clone': {
      if (board.gameOver) return board

      const { x, y, n } = payload

      if (y >= board.h) {
        // when you reach the top, you loose
        return { ...board, gameOver: 'lose' }
      }

      // clone character & advance cursor
      // but in case if it's a first row, make it N times instead
      let times = y > 0 ? 1 : n
      let nextY = y
      let state = { ...board }
      while (times--) {
        const value = state.cursor ? getValueAt(state.matrix, state.cursor) : getRandomChar()
        state.matrix = setValueAt(state.matrix, { x, y: nextY }, value)

        Object.assign(state, advanceCursor(state.matrix, state.cursor, state.isXForward, state.isYForward))

        // advance `y` to fill the whole stream into column
        nextY++
      }

      if (state.isInitializing && isInitialFilled(state.matrix)) {
        Object.assign(state, {
          isInitializing: false,
          cursor: { x: 0, y: 0 },
          pace: PACE_HOLD,
        })
      } else if (state.isJumping) {
        Object.assign(state, {
          isJumping: false,
          pace: board.prevPace,
        })
      }

      return state
    }

    case 'select': {
      if (board.gameOver) return board

      const { matrix, selected, cursor, pace } = board
      const { x, y } = payload
      const target = { x, y, value: getValueAt(matrix, { x, y }) }
      if (target.value == null || (selected && selected.x === target.x && selected.y === target.y)) {
        // unselect on empty or when it's the same cell
        return { ...board, selected: null }
      }

      if (!selected || !canSelectBoth(matrix, target, selected)) {
        // toggle selected to a new cell
        return { ...board, selected: { ...target } }
      }

      if (!canEliminateBoth(matrix, target, selected)) {
        // swap both cells
        return jumpForward({
          ...board,
          matrix: swapCells(matrix, target, selected),
          selected: null,
          pace: pace === PACE_HOLD ? board.prevPace : pace + PACE_INC_SWAP,
        })
      }

      // clear both cells
      const nextMatrix = runSeries(matrix, [
        (m) => setValueAt(m, selected, null),
        (m) => setValueAt(m, target, null),
        (m) => checkEmptyRows(m),
      ])
      const strainLength = getStrain(nextMatrix).length
      const shouldMoveCursor = cursor ? isSameCoord(selected, cursor) || isSameCoord(target, cursor) : false

      return {
        ...board,
        matrix: nextMatrix,
        selected: null,
        pace: pace === PACE_HOLD ? board.prevPace : pace + PACE_INC_CLEAR,
        gameOver: strainLength < 1 ? 'win' : board.gameOver,
        ...(shouldMoveCursor ? advanceCursor(nextMatrix, cursor, board.isXForward, board.isYForward) : undefined),
      }

    }

    default:
      return board
  }
}
