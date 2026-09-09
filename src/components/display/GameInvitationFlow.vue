<template>
  <Teleport to="body">
    <div class="game-flow-root">
      <Transition name="game-layer">
        <section
          v-if="stage === 'invitation' || stage === 'minimizing'"
          ref="invitationRef"
          class="game-invitation"
          :class="{ 'is-minimizing': stage === 'minimizing' }"
          :style="flyStyle"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="invitationTitleId"
        >
          <div class="game-invitation__icon" aria-hidden="true">
            <el-icon><Trophy /></el-icon>
          </div>
          <p class="game-flow-kicker">{{ $t('games.invitation.kicker') }}</p>
          <h2 :id="invitationTitleId">{{ $t('games.invitation.title') }}</h2>
          <p class="game-invitation__message">{{ $t('games.invitation.message') }}</p>
          <p class="game-invitation__credits">
            {{ $t('games.invitation.available', { count: credits }) }}
          </p>
          <div class="game-invitation__actions">
            <button type="button" class="game-flow-button game-flow-button--primary" @click="acceptInvitation">
              <el-icon><VideoPlay /></el-icon>
              {{ $t('games.invitation.yes') }}
            </button>
            <button type="button" class="game-flow-button game-flow-button--quiet" @click="declineInvitation">
              {{ $t('games.invitation.no') }}
            </button>
          </div>
        </section>
      </Transition>

      <Transition name="game-layer">
        <section
          v-if="stage === 'picker'"
          class="game-picker"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="pickerTitleId"
        >
          <header class="game-picker__header">
            <div>
              <p class="game-flow-kicker">{{ $t('games.invitation.kicker') }}</p>
              <h2 :id="pickerTitleId">{{ $t('games.invitation.chooseTitle') }}</h2>
            </div>
            <button
              type="button"
              class="game-icon-button"
              :aria-label="$t('common.back')"
              :title="$t('common.back')"
              @click="returnToReminder"
            >
              <el-icon><ArrowLeft /></el-icon>
            </button>
          </header>

          <div class="game-picker__grid">
            <button
              v-for="game in gameConfigs"
              :key="game.id"
              type="button"
              class="game-choice"
              @click="startGame(game)"
            >
              <img :src="game.cover" :alt="t(game.titleKey)">
              <span class="game-choice__body">
                <strong>{{ t(game.titleKey) }}</strong>
                <span>{{ t(game.descriptionKey) }}</span>
                <span class="game-choice__play"><el-icon><VideoPlay /></el-icon>{{ $t('games.play') }}</span>
              </span>
            </button>
          </div>
        </section>
      </Transition>

      <Transition name="reminder-pop">
        <button
          v-if="stage === 'reminder' && credits > 0"
          type="button"
          class="game-reminder"
          :aria-label="$t('games.invitation.reminder', { count: credits })"
          :title="$t('games.invitation.reminder', { count: credits })"
          @click="openReminderInvitation"
        >
          <el-icon><WarningFilled /></el-icon>
          <span class="game-reminder__count">{{ credits }}</span>
        </button>
      </Transition>

      <div v-if="stage === 'playing' && selectedGame" class="game-stage-overlay" role="dialog" aria-modal="true">
        <component
          :is="selectedGame.component"
          :key="selectedGame.id"
          :best-score="selectedGame.bestScore"
          @start="handleGameStart"
          @score-change="handleGameScoreChange"
          @finish="handleGameFinish"
          @close="handleGameClose"
        />
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { ArrowLeft, Trophy, VideoPlay, WarningFilled } from '@element-plus/icons-vue'
import { useI18n } from '@/i18n'
import { createGameConfigs } from '@/config/games'

const emit = defineEmits(['blocking-change'])
const { t } = useI18n()

const invitationTitleId = 'game-invitation-title'
const pickerTitleId = 'game-picker-title'
const gameConfigs = ref(createGameConfigs())
const credits = ref(0)
const stage = ref('idle')
const selectedGame = ref(null)
const invitationRef = ref(null)
const flyStyle = ref({})
let minimizeTimer = null
let autoCloseTimer = null

const isBlocking = computed(() => ['invitation', 'minimizing', 'picker', 'playing'].includes(stage.value))

const clearTimer = (timerName) => {
  if (timerName === 'minimize' && minimizeTimer) {
    clearTimeout(minimizeTimer)
    minimizeTimer = null
  }
  if (timerName === 'close' && autoCloseTimer) {
    clearTimeout(autoCloseTimer)
    autoCloseTimer = null
  }
}

const grantCredit = () => {
  credits.value += 1
  if (stage.value === 'idle' || stage.value === 'reminder') stage.value = 'invitation'
}

const openReminderInvitation = () => {
  if (credits.value > 0) stage.value = 'invitation'
}

const acceptInvitation = () => {
  if (stage.value !== 'invitation' || credits.value <= 0) return
  stage.value = 'picker'
}

const getMinimizeStyle = async () => {
  await nextTick()
  const element = invitationRef.value
  if (!element) return
  const rect = element.getBoundingClientRect()
  const targetX = window.innerWidth - 44
  const targetY = 38
  const scale = Math.min(0.18, 48 / Math.max(rect.width, rect.height))
  flyStyle.value = {
    '--fly-x': `${targetX - (rect.left + rect.width / 2)}px`,
    '--fly-y': `${targetY - (rect.top + rect.height / 2)}px`,
    '--fly-scale': scale
  }
}

const declineInvitation = async () => {
  if (stage.value !== 'invitation') return
  await getMinimizeStyle()
  stage.value = 'minimizing'
  clearTimer('minimize')
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  minimizeTimer = window.setTimeout(() => {
    if (stage.value === 'minimizing') {
      stage.value = 'reminder'
      flyStyle.value = {}
    }
    minimizeTimer = null
  }, reducedMotion ? 20 : 760)
}

const returnToReminder = () => {
  stage.value = credits.value > 0 ? 'reminder' : 'idle'
}

const startGame = (game) => {
  if (!game || credits.value <= 0) return
  credits.value -= 1
  selectedGame.value = game
  stage.value = 'playing'
}

const findGame = (id) => gameConfigs.value.find((game) => game.id === id)

const handleGameStart = ({ id }) => {
  clearTimer('close')
  const game = findGame(id)
  if (game) game.status = 'playing'
}

const handleGameScoreChange = ({ id, score }) => {
  const game = findGame(id)
  if (game && score > game.bestScore) game.bestScore = score
}

const handleGameFinish = ({ id, bestScore }) => {
  const game = findGame(id)
  if (game) {
    game.status = 'finished'
    game.bestScore = Math.max(game.bestScore, Number(bestScore) || 0)
  }
  clearTimer('close')
  // 游戏组件先展示自己的结算态，再自动退回传送带。
  autoCloseTimer = window.setTimeout(() => closeGame(), 2800)
}

const closeGame = () => {
  clearTimer('close')
  const game = selectedGame.value
  if (game) {
    game.bestScore = Math.max(game.bestScore, Number(localStorage.getItem(game.storageKey)) || 0)
    game.status = 'ready'
  }
  selectedGame.value = null
  stage.value = credits.value > 0 ? 'reminder' : 'idle'
}

const handleGameClose = () => closeGame()

watch(stage, () => emit('blocking-change', isBlocking.value), { immediate: true })

onBeforeUnmount(() => {
  clearTimer('minimize')
  clearTimer('close')
})

defineExpose({ grantCredit })
</script>

<style lang="scss" scoped>
.game-flow-root {
  position: relative;
  z-index: 5000;
  pointer-events: none;
}

.game-invitation,
.game-picker {
  position: fixed;
  left: 50%;
  top: 50%;
  box-sizing: border-box;
  width: min(480px, calc(100vw - 32px));
  padding: 30px;
  transform: translate(-50%, -50%);
  border: 1px solid rgba(77, 157, 171, .36);
  border-radius: 12px;
  background: #fffdf8;
  color: #173944;
  box-shadow: 0 24px 70px rgba(14, 53, 63, .32);
  pointer-events: auto;
}

.game-invitation { text-align: center; transition: transform .76s cubic-bezier(.2, .8, .2, 1), opacity .76s ease, border-radius .76s ease; }
.game-invitation.is-minimizing {
  transform: translate(calc(-50% + var(--fly-x)), calc(-50% + var(--fly-y))) scale(var(--fly-scale));
  opacity: .12;
  border-radius: 50%;
}

.game-invitation__icon {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  border-radius: 50%;
  background: #f5c451;
  color: #6b4910;
  font-size: 30px;
}

.game-flow-kicker { margin: 0 0 8px; color: #a06b1e; font-size: 12px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
.game-invitation h2,
.game-picker h2 { margin: 0; font-size: clamp(22px, 3vw, 30px); letter-spacing: 0; }
.game-invitation__message { margin: 14px 0 8px; color: #47636b; line-height: 1.6; }
.game-invitation__credits { margin: 0; color: #a06b1e; font-size: 13px; font-weight: 700; }
.game-invitation__actions { display: flex; gap: 12px; margin-top: 24px; }

.game-flow-button,
.game-icon-button,
.game-choice,
.game-reminder { font: inherit; cursor: pointer; }
.game-flow-button { flex: 1; min-height: 46px; border: 1px solid transparent; border-radius: 7px; font-weight: 800; }
.game-flow-button--primary { display: inline-flex; align-items: center; justify-content: center; gap: 8px; background: #e9755f; color: #fff; }
.game-flow-button--quiet { border-color: #d6e4e4; background: #eef6f5; color: #47636b; }
.game-flow-button:focus-visible,
.game-icon-button:focus-visible,
.game-choice:focus-visible,
.game-reminder:focus-visible { outline: 3px solid rgba(233, 117, 95, .42); outline-offset: 3px; }

.game-picker { width: min(920px, calc(100vw - 32px)); padding: 24px; }
.game-picker__header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
.game-icon-button { display: grid; place-items: center; flex: 0 0 42px; width: 42px; height: 42px; border: 1px solid #d6e4e4; border-radius: 50%; background: #f4f9f8; color: #47636b; font-size: 20px; }
.game-picker__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.game-choice { display: grid; grid-template-rows: 170px 1fr; min-width: 0; overflow: hidden; padding: 0; border: 1px solid #d6e4e4; border-radius: 8px; background: #fff; color: #173944; text-align: left; transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease; }
.game-choice:hover { transform: translateY(-3px); border-color: #e9755f; box-shadow: 0 12px 26px rgba(14, 53, 63, .14); }
.game-choice > img { display: block; width: 100%; height: 100%; object-fit: cover; }
.game-choice__body { display: grid; gap: 8px; padding: 16px; }
.game-choice__body strong { font-size: 20px; }
.game-choice__body > span:not(.game-choice__play) { color: #59747a; font-size: 13px; line-height: 1.5; }
.game-choice__play { display: inline-flex; align-items: center; gap: 6px; color: #d45e4a; font-weight: 800; }

.game-reminder { position: fixed; top: 16px; right: 20px; display: grid; place-items: center; width: 52px; height: 52px; border: 2px solid #fff; border-radius: 50%; background: #e9755f; color: #fff; box-shadow: 0 9px 22px rgba(14, 53, 63, .28); font-size: 24px; pointer-events: auto; animation: reminder-pulse 2.2s ease-in-out infinite; }
.game-reminder__count { position: absolute; right: -6px; top: -7px; display: grid; place-items: center; min-width: 22px; height: 22px; padding: 0 4px; box-sizing: border-box; border: 2px solid #fff; border-radius: 999px; background: #173944; color: #fff; font-size: 11px; font-weight: 800; }

.game-stage-overlay { position: fixed; inset: 0; z-index: 5100; display: flex; align-items: center; justify-content: center; padding: 0; box-sizing: border-box; overflow: auto; background: rgba(18, 23, 28, .86); pointer-events: auto; }
.game-layer-enter-active, .game-layer-leave-active { transition: opacity .22s ease, transform .22s ease; }
.game-layer-enter-from, .game-layer-leave-to { opacity: 0; transform: translate(-50%, calc(-50% + 12px)); }
.reminder-pop-enter-active, .reminder-pop-leave-active { transition: opacity .3s ease, transform .3s ease; }
.reminder-pop-enter-from, .reminder-pop-leave-to { opacity: 0; transform: translateY(-12px) scale(.75); }

@keyframes reminder-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.06); } }

@media (max-width: 680px) {
  .game-invitation, .game-picker { padding: 22px; }
  .game-picker__grid { grid-template-columns: 1fr; }
  .game-choice { grid-template-columns: 112px minmax(0, 1fr); grid-template-rows: 132px; }
  .game-choice__body { padding: 12px; }
  .game-choice__body strong { font-size: 17px; }
}

@media (prefers-reduced-motion: reduce) {
  .game-invitation, .game-choice, .game-reminder { transition: none; animation: none; }
}
</style>
