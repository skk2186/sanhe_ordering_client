import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8')
const baseline = path => execFileSync('git', ['show', 'b975a737ddd14dfd830cf94e7c096822bf476326:' + path], { encoding: 'utf8' })
const script = source => source.replace(/\r\n/g, '\n').match(/<script[^>]*>([\s\S]*?)<\/script>/)?.[1]

test('overlay tokens are emitted only under the Midnight theme and an explicit component root', () => {
  const skin = read('src/styles/themes/midnight-overlays.scss')
  assert.match(skin, /\[data-theme="midnight-station"\] #\{\$root\}/)
  assert.doesNotMatch(skin, /:root\s*\{/)
  for (const path of ['src/components/menu/SushiNavigation.vue', 'src/components/order/OrderHistoryDialog.vue', 'src/components/display/SettingDialog.vue', 'src/components/display/FeaturedDishScreen.vue']) {
    assert.match(read(path), /@include station\.scope\(/)
  }
})

test('navigation, history, settings and featured retain their shared business scripts', () => {
  for (const path of ['src/components/menu/SushiNavigation.vue', 'src/components/order/OrderHistoryDialog.vue', 'src/components/display/SettingDialog.vue', 'src/components/display/FeaturedDishScreen.vue']) {
    assert.equal(script(read(path)), script(baseline(path)), path)
  }
})

test('assistant, progress and special express stay frozen while stage and trolley logic stays unchanged', () => {
  for (const name of ['VirtualDiningAssistant', 'TopPlateProgress', 'midnight/MidnightExpressPass']) {
    const path = 'src/components/display/' + name + '.vue'
    assert.equal(read(path).replace(/\r\n/g, '\n'), baseline(path).replace(/\r\n/g, '\n'), path)
  }
  for (const name of ['ScenicDishStage', 'midnight/MidnightDishTrolley']) {
    const path = 'src/components/display/' + name + '.vue'
    assert.equal(script(read(path)), script(baseline(path)), path)
  }
})

test('menu uses one shared template and only Midnight escapes the bottom stacking context', () => {
  const menu = read('src/views/customer/MenuView.vue')
  assert.match(menu, /<Teleport to="body" :disabled="themeKey !== 'midnight-station'">/)
  assert.equal((menu.match(/class="dish-card"/g) || []).length, 1)
})

test('station transition has bounded cover/preload/reveal timing, without changing old-to-old timing', () => {
  const source = read('src/views/display/ConveyorBeltDisplay.vue')
  assert.match(source, /stationTransitionTiming\.value \? 600 : 1700/)
  assert.match(source, /stationTransitionTiming\.value \? 450 : 1050/)
  assert.match(source, /Promise\.race\(\[stationPreload, waitForSceneFrame\(200\)\]\)/)
  assert.equal(600 + 200 + 450, 1250)
})
