
export const SIZE_W = 8
export const SIZE_H = 12
export const INITIAL_ROWS = 8
export const TARGET_SUM = 10
export const ALPHABET = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
// export const ALPHABET = [5]

export const TICKS_COST_SWAP = 8
export const TICKS_COST_ELIMINATE = 2

// private
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
      matrix = matrix.map((row, y) => y !== tempY ? row : matrix[tempY + 1].map(cell => ({ ...cell, y: tempY })))
    }

    // and cleanup the very last one
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
  console.log({ stepX, stepY, x, y })
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

const getStrain = (matrix) => {
  const strain = []
  for (const row of matrix) {
    for (const { value } of row) {
      if (value != null) strain.push(value)
    }
  }

  return strain
}

// public
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
  n: strainLength,
  strainLength,
  ticksLeft: strainLength,
  matrix: generateMatrix(w, h, strainLength),
  nextX: w - 1,
  nextStep: -1,
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

    case 'replicate': {
      let { matrix, nextX, nextStep } = board
      const strain = getStrain(matrix)

      for (const value of strain) {
        // find empty row, which would be the next one after top-most value
        let y = board.h - 1
        while (y >= 0 && getValueAt(matrix, nextX, y) == null) {
          y--
        }

        if (++y === board.h) {
          // this is the end
          return { ...board, matrix, gameOver: 'lose' }
        }

        matrix = setValueAt(matrix, nextX, y, value)

        nextX += nextStep
        if (nextX === -1) {
          nextX = 0
          nextStep = 1
        } else if (nextX === board.w) {
          nextX = board.w - 1
          nextStep = -1
        }
      }

      const strainLength = board.strainLength * 2

      return {
        ...board,
        matrix,
        strainLength,
        ticksLeft: board.strainLength * 2,
        nextX,
        nextStep,
      }
    }

    case 'select': {
      const { matrix, selected } = board
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
          ticksLeft: board.ticksLeft - TICKS_COST_SWAP,
        }
      }

      // clear both cells
      const strainLength = board.strainLength - 2

      return {
        ...board,
        selected: null,
        matrix: runSeries(matrix, [
          (m) => setValueAt(m, selected.x, selected.y, null),
          (m) => setValueAt(m, target.x, target.y, null),
          (m) => checkEmptyRows(m),
        ]),
        strainLength,
        ticksLeft: board.ticksLeft - TICKS_COST_ELIMINATE,
        gameOver: strainLength < 1 ? 'win' : board.gameOver,
      }

    }

    default:
      return board
  }
}
