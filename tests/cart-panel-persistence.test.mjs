import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8').replace(/\r\n/g, '\n')
const cart = read('src/components/display/CartPanel.vue')
const center = read('src/components/display/CenterFunctionPanel.vue')

test('cart slots remain mounted while full and order feedback is visible', () => {
  assert.match(cart, /<div class="item-group" :class="\{ 'has-status': Boolean\(tipsType\) \}">/)
  assert.doesNotMatch(cart, /class="item-group" v-if="!tipsType"/)
  assert.match(cart, /Status feedback occupies only the order position/)
  assert.match(cart, /\.cart-section\.cart-section--left \.tips-overlay \{ left: auto; right: 20px; \}/)
  assert.match(cart, /\.cart-section\.cart-section--right \.tips-overlay \{ left: 20px; right: auto; \}/)
  assert.match(cart, /'is-feedback-hidden': Boolean\(tipsType\)/)
  assert.match(cart, /inset 0 0 0 999px #173b34/)
})

test('full and success states remain accessible without replacing cart content', () => {
  assert.match(cart, /aria-live="polite"/)
  assert.match(cart, /cart\.fullStatus/)
  assert.match(cart, /cart\.orderPlacedStatus/)
  assert.match(cart, /:disabled="tipsType === 'order_meal'"/)
})

test('Midnight has three framed shared panels and recognizable icon skins', () => {
  assert.match(cart, /\[data-theme="midnight-station"\] \.is-midnight-cart/)
  assert.match(cart, /border-radius: 16px/)
  assert.match(center, /\[data-theme="midnight-station"\] \.bottom-center/)
  assert.match(center, /icons\/menu\.svg/)
  assert.match(center, /icons\/search\.svg/)
  assert.match(center, /icons\/history\.svg/)
  assert.match(center, /icons\/settings\.svg/)
  assert.match(center, /icons\/bell\.svg/)
})
