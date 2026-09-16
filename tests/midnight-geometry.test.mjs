import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const display = source('src/views/display/ConveyorBeltDisplay.vue')
const cart = source('src/components/display/CartPanel.vue')
const center = source('src/components/display/CenterFunctionPanel.vue')

// Browser measurements and screenshots remain the visual acceptance evidence.
test('Midnight progress is viewport-centered, not centered in an asymmetric grid column', () => {
  assert.match(display, /\.top-progress \{ position: absolute; top: 38px; left: 50%;[^}]*transform: translateX\(-50%\)/)
  assert.doesNotMatch(display, /\.top-progress[^}]*grid-column: 2/)
})

test('Midnight does not restore oversized panel geometry or whole counter rear assets', () => {
  for (const text of [display, cart, center]) {
    assert.doesNotMatch(text, /height: (300|320|220|230)px/)
    assert.doesNotMatch(text, /cart-counter-(?:left|right|\$\{side\})-v3|service-console-v3/)
    assert.doesNotMatch(text, /MIDNIGHT_(?:CART|CONSOLE).*ANCHORS/)
  }
})

test('Shared cart order and two-row center controls remain intact', () => {
  assert.match(cart, /side ==='left' \? '1' : '0'/)
  assert.match(cart, /v-for="\(item, index\) in items"/)
  assert.equal((center.match(/<button /g) || []).length, 6)
  assert.match(center, /function-row first-row/)
  assert.match(center, /function-row second-row/)
})
