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

      if (selected && selected.x === x && selected.y === y) {
        // unselect actually
        return { ...board, selected: null }
      }

      const cell = getCellAt(matrix, x, y)
      if (!cell) return board

      return {
        ...board,
        selected: { x, y }
      }
    }

    default:
      return board
  }
}
