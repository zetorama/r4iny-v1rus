
export const SIZE_W = 8
export const SIZE_H = 12
export const INITIAL_ROWS = 4
export const TARGET_SUM = -1 // hence, disabled
export const ALPHABET = [0, 1, 2, 3, 4, 5, 6, 7]
// export const ALPHABET = [5]

// helpers
const runSeries = (arg, callbcks) => callbcks.reduce((arg, cb) => cb(arg), arg)
const getRandomChar = () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]

const createMatrix = (w, h) =>
  Array.from({ length: h }).map((_, y) =>
    Array.from({ length: w }).map((_, x) => getInitialCell({x, y}))
  )

const generateMatrix = (w, h, strainLength) => {
  const matrix = createMatrix(w, h)

  for (let i = 0, x = 0, y = 0; i < strainLength; i++) {
    matrix[y][x].value = getRandomChar()

    if (++x === w) {
      // go to next row
      x = 0
      y++
    }
  }

  return matrix
}

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
    if (getValueAt(matrix, x, y) != null) return false

    x += stepX
    y += stepY
  }

  // ok, we can interact then
  return true
}

const canEliminateBoth = (_matrix, one, two) =>
  one.value === two.value || one.value + two.value === TARGET_SUM

const swapCells = (matrix, one, two) => {
  matrix = setValueAt(matrix, one.x, one.y, two.value)
  return setValueAt(matrix, two.x, two.y, one.value)
}

const getValueAt = (matrix, x, y) => matrix[y][x].value
const setValueAt = (matrix, x, y, value) =>
  matrix.map((row, curY) => y !== curY ? row : row.map((curCell, curX) =>
    x !== curX ? curCell : { ...curCell, value }
  ))

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
  let nextY = cursor.y
  let nextX = cursor.x + (isXForward ? 1 : -1)
  while (!matrix[nextY]?.[nextX] || getValueAt(matrix, nextX, nextY) == null) {
    if (nextY < 0 || nextY >= matrix.length) {
      nextY = nextY < 0 ? 0 : matrix.length - 1
      isYForward = !isYForward
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

  return {
    cursor: { x: nextX, y: nextY },
    isXForward,
    isYForward,
  }
}

export const findEmptyRowIndex = (matrix, x) => {
  let y = matrix.length - 1
  while (y >= 0 && getValueAt(matrix, x, y) == null) {
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
  strainLength = w * INITIAL_ROWS,
} = {}) => ({
  w,
  h,
  n: strainLength, // keep what was initial length of strain
  matrix: generateMatrix(w, h, strainLength),
  cursor: { x: 0, y: 0 },
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

    case 'clone': {
      const { x, y, n } = payload
      let { matrix } = board

      if (y >= board.h) {
        return { ...board, matrix, gameOver: 'lose' }
      }

      // clone character & advance cursor
      const value = getValueAt(matrix, board.cursor.x, board.cursor.y)
      matrix = setValueAt(matrix, x, y, value)

      return {
        ...board,
        ...advanceCursor(matrix, board.cursor, board.isXForward, board.isYForward),
        matrix,
      }
    }

    case 'select': {
      const { matrix, selected, cursor } = board
      const { x, y } = payload
      const target = { x, y, value: getValueAt(matrix, x, y) }
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
        return {
          ...board,
          matrix: swapCells(matrix, target, selected),
          selected: null,
        }
      }

      // clear both cells
      const nextMatrix = runSeries(matrix, [
        (m) => setValueAt(m, selected.x, selected.y, null),
        (m) => setValueAt(m, target.x, target.y, null),
        (m) => checkEmptyRows(m),
      ])
      const strainLength = getStrain(nextMatrix).length
      const shouldMoveCursor = isSameCoord(cursor, selected) || isSameCoord(cursor, target)

      return {
        ...board,
        selected: null,
        matrix: nextMatrix,
        gameOver: strainLength < 1 ? 'win' : board.gameOver,
        ...(shouldMoveCursor ? advanceCursor(nextMatrix, cursor, board.isXForward, board.isYForward) : undefined),
      }

    }

    default:
      return board
  }
}
