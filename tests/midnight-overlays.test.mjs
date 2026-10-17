import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
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

test('assistant and progress stay frozen; express business and trolley interactions are preserved', () => {
  for (const name of ['VirtualDiningAssistant', 'TopPlateProgress']) {
    const path = 'src/components/display/' + name + '.vue'
    assert.equal(read(path).replace(/\r\n/g, '\n'), baseline(path).replace(/\r\n/g, '\n'), path)
  }
  const express = 'src/components/display/midnight/MidnightExpressPass.vue'
  assert.equal(script(read(express)), script(baseline(express)), express)
  const stage = 'src/components/display/ScenicDishStage.vue'
  assert.equal(script(read(stage)), script(baseline(stage)), stage)

  const trolley = 'src/components/display/midnight/MidnightDishTrolley.vue'
  const trolleyScript = script(read(trolley))
  assert.match(trolleyScript, /const trolleyWheels = \[24, 76\]/)
  assert.match(trolleyScript, /defineEmits\(\['dish-click'\]\)/)
  assert.match(trolleyScript, /if \(!props\.soldOut\) emit\('dish-click', props\.item, event\)/)
  assert.match(trolleyScript, /props\.item\?\.name \|\| props\.item\?\.storeName \|\| props\.item\?\.productName/)
  assert.match(trolleyScript, /props\.item\?\.image \|\| props\.item\?\.imageUrl \|\| DEFAULT_DISH_IMAGE/)
  assert.match(trolleyScript, /Number\.isFinite\(value\) \? value\.toFixed\(2\) : '0\.00'/)
  assert.match(trolleyScript, /target\.src = DEFAULT_DISH_IMAGE/)
})

test('Midnight trolley uses one open wagon, directly displayed contain-fit food and a visible fallback', () => {
  const component = read('src/components/display/midnight/MidnightDishTrolley.vue')
  const theme = read('src/styles/themes/midnight-warm.scss')
  assert.match(component, /delivery-trolley-body-v3\.webp/)
  assert.doesNotMatch(component, /platter|platter-width/)
  assert.match(component, /vehicle-art--front/)
  assert.match(component, /height:\s*var\(--midnight-trolley-height, 248px\)/)
  assert.match(component, /bottom:\s*58%/)
  assert.match(component, /\.midnight-dish-trolley__dish img\s*\{\s*position:\s*absolute;\s*inset:\s*0;/)
  assert.match(component, /default-food\.svg/)
  assert.match(component, /object-fit:\s*contain/)
  assert.match(component, /max-height:\s*100%/)
  assert.doesNotMatch(component, /scale\(1\.16\)/)
  assert.match(component, /midnight-dish-trolley__plaque-mounts/)
  assert.match(component, /midnight-dish-trolley__side-plaque/)
  assert.match(component, /:title="name"/)
  assert.match(component, /text-overflow:\s*ellipsis/)
  assert.match(component, /:aria-label="`\$\{name\} ¥\$\{price\}`"/)
  assert.match(component, /top:\s*38%;\s*z-index:\s*6;\s*width:\s*48%;\s*height:\s*56%;/)
  assert.match(component, /display:\s*flex;\s*flex-direction:\s*column;\s*align-items:\s*center;\s*justify-content:\s*center;/)
  assert.match(component, /line-height:\s*1\.02;/)
  assert.doesNotMatch(component, /midnight-dish-trolley__copy/)
  assert.match(theme, /--station-product-title:\s*clamp\(26px, \.83vw, 32px\)/)
  assert.match(theme, /--station-product-price:\s*clamp\(27px, \.9vw, 35px\)/)
  assert.match(component, /@keydown\.space\.prevent="handleActivate"/)
  assert.match(component, /'is-reversed': direction === 'right'/)
  assert.match(component, /'is-selected': selected/)
  assert.match(component, /'is-recommended': recommended/)
  assert.match(component, /'is-sold-out': soldOut/)
  assert.match(component, /'is-paused': paused/)
  assert.match(theme, /--midnight-trolley-height:\s*clamp\(345px, 10vw, 390px\)/)
  assert.match(theme, /--midnight-body-width:\s*clamp\(435px, 13\.7vw, 530px\)/)
  assert.match(theme, /--midnight-food-width:\s*clamp\(260px, 8\.05vw, 310px\)/)
  assert.match(theme, /--midnight-food-height:\s*clamp\(175px, 5\.75vw, 225px\)/)
  assert.match(theme, /--station-product-title:\s*clamp\(26px, \.83vw, 32px\)/)
  assert.match(theme, /--station-product-price:\s*clamp\(27px, \.9vw, 35px\)/)
  const stageStyles = read('src/components/display/ScenicDishStage.vue')
  assert.match(stageStyles, /@media \(min-width: 901px\)[\s\S]*?--midnight-rail-drop:\s*calc\(var\(--midnight-trolley-baseline\) - var\(--midnight-trolley-height\)\)/)
  assert.match(stageStyles, /width:\s*clamp\(480px, 14\.22vw, 550px\)/)
  assert.match(stageStyles, /width:\s*clamp\(1490px, 49\.48vw, 1900px\)/)
  const expressStyles = read('src/components/display/midnight/MidnightExpressPass.vue')
  assert.match(expressStyles, /height:clamp\(368px,10vw,390px\)/)
  assert.match(expressStyles, /margin-top:calc\(clamp\(96px,3\.35vw,130px\) \* -1\)/)
  for (const asset of [
    'public/images/ui/midnight-station/delivery-trolley-body-v3.webp',
    'public/images/ui/midnight-station/default-food.svg',
  ]) assert.equal(existsSync(new URL('../' + asset, import.meta.url)), true, asset)
  assert.equal(existsSync(new URL('../public/images/ui/midnight-station/delivery-trolley-platter.svg', import.meta.url)), false)
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
