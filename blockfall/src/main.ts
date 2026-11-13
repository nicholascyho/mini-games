import { cells, fits, Game, shapes, spawn, WIDTH, HEIGHT, type Kind } from './game'
import './style.css'

const element = <T extends HTMLElement>(id: string) => document.getElementById(id) as T
const board = element<HTMLCanvasElement>('board')
const preview = element<HTMLCanvasElement>('next')
const overlay = element('overlay')
const status = element('status')
const start = element<HTMLButtonElement>('start')
const newGame = element<HTMLButtonElement>('new-game')
const pause = element<HTMLButtonElement>('pause')
const controls = [...document.querySelectorAll<HTMLButtonElement>('.controls button')]
const colors: Record<Kind, string> = {
  I: '#54dcec', O: '#ffd66c', T: '#c498ff', S: '#8ce69f',
  Z: '#ff819c', J: '#85a5ff', L: '#ffa36a',
}
const storageKey = 'blockfall.best.v1'
let best = 0
try { best = Math.max(0, Number(localStorage.getItem(storageKey)) || 0) } catch {}
const saveKey = 'blockfall.run.v1'

function loadRun() {
  try {
    const raw = localStorage.getItem(saveKey)
    if (!raw) return undefined
    const saved = Game.restore(JSON.parse(raw))
    const { board, active, next, bag, score, lines } = saved.snapshot()
    const kind = (value: unknown) => typeof value === 'string' && Object.hasOwn(shapes, value)
    if (board.length === HEIGHT && board.every(row => Array.isArray(row) &&
      row.length === WIDTH && row.every(cell => cell === null || kind(cell))) &&
      kind(active.kind) && kind(next) && Array.isArray(bag) &&
      bag.length <= 7 && bag.every(kind) && new Set(bag).size === bag.length &&
      Number.isSafeInteger(score) && score >= 0 && Number.isSafeInteger(lines) && lines >= 0 &&
      Number.isInteger(active.x) && Number.isInteger(active.y) && active.y >= -4 &&
      active.shape.length === shapes[active.kind].length &&
      active.shape.every(row => typeof row === 'string' && row.length === active.shape.length && /^[01]+$/.test(row)) &&
      cells(active).length === 4 && fits(board, active)) return saved
  } catch {}
}

let savedRun = loadRun()
let game = new Game()
let state: 'ready' | 'playing' | 'paused' | 'over' = 'ready'
let lastFall = 0
let repeat: { pointer: number; action: string; at: number } | undefined

function block(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, kind: Kind, ghost = false) {
  ctx.fillStyle = colors[kind]
  if (ghost) {
    ctx.globalAlpha = .22
    ctx.fillRect(x + 2, y + 2, size - 4, size - 4)
    ctx.globalAlpha = 1
    return
  }
  ctx.fillRect(x + 1, y + 1, size - 2, size - 2)
  ctx.fillStyle = '#ffffff45'
  ctx.fillRect(x + 3, y + 3, size - 6, 3)
  ctx.fillStyle = '#100a3035'
  ctx.fillRect(x + 1, y + size - 5, size - 2, 4)
}

function render() {
  const ctx = board.getContext('2d')!
  const size = board.width / WIDTH
  ctx.fillStyle = '#110e21'
  ctx.fillRect(0, 0, board.width, board.height)
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      ctx.strokeStyle = '#262039'
      ctx.strokeRect(x * size + .5, y * size + .5, size, size)
      const kind = game.board[y][x]
      if (kind) block(ctx, x * size, y * size, size, kind)
    }
  }
  if (state !== 'ready' && !game.over) {
    for (const [x, y] of cells(game.landing())) block(ctx, x * size, y * size, size, game.active.kind, true)
    for (const [x, y] of cells(game.active)) block(ctx, x * size, y * size, size, game.active.kind)
  }

  const nextContext = preview.getContext('2d')!
  nextContext.clearRect(0, 0, preview.width, preview.height)
  if (state !== 'ready') {
    const positions = cells({ ...spawn(game.next), x: 0, y: 0 })
    const xs = positions.map(([x]) => x)
    const ys = positions.map(([, y]) => y)
    const unit = 20
    const left = (preview.width - (Math.max(...xs) + Math.min(...xs) + 1) * unit) / 2
    const top = (preview.height - (Math.max(...ys) + Math.min(...ys) + 1) * unit) / 2
    for (const [x, y] of positions) block(nextContext, left + x * unit, top + y * unit, unit, game.next)
  }
  if (game.score > best) {
    best = game.score
    try { localStorage.setItem(storageKey, String(best)) } catch {}
  }
  for (const [id, value] of Object.entries({ score: game.score, best, level: game.level, lines: game.lines })) {
    element(id).textContent = String(value)
  }
}

function saveRun() {
  try {
    if (game.over) localStorage.removeItem(saveKey)
    else localStorage.setItem(saveKey, JSON.stringify(game.snapshot()))
  } catch {}
}

function updateState(focus = true) {
  overlay.hidden = state === 'playing'
  pause.disabled = state === 'ready' || state === 'over'
  pause.textContent = state === 'paused' ? 'Resume' : 'Pause'
  const canContinue = state === 'ready' && Boolean(savedRun)
  newGame.hidden = !canContinue
  start.textContent = canContinue ? 'Continue' : state === 'paused' ? 'Resume' : state === 'over' ? 'Play again' : 'Play'
  status.textContent = state === 'over' ? 'Game over' : state === 'paused' ? 'Paused' : 'Ready?'
  for (const button of controls) button.disabled = state !== 'playing'
  if (state !== 'playing') repeat = undefined
  if (focus) (state === 'playing' ? pause : start).focus({ preventScroll: true })
  render()
}

function play() {
  if (state === 'ready' || state === 'over') game = new Game()
  state = 'playing'
  savedRun = undefined
  saveRun()
  lastFall = performance.now()
  updateState()
}

function togglePause() {
  if (state === 'paused') play()
  else if (state === 'playing') {
    state = 'paused'
    updateState()
  }
}

function afterMove() {
  saveRun()
  if (game.over) {
    state = 'over'
    updateState()
  } else render()
}

function act(action: string) {
  if (state !== 'playing') return
  switch (action) {
    case 'left': game.move(-1, 0); break
    case 'right': game.move(1, 0); break
    case 'turn': game.turn(); break
    case 'reverse': game.turn(-1); break
    case 'down': game.step(true); lastFall = performance.now(); break
    case 'drop': game.drop(); lastFall = performance.now(); break
  }
  afterMove()
}

start.addEventListener('click', () => {
  if (state === 'ready' && savedRun) {
    game = savedRun
    savedRun = undefined
    state = 'paused'
    updateState()
  } else play()
})
newGame.addEventListener('click', () => {
  if (window.confirm('Replace your saved game with a new game?')) play()
})
pause.addEventListener('click', togglePause)
const keys = new Map([
  ['ArrowLeft', 'left'], ['ArrowRight', 'right'], ['ArrowDown', 'down'],
  ['ArrowUp', 'turn'], ['z', 'reverse'], [' ', 'drop'],
])
window.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey) return
  const key = event.key.toLowerCase()
  if (key === 'p' || key === 'escape') {
    if (!event.repeat) togglePause()
    return
  }
  if (state !== 'playing') return
  const action = keys.get(event.key) ?? keys.get(key)
  if (!action) return
  event.preventDefault()
  if (!event.repeat || ['left', 'right', 'down'].includes(action)) act(action)
})
for (const button of controls) {
  const action = button.dataset.action!
  button.addEventListener('click', event => {
    if (event.detail === 0) act(action)
  })
  button.addEventListener('pointerdown', event => {
    if (event.button !== 0 || state !== 'playing') return
    button.setPointerCapture(event.pointerId)
    if (['left', 'right', 'down'].includes(action)) {
      repeat = { pointer: event.pointerId, action, at: performance.now() + 210 }
    }
    act(action)
  })
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    button.addEventListener(type, event => {
      if ((event as PointerEvent).pointerId === repeat?.pointer) repeat = undefined
    })
  }
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden && state === 'playing') togglePause()
})

function frame(now: number) {
  if (state === 'playing' && repeat && now >= repeat.at) {
    repeat.at = now + 65
    act(repeat.action)
  }
  if (state === 'playing' && now - lastFall >= game.interval) {
    lastFall = now
    game.step()
    afterMove()
  }
  requestAnimationFrame(frame)
}
updateState(false)
requestAnimationFrame(frame)

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(error => console.warn('Offline setup failed', error))
}
