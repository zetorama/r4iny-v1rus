export const ALPHABET = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

const getRandomChar = () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]

const createMatrix = (w, h) =>
  Array.from({ length: h }).map((_, y) =>
    Array.from({ length: w }).map((_, x) => ({ x, y, value: null }))
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

export const getInitialBoard = ({ w, h, strainLength = w * h / 2 }) => ({
  matrix: generateMatrix(w, h, strainLength),
  selected: null,
})

export const reduceBoard = (state, { type, payload }) => {
  switch (type) {
    // case

    default:
      return state
  }
}
