import React from 'react'
import { useReducer, useCallback, useRef, useEffect } from 'react'

import { findEmptyRowIndex } from './Board.model'

// 零癸虚壱壹甲弐貳乙参參丙四肆丁五伍戊六陸己七柒庚八捌辛九玖壬 0123456789 GAME OVER
const ALPHABET = [
  // https://www.omniglot.com/language/numbers/japanese.htm
  // http://www.sljfaq.org/afaq/jikkan-juunishi.html
  '零', '癸', '虚', // 0
  '壱', '壹', '甲', // 1
  '弐', '貳', '乙', // 2
  '参', '參', '丙', // 3
  '四', '肆', '丁', // 4
  '五', '伍', '戊', // 5
  '六', '陸', '己', // 6
  '七', '柒', '庚', // 7
  // '八', '捌', '辛', // 8
  // '九', '玖', '壬', // 9
]

const randInt = (min, max) => Math.floor(Math.random() * (max - min)) + min
const getRandomChar = () => ALPHABET[randInt(0, ALPHABET.length)]

const generateStream = ({ minChars = 2, maxChars, minSpeed = 50, maxSpeed = 100 }) => ({
  position: 0,
  speed: randInt(minSpeed, maxSpeed),
  chars: Array.from({ length: randInt(minChars, maxChars) }).map(_ => getRandomChar()),
})

const createStreams = ({ w, minChars, maxChars, minSpeed, maxSpeed }) => {
  return Array.from({ length: w }).map(_ => generateStream({ minChars, maxChars, minSpeed, maxSpeed }))
}

export function Rain({ w, h, matrix, minChars, maxChars, isActive = true, pace: speedKoeff = 1 / 1000, onDrop = null }) {
  const [, reRender] = useReducer(counter => counter + 1, 0)
  const streams = useRef(createStreams({ w, h, minChars, maxChars }))
  const containerRef = useRef(null)
  const shouldRAF = useRef(false)

  const advancePosition = useCallback((position, speed) => position + speed * speedKoeff, [speedKoeff])

  const stepRAF = useRef()
  stepRAF.current = (_dt) => {
    runRAF()

    if (!containerRef.current) return

    const streamEls = containerRef.current.childNodes
    for (let i = 0; i < streamEls.length; i++) {
      const stream = streams.current[i]
      stream.position = advancePosition(stream.position, stream.speed)

      const dropUntilIndex = findEmptyRowIndex(matrix, i) - 1
      const maxPosition = Math.round((h - dropUntilIndex - 1) / h * 100)

      if (stream.position < maxPosition) {
        streamEls[i].style.transform = `translateY(${stream.position}%)`
        continue
      } else {
        streams.current[i] = generateStream({ minChars, maxChars })
        reRender()
        onDrop && onDrop({
          x: i,
          y: dropUntilIndex + 1,
          n: stream.chars.length,
        })
      }
    }
  }

  const runRAF = useCallback(() => {
    if (shouldRAF.current) {
      requestAnimationFrame((dt) => stepRAF.current(dt))
    }

  }, [stepRAF, shouldRAF])

  useEffect(() => {
    shouldRAF.current = isActive
    if (isActive) runRAF()

    return () => {
      shouldRAF.current = false
    }
  }, [runRAF, isActive])

  return (
    <div className='Rain' ref={containerRef}>

      {streams.current.map(({ chars, position }, i) => (
        <div className='Rain-stream' key={i} data-index={i} style={{ transform: `translateY(${position}%)` } }>
          {chars.map((char, i) => (
            <div className='Rain-drop' key={i}>
              <div className='Rain-drop-char'>{char}</div>
            </div>
          ))}
        </div>
      ))}

    </div>
  )
}