export const WIDTH = 10
export const HEIGHT = 20

export const shapes = {
  I: ['0000', '1111', '0000', '0000'],
  J: ['100', '111', '000'],
  L: ['001', '111', '000'],
  O: ['11', '11'],
  S: ['011', '110', '000'],
  T: ['010', '111', '000'],
  Z: ['110', '011', '000'],
}
export type Kind = keyof typeof shapes
export type Board = (Kind | null)[][]
export type Piece = { kind: Kind; shape: string[]; x: number; y: number }

const emptyRow = () => Array<Kind | null>(WIDTH).fill(null)
export const newBoard = (): Board => Array.from({ length: HEIGHT }, emptyRow)
export function spawn(kind: Kind): Piece {
  const shape = shapes[kind]
  return { kind, shape, x: Math.floor((WIDTH - shape.length) / 2), y: kind === 'I' ? -1 : 0 }
}

export function cells(piece: Piece): [number, number][] {
  return piece.shape.flatMap((row, y) => Array.from(row).flatMap((cell, x) =>
    cell === '1' ? [[piece.x + x, piece.y + y] as [number, number]] : []))
}

export function fits(board: Board, piece: Piece) {
  return cells(piece).every(([x, y]) =>
    x >= 0 && x < WIDTH && y < HEIGHT && (y < 0 || board[y][x] === null))
}

export function rotate(board: Board, piece: Piece, direction: 1 | -1): Piece {
  if (piece.kind === 'O') return piece
  const n = piece.shape.length
  const shape = piece.shape.map((row, y) => Array.from(row, (_, x) =>
    direction === 1 ? piece.shape[n - 1 - x][y] : piece.shape[x][n - 1 - y]).join(''))
  for (const [dx, dy] of [[0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0], [0, -1], [0, -2]]) {
    const candidate = { ...piece, shape, x: piece.x + dx, y: piece.y + dy }
    if (fits(board, candidate)) return candidate
  }
  return piece
}

export function clearLines(board: Board) {
  const remaining = board.filter(row => row.includes(null))
  const count = HEIGHT - remaining.length
  return { board: [...Array.from({ length: count }, emptyRow), ...remaining], count }
}

export class Game {
  board = newBoard()
  score = 0
  lines = 0
  over = false
  active: Piece
  next: Kind
  private bag: Kind[] = []

  constructor(private random = Math.random) {
    this.active = spawn(this.draw())
    this.next = this.draw()
  }

  snapshot() {
    return {
      board: this.board, score: this.score, lines: this.lines,
      active: this.active, next: this.next, bag: this.bag,
    }
  }

  static restore(saved: ReturnType<Game['snapshot']>) {
    const game = new Game()
    game.board = saved.board
    game.score = saved.score
    game.lines = saved.lines
    game.active = saved.active
    game.next = saved.next
    game.bag = saved.bag
    return game
  }

  get level() { return 1 + Math.floor(this.lines / 10) }
  get interval() { return Math.max(70, 850 * 0.82 ** (this.level - 1)) }

  private draw(): Kind {
    if (!this.bag.length) {
      this.bag = Object.keys(shapes) as Kind[]
      for (let i = this.bag.length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1))
        ;[this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]]
      }
    }
    return this.bag.pop()!
  }

  move(dx: number, dy: number) {
    const candidate = { ...this.active, x: this.active.x + dx, y: this.active.y + dy }
    if (this.over || !fits(this.board, candidate)) return false
    this.active = candidate
    return true
  }

  turn(direction: 1 | -1 = 1) {
    if (!this.over) this.active = rotate(this.board, this.active, direction)
  }

  landing() {
    let piece = this.active
    while (fits(this.board, { ...piece, y: piece.y + 1 })) {
      piece = { ...piece, y: piece.y + 1 }
    }
    return piece
  }

  step(soft = false) {
    if (this.over) return
    if (!this.move(0, 1)) this.lock()
    else if (soft) this.score++
  }

  drop() {
    if (this.over) return
    const landing = this.landing()
    this.score += 2 * (landing.y - this.active.y)
    this.active = landing
    this.lock()
  }

  private lock() {
    const occupied = cells(this.active)
    if (occupied.some(([, y]) => y < 0)) {
      this.over = true
      return
    }
    for (const [x, y] of occupied) this.board[y][x] = this.active.kind
    const result = clearLines(this.board)
    this.score += [0, 100, 300, 500, 800][result.count] * this.level
    this.lines += result.count
    this.board = result.board
    this.active = spawn(this.next)
    this.next = this.draw()
    this.over = !fits(this.board, this.active)
  }
}
