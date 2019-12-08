export const TARGET_SUM = 10
export const ALPHABET = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

// private
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

const areBothOnSameLine = (one, two) =>
  one.x === two.x || one.y === two.y || Math.abs(one.x - two.x) === Math.abs(one.y - two.y)

const canSelectBoth = (matrix, one, two) => {
  if (!areBothOnSameLine(one, two)) return false

  // now, check if there's anything in between
  const stepX = one.x === two.x ? 0 : one.x < two.x ? 1 : -1
  const stepY = one.y === two.y ? 0 : one.y < two.y ? 1 : -1
  let x = one.x + stepX
  let y = one.y + stepY
  while (x !== two.x && y !== two.y) {
    if (getCellAt(matrix, x, y).value != null) return false

    x += stepX
    y += stepY
  }

  // ok, we can interact then
  return true
}

const canEliminateBoth = (_matrix, one, two) =>
  one.value === two.value || one.value + two.value === TARGET_SUM

const swapCells = (matrix, one, two) => {
  const { value: temp } = one
  matrix = setCellAt(matrix, one.x, one.y, { ...one, value: two.value })
  return setCellAt(matrix, two.x, two.y, { ...two, value: temp })
}

const getCellAt = (matrix, x, y) => matrix[y][x]
const setCellAt = (matrix, x, y, cell) =>
  matrix.map((row, curY) => y !== curY ? row : row.map((curCell, curX) =>
    x !== curX ? curCell : cell
  ))

// public
export const getInitialCell = ({ x, y }) => ({
  x,
  y,
  value: null,
})

export const getInitialBoard = ({ w, h, strainLength = w * h / 2 }) => ({
  matrix: generateMatrix(w, h, strainLength),
  selected: null,
})

export const reduceBoard = (board, { type, payload }) => {
  console.log('%c reduceBoard: [%s]', 'color: green', type, payload)

  switch (type) {
    case 'select': {
      const { matrix, selected } = board
      const { x, y } = payload
      const cell = getCellAt(matrix, x, y)
      if (cell.value == null || (selected && selected.x === cell.x && selected.y === cell.y)) {
        // unselect on empty or same cell
        return { ...board, selected: null }
      }

      if (!selected || !canSelectBoth(matrix, cell, selected)) {
        // just toggle selected to a new cell
        return { ...board, selected: { ...cell } }
      }

      if (canEliminateBoth(matrix, cell, selected)) {
        const temp = setCellAt(matrix, selected.x, selected.y, { ...selected, value: null })

        return {
          ...board,
          selected: null,
          matrix: setCellAt(temp, cell.x, cell.y, { ...cell, value: null })
        }
      }

      // otherwise, just swap them
      return {
        ...board,
        matrix: swapCells(matrix, cell, selected),
        selected: null,
      }
    }

    default:
      return board
  }
}
