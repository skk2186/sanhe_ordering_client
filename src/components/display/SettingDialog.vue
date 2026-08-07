<template>
  <el-dialog
      v-model="visible"
      :title="copy.systemSettings"
      width="min(1300px, 94vw)"
      center
      :close-on-click-modal="!selectedGame"
      :close-on-press-escape="!selectedGame"
  >
    <!-- 设置选项卡 -->
    <el-tabs v-model="activeTab" class="setting-tabs">
      <!-- 主题设置选项卡 -->
      <el-tab-pane :label="copy.themeSettings" name="theme">
        <div class="theme-item">
          <div
              class="theme-card"
              v-for="(item, index) in themeItem"
              :key="item.key"
              @click="selectTheme(item)"
              :class="{ 'theme-card--active': selectedThemeKey === item.key }"
          >
            <!-- 选中状态标识 -->
            <div class="theme-card__check" v-if="selectedThemeKey === item.key">
              <el-icon><Check /></el-icon>
            </div>
            <img :src="item.img" :alt="copy.themeBackground" class="theme-card__img">
            <div class="theme-card__title">{{ item.title }}</div>
            <div class="theme-card__key">{{ item.key }}</div>
          </div>
        </div>

        <section class="language-settings" aria-labelledby="language-settings-title">
          <h3 id="language-settings-title" class="section-title">{{ copy.languageSettings }}</h3>
          <div class="language-options" role="group" :aria-label="copy.languageSettings">
            <el-button
                v-for="language in languageOptions"
                :key="language.code"
                class="language-button"
                :type="currentLanguage === language.code ? 'primary' : 'default'"
                :aria-pressed="currentLanguage === language.code"
                @click="selectLanguage(language.code)"
            >
              <el-icon v-if="currentLanguage === language.code"><Check /></el-icon>
              <span>{{ language.label }}</span>
            </el-button>
          </div>
        </section>
      </el-tab-pane>

      <!-- 游戏模式 -->
      <el-tab-pane :label="copy.gameMode" name="games">
        <div class="game-slots">
          <article v-for="game in gameConfigs" :key="game.id" class="game-slot">
            <div class="game-slot__cover">
              <img :src="game.cover" :alt="t(game.titleKey)">
              <span class="game-slot__status">{{ t(`games.status.${game.status}`) }}</span>
            </div>
            <div class="game-slot__content">
              <div>
                <h3 class="game-slot__name">{{ t(game.titleKey) }}</h3>
                <p class="game-slot__description">{{ t(game.descriptionKey) }}</p>
              </div>
              <div class="game-slot__score">
                <el-icon><Trophy /></el-icon>
                <span>{{ $t('games.bestScore') }}: {{ game.bestScore }}</span>
              </div>
              <el-button class="game-slot__play" type="primary" size="large" @click="openGame(game)">
                <el-icon><VideoPlay /></el-icon>
                {{ $t('games.play') }}
              </el-button>
            </div>
          </article>
        </div>
        <p class="game-reward-note">{{ $t('games.rewardNotice') }}</p>
      </el-tab-pane>

      <!-- 传送带设置选项卡 -->
      <el-tab-pane :label="copy.voiceMode" name="voice">
        <div class="voice-settings">
          <section class="voice-setting-row">
            <div class="voice-setting-row__icon" aria-hidden="true">
              <el-icon><Microphone /></el-icon>
            </div>
            <div class="voice-setting-row__content">
              <h3>{{ copy.aiVoiceAssistant }}</h3>
              <p>{{ copy.aiVoiceAssistantDescription }}</p>
            </div>
            <div class="voice-setting-row__actions" role="group" :aria-label="copy.aiVoiceAssistant">
              <el-button
                :type="globalStore.voiceAssistantEnabled ? 'primary' : 'default'"
                :aria-pressed="globalStore.voiceAssistantEnabled"
                @click="globalStore.setVoiceAssistantEnabled(true)"
              >
                {{ copy.enable }}
              </el-button>
              <el-button
                :type="!globalStore.voiceAssistantEnabled ? 'danger' : 'default'"
                :aria-pressed="!globalStore.voiceAssistantEnabled"
                @click="globalStore.setVoiceAssistantEnabled(false)"
              >
                {{ copy.disable }}
              </el-button>
            </div>
          </section>

          <section class="voice-setting-row">
            <div class="voice-setting-row__icon" aria-hidden="true">
              <el-icon><Headset /></el-icon>
            </div>
            <div class="voice-setting-row__content">
              <h3>{{ copy.ttsVoice }}</h3>
              <p>{{ copy.ttsVoiceDescription }}</p>
            </div>
            <div class="voice-setting-row__actions" role="group" :aria-label="copy.ttsVoice">
              <el-button
                :type="globalStore.ttsEnabled ? 'primary' : 'default'"
                :aria-pressed="globalStore.ttsEnabled"
                @click="globalStore.setTtsEnabled(true)"
              >
                {{ copy.enable }}
              </el-button>
              <el-button
                :type="!globalStore.ttsEnabled ? 'danger' : 'default'"
                :aria-pressed="!globalStore.ttsEnabled"
                @click="globalStore.setTtsEnabled(false)"
              >
                {{ copy.disable }}
              </el-button>
            </div>
          </section>
        </div>
      </el-tab-pane>

      <el-tab-pane :label="copy.conveyorSettings" name="conveyor">
        <div class="conveyor-settings">
          <div class="setting-section">
            <h3 class="section-title">{{ copy.movementDirection }}</h3>
            <div class="direction-options">
              <div
                  class="direction-card"
                  :class="{ 'direction-card--active': beltDirection === 'left' }"
                  @click="setBeltDirection('left')"
              >
                <div class="direction-icon">←</div>
                <div class="direction-label">{{ copy.moveLeft }}</div>
                <div class="direction-desc">{{ copy.moveLeftDescription }}</div>
                <div class="direction-check" v-if="beltDirection === 'left'">
                  <el-icon><Check /></el-icon>
                </div>
              </div>

              <div
                  class="direction-card"
                  :class="{ 'direction-card--active': beltDirection === 'right' }"
                  @click="setBeltDirection('right')"
              >
                <div class="direction-icon">→</div>
                <div class="direction-label">{{ copy.moveRight }}</div>
                <div class="direction-desc">{{ copy.moveRightDescription }}</div>
                <div class="direction-check" v-if="beltDirection === 'right'">
                  <el-icon><Check /></el-icon>
                </div>
              </div>
            </div>
          </div>

          <div class="setting-section">
            <h3 class="section-title">{{ copy.speedSettings }}</h3>
            <div class="speed-control">
              <el-slider
                  v-model="beltSpeed"
                  :min="0.2"
                  :max="3"
                  :step="0.1"
                  :format-tooltip="formatSpeedTooltip"
                  @change="setBeltSpeed"
                  class="speed-slider"
              />
              <div class="speed-labels">
                <span>{{ copy.slow }}</span>
                <span>{{ copy.medium }}</span>
                <span>{{ copy.fast }}</span>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel" size="large">{{ copy.cancel }}</el-button>
      </div>
    </template>
  </el-dialog>

  <Teleport to="body">
    <div v-if="selectedGame" class="game-stage-overlay" role="dialog" aria-modal="true">
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
  </Teleport>
</template>

<script setup>
import { Check, Headset, Microphone, Trophy, VideoPlay } from '@element-plus/icons-vue'
import { ElDialog, ElTabs, ElTabPane, ElSlider } from "element-plus";
import { computed, ref, watchEffect } from "vue";
import { useGlobalStore } from '@/stores/global'
import { useI18n } from '@/i18n'
import { createGameConfigs } from '@/config/games'

// 定义Props和Emits
const emit = defineEmits(['update:modelValue', 'theme-changed', 'belt-direction-changed', 'belt-speed-changed', 'language-changed'])
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // 支持父组件传入默认主题key
  defaultThemeKey: { type: String, default: "zhenxian" }
})

// 弹窗显示状态（双向绑定）
const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

// 当前激活的选项卡
const activeTab = ref('theme')

const globalStore = useGlobalStore()
const { t } = useI18n()

const languageOptions = [
  { code: 'zh-CN', label: '中文' },
  { code: 'en-US', label: 'English' },
  { code: 'ja-JP', label: '日本語' }
]

const gameConfigs = ref(createGameConfigs())
const selectedGame = ref(null)

const currentLanguage = computed(() => (
  languageOptions.some(language => language.code === globalStore.language)
    ? globalStore.language
    : 'zh-CN'
))

const copy = computed(() => ({
  systemSettings: t('common.systemSettings'),
  themeSettings: t('common.themeSettings'),
  gameMode: t('common.gameMode'),
  voiceMode: t('common.voiceMode'),
  conveyorSettings: t('common.conveyorSettings'),
  themeBackground: t('settings.themeBackground'),
  languageSettings: t('common.language'),
  movementDirection: t('display.movementDirection'),
  moveLeft: t('display.moveLeft'),
  moveLeftDescription: t('display.moveLeftDescription'),
  moveRight: t('display.moveRight'),
  moveRightDescription: t('display.moveRightDescription'),
  speedSettings: t('display.speed'),
  slow: t('common.slow'),
  medium: t('common.medium'),
  fast: t('common.fast'),
  ultraFast: t('common.veryFast'),
  aiVoiceAssistant: t('settings.aiVoiceAssistant'),
  aiVoiceAssistantDescription: t('settings.aiVoiceAssistantDescription'),
  ttsVoice: t('settings.ttsVoice'),
  ttsVoiceDescription: t('settings.ttsVoiceDescription'),
  enable: t('common.enable'),
  disable: t('common.disable'),
  cancel: t('common.cancel')
}))

// 主题数据（包含key）
const themeItem = [
  { title: "AI老头", img: "/images/background22.jpg", key: "ailaotou" },
  { title: "争鲜经典", img: "/images/background1.jpg", key: 'zhenxian'},
  { title: "蜡笔小新", img: "/images/background2.jpg", key: 'xiaoxin' }
]


// 2. 选中主题key：直接初始化为 "ailaotou"
const selectedThemeKey = ref("xiaoxin");

// 传送带设置状态
const beltDirection = ref('left') // 'left' 或 'right'
const beltSpeed = ref(1) // 0.2-3 之间的速度值

// 3. 初始化函数：直接设置 data-theme 和传送带设置
const initTheme = () => {
  // 获取HTML根元素（<html>标签）
  const htmlRoot = document.documentElement;
  // 强制设置 data-theme 为 "ailaotou"
  htmlRoot.setAttribute("data-theme", selectedThemeKey.value);

  // （可选）同步初始化全局CSS变量（如背景图）
  const defaultTheme = themeItem.find(item => item.key === "xiaoxin");
  if (defaultTheme) {
    htmlRoot.style.setProperty("--theme-bg", `url(${defaultTheme.img})`);
  }
};

// 初始化传送带设置
const initBeltSettings = () => {
  // 从本地存储加载传送带方向设置
  const savedDirection = localStorage.getItem('beltDirection')
  if (savedDirection && ['left', 'right'].includes(savedDirection)) {
    beltDirection.value = savedDirection
  }

  // 从本地存储加载传送带速度设置
  const savedSpeed = localStorage.getItem('beltSpeed')
  if (savedSpeed) {
    const speed = parseFloat(savedSpeed)
    if (speed >= 0.2 && speed <= 3) {
      beltSpeed.value = speed
    }
  }
}


// 选中主题逻辑
const selectTheme = (item) => {
  selectedThemeKey.value = item.key;
  emit('theme-changed', item); // 向父组件发送完整主题信息
}

const selectLanguage = (language) => {
  globalStore.setLanguage(language)
  globalStore.saveLanguage()
  document.documentElement.lang = language
  emit('language-changed', language)
}

const findGame = (id) => gameConfigs.value.find(game => game.id === id)

const openGame = (game) => {
  game.status = 'playing'
  selectedGame.value = game
  visible.value = false
}

const handleGameStart = ({ id }) => {
  const game = findGame(id)
  if (game) game.status = 'playing'
}

const handleGameScoreChange = ({ id, score }) => {
  const game = findGame(id)
  if (game && score > game.bestScore) game.bestScore = score
}

const handleGameFinish = ({ id, bestScore }) => {
  const game = findGame(id)
  if (!game) return
  game.status = 'finished'
  game.bestScore = Math.max(game.bestScore, Number(bestScore) || 0)
}

const handleGameClose = ({ id }) => {
  const game = findGame(id)
  if (game) {
    game.bestScore = Math.max(game.bestScore, Number(localStorage.getItem(game.storageKey)) || 0)
    game.status = 'ready'
  }
  selectedGame.value = null
  activeTab.value = 'games'
  visible.value = true
}

// 设置传送带移动方向
const setBeltDirection = (direction) => {
  beltDirection.value = direction
  localStorage.setItem('beltDirection', direction)
  emit('belt-direction-changed', direction)
}

// 设置传送带速度
const setBeltSpeed = (speed) => {
  beltSpeed.value = speed
  localStorage.setItem('beltSpeed', speed.toString())
  emit('belt-speed-changed', speed)
}

// 格式化速度提示
const formatSpeedTooltip = (value) => {
  if (value < 0.5) return copy.value.slow
  if (value < 1.5) return copy.value.medium
  if (value < 2.5) return copy.value.fast
  return copy.value.ultraFast
}

// 监听主题变化，更新全局状态
watchEffect(() => {
  document.documentElement.lang = currentLanguage.value

  if (selectedThemeKey.value) {
    // 找到当前选中的主题完整信息
    const selectedTheme = themeItem.find(item => item.key === selectedThemeKey.value);

    if (selectedTheme) {
      // 设置全局CSS变量（包含key和背景图）
      document.documentElement.style.setProperty('--theme-key', selectedThemeKey.value);
      document.documentElement.style.setProperty('--theme-bg', `url(${selectedTheme.img})`);
      document.documentElement.setAttribute("data-theme", selectedThemeKey.value);
      // 存储主题key到本地存储
      localStorage.setItem('selectedThemeKey', selectedThemeKey.value);
    }
  }
})

// 取消按钮逻辑
const handleCancel = () => {
  visible.value = false
}

// 组件初始化时加载设置
initTheme()
initBeltSettings()
</script>

<style lang="scss">
// 全局CSS变量定义
:root {
  --theme-key: "zhenxian"; // 默认主题key
  --theme-bg: url("/images/background1.jpg"); // 默认背景图
  --theme-active-color: #409EFF; // 选中主题的高亮色
}

.theme-item {
  display: flex;
  gap: 30px;
  align-content: center;
  flex-flow: wrap;
  padding: 20px 0;
}

.language-settings {
  margin-top: 20px;
  padding-top: 24px;
  border-top: 1px solid #ebeef5;

  .section-title {
    margin: 0 0 16px;
    font-size: 18px;
    font-weight: 600;
    color: #303133;
  }
}

.language-options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  max-width: 720px;

  .language-button {
    width: 100%;
    min-height: 44px;
    margin-left: 0;
  }
}

.game-slots {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  padding: 20px 0;
}

.game-slot {
  min-width: 0;
  overflow: hidden;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  background: #fff;
  color: #606266;
  box-shadow: 0 5px 16px rgba(31, 45, 61, 0.08);

  &__cover {
    position: relative;
    height: 180px;
    overflow: hidden;
    background: #1f2933;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__content { display: grid; gap: 14px; padding: 18px; }

  &__name {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #303133;
  }

  &__status {
    position: absolute;
    top: 12px;
    right: 12px;
    padding: 5px 9px;
    border-radius: 4px;
    background: rgba(20, 31, 41, 0.86);
    color: #fff;
    font-size: 12px;
  }

  &__description { min-height: 44px; margin: 7px 0 0; color: #606266; line-height: 1.55; }
  &__score { display: flex; align-items: center; gap: 8px; color: #996b00; font-weight: 600; }
  &__play { width: 100%; min-height: 46px; margin: 0; }
}

.game-reward-note { margin: 0; color: #606266; font-size: 13px; line-height: 1.6; }

.voice-settings {
  max-width: 920px;
  padding: 12px 0;
}

.voice-setting-row {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) auto;
  align-items: center;
  gap: 18px;
  min-height: 96px;
  padding: 18px 4px;
  border-bottom: 1px solid #e4e7ed;

  &:first-child {
    border-top: 1px solid #e4e7ed;
  }

  &__icon {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    color: #1e746f;
    background: #edf7f5;
    border: 1px solid #bedbd6;
    border-radius: 50%;

    .el-icon { font-size: 23px; }
  }

  &__content {
    min-width: 0;

    h3 {
      margin: 0;
      color: #303133;
      font-size: 17px;
      font-weight: 600;
    }

    p {
      margin: 6px 0 0;
      color: #606266;
      font-size: 14px;
      line-height: 1.55;
    }
  }

  &__actions {
    display: grid;
    grid-template-columns: repeat(2, 88px);

    .el-button {
      min-height: 40px;
      margin: 0;
      border-radius: 0;

      &:first-child { border-radius: 6px 0 0 6px; }
      &:last-child { border-radius: 0 6px 6px 0; }
      & + .el-button { margin-left: -1px; }
    }
  }
}

.game-stage-overlay {
  position: fixed;
  inset: 0;
  z-index: 4000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  box-sizing: border-box;
  overflow: auto;
  background: rgba(18, 23, 28, 0.86);
}

// 主题卡片样式
.theme-card {
  position: relative;
  width: 200px;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 10px;
  border-radius: 8px;

  // 主题图片
  &__img {
    width: 100%;
    height: 140px;
    object-fit: cover;
    border-radius: 4px;
    border: 2px solid transparent;
    transition: border-color 0.3s ease;
  }

  // 主题标题
  &__title {
    text-align: center;
    font-size: 18px;
    margin-top: 8px;
    color: #333;
    transition: color 0.3s ease;
  }

  // 主题key显示（可选）
  &__key {
    text-align: center;
    font-size: 12px;
    color: #666;
    margin-top: 4px;
    background: #f5f5f5;
    border-radius: 4px;
    padding: 2px 0;
  }

  // 选中状态标识
  &__check {
    position: absolute;
    top: 15px;
    right: 15px;
    width: 24px;
    height: 24px;
    background-color: var(--theme-active-color);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 16px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }

  // 选中状态样式
  &--active {
    background-color: rgba(64, 158, 255, 0.1);

    & .theme-card__img {
      border-color: var(--theme-active-color);
    }

    & .theme-card__title {
      color: var(--theme-active-color);
      font-weight: 500;
    }
  }

  // 鼠标悬停效果
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

// 传送带设置样式
.conveyor-settings {
  .setting-section {
    margin-bottom: 40px;

    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #333;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #f0f0f0;
    }
  }
}

// 方向选择卡片
.direction-options {
  display: flex;
  gap: 20px;
  margin-top: 15px;
}

.direction-card {
  position: relative;
  flex: 1;
  max-width: 280px;
  padding: 24px;
  border: 2px solid #e8e8e8;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;

  .direction-icon {
    font-size: 48px;
    color: #666;
    text-align: center;
    margin-bottom: 12px;
    transition: all 0.3s ease;
  }

  .direction-label {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    text-align: center;
    margin-bottom: 8px;
  }

  .direction-desc {
    font-size: 14px;
    color: #666;
    text-align: center;
    line-height: 1.5;
  }

  .direction-check {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 24px;
    height: 24px;
    background: var(--theme-active-color);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 16px;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
  }

  &--active {
    border-color: var(--theme-active-color);
    background: rgba(64, 158, 255, 0.05);

    .direction-icon {
      color: var(--theme-active-color);
    }

    .direction-label {
      color: var(--theme-active-color);
    }
  }
}

// 速度控制样式
.speed-control {
  .speed-slider {
    margin: 20px 0;
  }

  .speed-labels {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    color: #666;
    margin-top: 10px;
  }
}

// 选项卡样式优化
.setting-tabs {
  .el-tabs__header {
    margin-bottom: 30px;
  }

  .el-tabs__nav-wrap {
    &::after {
      background-color: #f0f0f0;
    }
  }

  .el-tabs__item {
    font-size: 16px;
    font-weight: 500;

    &.is-active {
      color: var(--theme-active-color);
    }
  }

  .el-tabs__active-bar {
    background-color: var(--theme-active-color);
  }
}

@media (max-width: 768px) {
  .theme-item,
  .direction-options {
    gap: 12px;
  }

  .theme-card {
    width: calc(50% - 6px);
    box-sizing: border-box;
  }

  .language-options,
  .game-slots {
    grid-template-columns: 1fr;
  }

  .voice-setting-row {
    grid-template-columns: 42px minmax(0, 1fr);
    gap: 12px;

    &__actions {
      grid-column: 1 / -1;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      width: 100%;
    }
  }

  .direction-options {
    flex-direction: column;
  }

  .direction-card {
    max-width: none;
  }

  .game-slot {
    &__cover { height: 140px; }
    &__content { padding: 14px; }
  }

  .game-stage-overlay { padding: 0; }
}
</style>
