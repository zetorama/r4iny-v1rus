import React from 'react'
import { useReducer, useCallback, useRef, useEffect } from 'react'

import { findEmptyY } from './Board.model'

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

const generateStream = ({
  minChars = 2,
  maxChars = 8,
  minCharsBetweenDrops = minChars,
  maxCharsBetweenDrops = maxChars,
  minSpeed = 50,
  maxSpeed = 100,
}) => ({
  position: 0,
  nextDrop: randInt(minCharsBetweenDrops, maxCharsBetweenDrops),
  speed: randInt(minSpeed, maxSpeed),
  chars: Array.from({ length: randInt(minChars, maxChars) }).map(_ => getRandomChar()),
})

const createStreams = ({ w, minChars, maxChars, minCharsBetweenDrops, maxCharsBetweenDrops, minSpeed, maxSpeed }) => {
  return Array.from({ length: w }).map(_ => [
    generateStream({ minChars, maxChars, minCharsBetweenDrops, maxCharsBetweenDrops, minSpeed, maxSpeed })
  ])
}

const getStreamTailPosition = (stream, h) => stream.position - stream.chars.length / h * 100

const areStreamsOverlap = (streamOne, streamTwo, h) => {
  const below = streamOne.position > streamTwo.position ? streamOne : streamTwo
  const above = below === streamOne ? streamTwo : streamOne
  return getStreamTailPosition(below, h) <= above.position ? true : false
}

const canAddStream = (streams, h) => {
  if (!streams.length) return true

  // we always expect last stream to be the top-most
  const stream = streams[streams.length - 1]
  if (!stream) {
    console.warn('WAT??? last stream is null???')
    return false
  }

  const tailPosition = getStreamTailPosition(stream, h)
  const minSpace = stream.nextDrop / h * 100

  // do we have enough space to add one more stream?
  return tailPosition - minSpace > 0 ? true : false
}

// const findStreamEl = (elements, x, i) => {
//   return Array.from(elements).find(el => Number(el.dataset.x) === x && Number(el.dataset.index) === i)
// }

export function Rain({ w,
  h,
  matrix,
  minChars,
  maxChars,
  minCharsBetweenDrops = minChars,
  maxCharsBetweenDrops = minChars + maxChars,
  isActive = true,
  pace: speedKoeff = 1 / 1000,
  onDrop = null,
}) {
  const [, reRender] = useReducer(counter => counter + 1, 0)
  const rainOfStreams = useRef(createStreams({ w, h, minChars, maxChars, minCharsBetweenDrops, maxCharsBetweenDrops }))
  const containerRef = useRef(null)
  const shouldRAF = useRef(false)

  const advancePosition = useCallback((position, speed, _dt) => position + speed * speedKoeff, [speedKoeff])

  const stepRAF = useRef()
  stepRAF.current = (dt) => {
    runRAF()

    if (!containerRef.current) return

    // advance stream positions
    for (const streamEl of Array.from(containerRef.current.childNodes)) {
      const x = Number(streamEl.dataset.x)
      const index = Number(streamEl.dataset.index)
      const stream = rainOfStreams.current[x][index]

      if (!stream) {
        console.warn('WAT?? cannot find stream by element', {x, index})
        continue
      }

      // NOTE: mutating stream directly… that's why we `useRef()` streams
      stream.position = advancePosition(stream.position, stream.speed, dt)

      if (index > 0) {
        const prevStream = rainOfStreams.current[x][index - 1]
        if (prevStream && areStreamsOverlap(prevStream, stream, h)) {
          // normalize position and adjust speed to never happen again
          stream.position = getStreamTailPosition(prevStream, h)
          stream.speed = prevStream.speed
        }
      }

      const dropUntilY = findEmptyY(matrix, x)
      const maxPosition = Math.round((h - dropUntilY) / h * 100)

      if (stream.position >= maxPosition) {
        // this stream has dropped, notify and mark for removal
        // NOTE: this might trigger <Rain/>'s re-render even before we finish processing current frame
        onDrop && onDrop({
          x,
          y: dropUntilY,
          n: stream.chars.length,
        })

        rainOfStreams.current[x][index] = null
      } else {
        // otherwise, just adjust position directly to element
        streamEl.style.transform = `translateY(${stream.position}%)`
      }
    }

    let shouldReRender = false

    // add/remove streams
    for (const streams of rainOfStreams.current) {
      // expecting only first stream to be removed in the same frame
      if (streams[0] == null) {
        streams.shift()
        shouldReRender = true
      }

      if (canAddStream(streams, h)) {
        streams.push(generateStream({ minChars, maxChars, minCharsBetweenDrops, maxCharsBetweenDrops }))
        shouldReRender = true
      }
    }

    if (shouldReRender) reRender()
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
    <div className='Rain' ref={containerRef} style={{ '--w': w }}>

      {/* as we might get re-render while still processing streams, some of them might be marked for remove */}
      {rainOfStreams.current.map((streams, x) => streams.filter(Boolean).map(({ chars, position }, i) => (
        <div
          className='Rain-stream'
          key={i + ':' + x}
          data-x={x}
          data-index={i}
          style={{ '--x': x, transform: `translateY(${position}%)` } }
        >
          {chars.map((char, i) => (
            <div className='Rain-drop' key={i}>
              <div className='Rain-drop-char'>{char}</div>
            </div>
          ))}
        </div>
      )))}

    </div>
  )
}
