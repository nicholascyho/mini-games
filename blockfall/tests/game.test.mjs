import test from 'node:test'
import assert from 'node:assert/strict'
import { cells, clearLines, fits, Game, newBoard, rotate, spawn } from '../.test-build/game.js'

test('board dimensions and distinct rows', () => {
  const board = newBoard()
  assert.equal(board.length, 20)
  assert.ok(board.every(row => row.length === 10))
  board[0][0] = 'O'
  assert.equal(board[1][0], null)
})

test('each bag contains all seven pieces, with four cells each', () => {
  const game = new Game(() => 0)
  for (let bag = 0; bag < 2; bag++) {
    const kinds = new Set()
    for (let index = 0; index < 7; index++) {
      const expectedNext = game.next
      kinds.add(game.active.kind)
      assert.equal(cells(game.active).length, 4)
      game.board = newBoard()
      game.drop()
      assert.equal(game.active.kind, expectedNext)
    }
    assert.equal(kinds.size, 7)
  }
})

test('collision handles the walls, floor and settled blocks', () => {
  const board = newBoard()
  assert.equal(fits(board, { ...spawn('O'), x: -1 }), false)
  assert.equal(fits(board, { ...spawn('O'), x: 9 }), false)
  assert.equal(fits(board, { ...spawn('O'), y: 19 }), false)
  const piece = spawn('O')
  board[0][piece.x] = 'I'
  assert.equal(fits(board, piece), false)
})

test('rotation reverses and can kick away from the wall', () => {
  const board = newBoard()
  const piece = { ...spawn('T'), y: 5 }
  const vertical = rotate(board, piece, 1)
  assert.deepEqual(rotate(board, vertical, -1), piece)
  const atWall = { ...vertical, x: -1 }
  assert.ok(fits(board, atWall))
  const kicked = rotate(board, atWall, -1)
  assert.equal(kicked.x, 0)
  assert.ok(fits(board, kicked))
})

test('line clearing preserves the order of the other rows', () => {
  const board = newBoard()
  board[17][3] = 'T'
  board[18].fill('I')
  board[19].fill('O')
  const result = clearLines(board)
  assert.equal(result.count, 2)
  assert.equal(result.board[19][3], 'T')
  assert.ok(result.board[0].every(cell => cell === null))
})

test('soft drop, hard drop, four-line scoring and level speed', () => {
  const game = new Game()
  game.active = spawn('O')
  game.step(true)
  assert.equal(game.score, 1)
  const distance = game.landing().y - game.active.y
  game.drop()
  assert.equal(game.score, 1 + distance * 2)
  game.board = newBoard()
  game.score = 0
  game.lines = 9
  game.active = { ...rotate(game.board, spawn('I'), 1), x: 2, y: 16 }
  for (let y = 16; y < 20; y++) {
    game.board[y].fill('J')
    game.board[y][4] = null
  }
  const interval = game.interval
  game.drop()
  assert.equal(game.score, 800)
  assert.equal(game.lines, 13)
  assert.equal(game.level, 2)
  assert.ok(game.interval < interval)
})

test('a blocked spawn ends the game and stops movement', () => {
  const game = new Game()
  game.active = { ...spawn('O'), x: 0 }
  game.next = 'O'
  game.board[0][4] = 'L'
  game.drop()
  assert.equal(game.over, true)
  assert.equal(game.move(1, 0), false)
  const score = game.score
  game.drop()
  assert.equal(game.score, score)
})

test('a saved run restores the board, active piece and bag order', () => {
  const game = new Game(() => 0)
  game.drop()
  game.turn()
  game.move(-1, 0)
  game.step(true)
  const restored = Game.restore(JSON.parse(JSON.stringify(game.snapshot())))
  assert.deepEqual(restored.snapshot(), game.snapshot())
  for (let index = 0; index < 3; index++) {
    game.drop()
    restored.drop()
    assert.deepEqual(restored.snapshot(), game.snapshot())
  }
})
