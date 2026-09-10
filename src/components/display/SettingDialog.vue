<template>
  <el-dialog
      v-model="visible"
      :title="copy.systemSettings"
      width="min(1300px, 94vw)"
      class="luxury-settings-dialog"
      :class="{ 'is-midnight-station': selectedThemeKey === 'midnight-station' }"
      :style="{ '--settings-theme-bg': selectedThemePreview.img ? `url(${selectedThemePreview.img})` : 'none' }"
      center
  >
    <section
      class="settings-hero"
      :class="{ 'settings-hero--station': selectedThemeKey === 'midnight-station' }"
      :style="{ backgroundImage: selectedThemePreview.img ? `url(${selectedThemePreview.img})` : 'none' }"
      aria-labelledby="settings-hero-title"
    >
      <div class="settings-hero__veil"></div>
      <div class="settings-hero__content">
        <span class="settings-hero__eyebrow">AI DINING TABLE</span>
        <h2 id="settings-hero-title">{{ copy.systemSettings }}</h2>
        <p>{{ selectedThemePreview.title }}</p>
      </div>
      <div class="settings-hero__badge">
        <span class="settings-hero__dot"></span>
        <span>{{ copy.themeSettings }}</span>
      </div>
    </section>

    <!-- 设置选项卡 -->
    <el-tabs v-model="activeTab" class="setting-tabs">
      <!-- 主题设置选项卡 -->
      <el-tab-pane name="theme">
        <template #label>
          <span class="setting-tab-label"><el-icon><Picture /></el-icon>{{ copy.themeSettings }}</span>
        </template>
        <div class="theme-item">
          <div
              class="theme-card"
              v-for="item in themeItem"
              :key="item.key"
              @click="selectTheme(item)"
              :class="{
                'theme-card--active': selectedThemeKey === item.key,
                'theme-card--disabled': themeChanging,
                'theme-card--station': item.preview === 'station'
              }"
              :aria-disabled="themeChanging"
          >
            <!-- 选中状态标识 -->
            <div class="theme-card__check" v-if="selectedThemeKey === item.key">
              <el-icon><Check /></el-icon>
            </div>
            <div
              v-if="item.preview"
              class="theme-card__preview theme-card__preview--station"
              aria-hidden="true"
            >
              <span class="theme-card__preview-line theme-card__preview-line--one"></span>
              <span class="theme-card__preview-line theme-card__preview-line--two"></span>
              <span class="theme-card__preview-ticket">MIDNIGHT<br>STATION</span>
              <span class="theme-card__preview-signal"></span>
            </div>
            <img v-else :src="item.img" :alt="copy.themeBackground" class="theme-card__img">
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

      <!-- 传送带设置选项卡 -->
      <el-tab-pane name="voice">
        <template #label>
          <span class="setting-tab-label"><el-icon><Microphone /></el-icon>{{ copy.voiceMode }}</span>
        </template>
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
            <div class="voice-setting-row__actions voice-setting-row__actions--sound" role="group" :aria-label="copy.ttsVoice">
              <div class="assistant-sound-toggle">
                <span>{{ copy.assistantSoundEnabled }}</span>
                <el-switch
                  :model-value="globalStore.ttsEnabled"
                  :aria-label="copy.assistantSoundEnabled"
                  @change="globalStore.setTtsEnabled"
                />
              </div>
              <div class="assistant-volume-control">
                <span>{{ copy.assistantVolume }}</span>
                <el-slider
                  v-model="assistantVolumePercent"
                  :min="0"
                  :max="100"
                  :step="5"
                  :disabled="!globalStore.ttsEnabled"
                  :aria-label="copy.assistantVolume"
                />
                <output>{{ assistantVolumePercent }}%</output>
              </div>
            </div>
          </section>
        </div>
      </el-tab-pane>

      <el-tab-pane name="conveyor">
        <template #label>
          <span class="setting-tab-label"><el-icon><VideoPlay /></el-icon>{{ copy.conveyorSettings }}</span>
        </template>
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
        <el-button class="settings-close" @click="handleCancel" size="large">{{ copy.close }}</el-button>
      </div>
    </template>
  </el-dialog>

</template>

<script setup>
import { Check, Headset, Microphone, Picture } from '@element-plus/icons-vue'
import { ElDialog, ElTabs, ElTabPane, ElSlider, ElSwitch } from "element-plus";
import { computed, ref, watch } from "vue";
import { useGlobalStore } from '@/stores/global'
import { useI18n } from '@/i18n'

// 定义Props和Emits
const emit = defineEmits(['update:modelValue', 'theme-changed', 'belt-direction-changed', 'belt-speed-changed', 'language-changed'])
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // 支持父组件传入默认主题key
  defaultThemeKey: { type: String, default: "zhenxian" },
  themeChanging: { type: Boolean, default: false }
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

const currentLanguage = computed(() => (
  languageOptions.some(language => language.code === globalStore.language)
    ? globalStore.language
    : 'zh-CN'
))

const assistantVolumePercent = computed({
  get: () => Math.round(globalStore.assistantVolume * 100),
  set: (value) => globalStore.setAssistantVolume(Number(value) / 100)
})

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
  assistantSoundEnabled: t('settings.assistantSoundEnabled'),
  assistantVolume: t('settings.assistantVolume'),
  enable: t('common.enable'),
  disable: t('common.disable'),
  cancel: t('common.cancel'),
  close: t('common.close')
}))

// 展示版只开放主题 B、C；主题 A 的旧缓存会在初始化时回退到主题 B。
const themeItem = computed(() => [
  { title: '蜡笔小新·海滩', img: '/images/ui/b/background.png', key: 'zhenxian' },
  { title: '海底贝壳', img: '/images/ui/c/background.png', key: 'xiaoxin' },
  { title: t('settings.themeMidnightStation'), img: '', key: 'midnight-station', preview: 'station' }
])
const availableThemeKeys = computed(() => new Set(themeItem.value.map(item => item.key)))
const fallbackThemeKey = 'zhenxian'

// 当前样板默认进入主题 B，用户仍可在设置中切换并保存其他主题。
const selectedThemeKey = ref(
  availableThemeKeys.value.has(props.defaultThemeKey) ? props.defaultThemeKey : fallbackThemeKey
)
const selectedThemePreview = computed(() => (
  themeItem.value.find(item => item.key === selectedThemeKey.value) || themeItem.value[0]
))

// 传送带设置状态
const beltDirection = ref('left') // 'left' 或 'right'
const beltSpeed = ref(1) // 0.2-3 之间的速度值

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
  if (props.themeChanging || item.key === selectedThemeKey.value) return
  selectedThemeKey.value = item.key
  emit('theme-changed', item); // 向父组件发送完整主题信息
}

const selectLanguage = (language) => {
  globalStore.setLanguage(language)
  globalStore.saveLanguage()
  document.documentElement.lang = language
  emit('language-changed', language)
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

watch(currentLanguage, (language) => {
  document.documentElement.lang = language
}, { immediate: true })

watch(() => props.defaultThemeKey, (themeKey) => {
  selectedThemeKey.value = availableThemeKeys.value.has(themeKey) ? themeKey : fallbackThemeKey
})

watch(() => props.modelValue, (isVisible) => {
  if (!isVisible) return
  selectedThemeKey.value = availableThemeKeys.value.has(props.defaultThemeKey)
    ? props.defaultThemeKey
    : fallbackThemeKey
})

// 取消按钮逻辑
const handleCancel = () => {
  visible.value = false
}

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

    &--sound {
      grid-template-columns: 280px;
      gap: 12px;
    }
  }
}

.assistant-sound-toggle,
.assistant-volume-control {
  display: grid;
  align-items: center;
  gap: 12px;
  color: #303133;
  font-size: 14px;
}

.assistant-sound-toggle {
  grid-template-columns: minmax(0, 1fr) auto;
}

.assistant-volume-control {
  grid-template-columns: 54px minmax(120px, 1fr) 42px;

  output {
    color: #606266;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
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

.theme-card--disabled {
  cursor: wait;
  pointer-events: none;
  opacity: 0.72;
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

/* Scene-console skin: reuse the beach and underwater artwork while keeping
   controls dense enough for repeated use at the table. */
.luxury-settings-dialog {
  --settings-ink: #173944;
  --settings-muted: #65808a;
  --settings-sea: #0f7897;
  --settings-sea-soft: #eaf7f8;
  --settings-coral: #ef765f;
  --settings-gold: #d6a94c;
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(75, 142, 155, 0.22);
  border-radius: 18px;
  background: rgba(247, 252, 252, .34);
  box-shadow: 0 24px 70px rgba(7, 53, 68, 0.28);

  &::before {
    position: absolute;
    inset: 0;
    z-index: 0;
    content: '';
    background-image: var(--settings-theme-bg);
    background-position: center;
    background-size: cover;
    opacity: .24;
    pointer-events: none;
  }

  .el-dialog__header {
    position: relative;
    z-index: 1;
    margin: 0;
    padding: 22px 28px 12px;
    background: rgba(247, 252, 252, .42);

    .el-dialog__title {
      color: var(--settings-ink);
      font-size: 18px;
      font-weight: 800;
      letter-spacing: .02em;
    }
  }

  .el-dialog__headerbtn { top: 20px; right: 22px; }
  .el-dialog__headerbtn .el-dialog__close { color: #6c8b93; }

  .el-dialog__body {
    position: relative;
    z-index: 1;
    padding: 12px 28px 24px;
    background: rgba(247, 252, 252, .24);
  }

  .el-dialog__footer {
    position: relative;
    z-index: 1;
    padding: 14px 28px 22px;
    border-top: 1px solid rgba(90, 146, 156, .16);
    background: rgba(247, 252, 252, .44);
  }
}

.settings-hero {
  position: relative;
  min-height: 142px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  overflow: hidden;
  margin-bottom: 20px;
  padding: 24px 26px;
  border: 1px solid rgba(255, 255, 255, .45);
  border-radius: 14px;
  background-color: #14566e;
  background-position: center 56%;
  background-size: cover;
  box-shadow: inset 0 -20px 36px rgba(1, 35, 47, .2), 0 10px 26px rgba(7, 74, 92, .12);

  &__veil {
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, rgba(3, 39, 57, .88), rgba(3, 39, 57, .48) 58%, rgba(3, 39, 57, .16));
  }

  &__content,
  &__badge { position: relative; z-index: 1; }

  &__content { color: #f5ffff; }
  &__eyebrow { display: block; margin-bottom: 8px; color: #bcebf0; font-size: 10px; font-weight: 800; letter-spacing: .18em; }
  h2 { margin: 0; color: #fff; font-size: clamp(23px, 2.2vw, 32px); line-height: 1.1; }
  p { margin: 8px 0 0; color: #d9f3f4; font-size: 14px; font-weight: 700; }

  &__badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border: 1px solid rgba(255, 255, 255, .32);
    border-radius: 999px;
    color: #fff;
    background: rgba(9, 55, 70, .42);
    font-size: 12px;
    font-weight: 700;
    backdrop-filter: blur(8px);
  }

  &__dot { width: 7px; height: 7px; border-radius: 50%; background: #f4c85f; box-shadow: 0 0 0 4px rgba(244, 200, 95, .18); }
}

.setting-tab-label { display: inline-flex; align-items: center; gap: 7px; }
.setting-tab-label .el-icon { font-size: 16px; }

.luxury-settings-dialog .setting-tabs {
  .el-tabs__header { margin: 0 0 22px; }
  .el-tabs__nav-wrap::after { display: none; }
  .el-tabs__nav { gap: 5px; padding: 4px; border: 1px solid rgba(89, 148, 158, .2); border-radius: 12px; background: rgba(234, 246, 247, .5); }
  .el-tabs__item {
    height: 42px;
    padding: 0 15px;
    border-radius: 9px;
    color: #66818a;
    font-size: 13px;
    font-weight: 700;
    transition: color .2s ease, background .2s ease, box-shadow .2s ease;

    &.is-active {
      color: var(--settings-coral);
      background: rgba(255, 255, 255, .64);
      box-shadow: 0 3px 12px rgba(21, 96, 111, .12);
    }
  }
  .el-tabs__active-bar { display: none; }
}

.luxury-settings-dialog .theme-item {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  padding: 0;
}

.luxury-settings-dialog .theme-card {
  width: auto;
  box-sizing: border-box;
  padding: 10px;
  border: 1px solid rgba(75, 142, 155, .17);
  border-radius: 14px;
  background: rgba(255, 255, 255, .52);
  box-shadow: 0 7px 20px rgba(11, 74, 89, .07);

  &__img { height: 170px; border: 0; border-radius: 10px; }
  &__title { margin-top: 12px; color: var(--settings-ink); font-size: 16px; font-weight: 800; }
  &__key { display: none; }
  &__check { top: 18px; right: 18px; width: 28px; height: 28px; background: var(--settings-coral); box-shadow: 0 5px 12px rgba(239, 118, 95, .32); }

  &--active {
    border-color: rgba(239, 118, 95, .8);
    background: rgba(255, 250, 248, .62);
    box-shadow: 0 10px 28px rgba(239, 118, 95, .16);
    .theme-card__img { box-shadow: inset 0 0 0 3px rgba(239, 118, 95, .35); }
    .theme-card__title { color: var(--settings-coral); }
  }

  &:hover { transform: translateY(-4px); box-shadow: 0 14px 30px rgba(11, 74, 89, .13); }
}

.luxury-settings-dialog .language-settings,
.luxury-settings-dialog .conveyor-settings,
.luxury-settings-dialog .voice-settings {
  margin-top: 20px;
  padding: 18px;
  border: 1px solid rgba(75, 142, 155, .14);
  border-radius: 14px;
  background: rgba(255, 255, 255, .48);
  box-shadow: 0 7px 20px rgba(11, 74, 89, .05);
}

.luxury-settings-dialog .el-button:not(.el-button--primary):not(.settings-close) {
  background: rgba(255, 255, 255, .5);
}

.luxury-settings-dialog .language-settings { margin-top: 20px; padding-top: 18px; border-top: 1px solid rgba(75, 142, 155, .14); }
.luxury-settings-dialog .language-settings .section-title,
.luxury-settings-dialog .conveyor-settings .section-title { color: var(--settings-ink); font-size: 15px; }
.luxury-settings-dialog .language-button { min-height: 42px; border-color: #d6e8ea; color: #55747d; font-weight: 700; }
.luxury-settings-dialog .language-button.el-button--primary { border-color: var(--settings-coral); color: #fff; background: var(--settings-coral); }

.luxury-settings-dialog .voice-setting-row { border-color: rgba(75, 142, 155, .14); }
.luxury-settings-dialog .voice-setting-row__icon { color: var(--settings-sea); background: var(--settings-sea-soft); border-color: #b9dfe3; }
.luxury-settings-dialog .voice-setting-row__content h3 { color: var(--settings-ink); font-weight: 800; }
.luxury-settings-dialog .voice-setting-row__content p { color: var(--settings-muted); }
.luxury-settings-dialog .direction-options { gap: 12px; margin-top: 10px; }
.luxury-settings-dialog .direction-card { max-width: none; padding: 18px; border-color: #d6e8ea; border-radius: 11px; background: rgba(251, 254, 254, .54); }
.luxury-settings-dialog .direction-card--active { border-color: var(--settings-coral); background: rgba(255, 250, 248, .66); }
.luxury-settings-dialog .direction-card .direction-icon { color: var(--settings-sea); font-size: 38px; }
.luxury-settings-dialog .direction-card--active .direction-icon,
.luxury-settings-dialog .direction-card--active .direction-label { color: var(--settings-coral); }
.luxury-settings-dialog .speed-control .speed-slider { margin: 20px 0 12px; }
.luxury-settings-dialog .settings-close { min-width: 108px; border: 0; color: #fff; background: var(--settings-sea); box-shadow: 0 6px 14px rgba(15, 120, 151, .2); }

@media (max-width: 768px) {
  .theme-item,
  .direction-options {
    gap: 12px;
  }

  .theme-card {
    width: calc(50% - 6px);
    box-sizing: border-box;
  }

  .language-options {
    grid-template-columns: 1fr;
  }

  .voice-setting-row {
    grid-template-columns: 42px minmax(0, 1fr);
    gap: 12px;

    &__actions {
      grid-column: 1 / -1;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      width: 100%;

      &--sound {
        grid-template-columns: 1fr;
      }
    }
  }

  .direction-options {
    flex-direction: column;
  }

  .direction-card {
    max-width: none;
  }

  .luxury-settings-dialog {
    border-radius: 14px;
    .el-dialog__header { padding: 18px 18px 10px; }
    .el-dialog__body { padding: 10px 18px 18px; }
    .el-dialog__footer { padding: 10px 18px 16px; }
    .setting-tabs .el-tabs__item { padding: 0 9px; font-size: 12px; }
  }

  .settings-hero { min-height: 126px; margin-bottom: 14px; padding: 18px; }
  .settings-hero__badge { display: none; }
  .settings-hero h2 { font-size: 24px; }
  .settings-hero p { font-size: 13px; }

  .luxury-settings-dialog .theme-item { grid-template-columns: 1fr; }
  .luxury-settings-dialog .theme-card { width: 100%; }
  .luxury-settings-dialog .theme-card__img { height: 148px; }
  .luxury-settings-dialog .language-settings,
  .luxury-settings-dialog .conveyor-settings,
  .luxury-settings-dialog .voice-settings { padding: 14px; }
}

/* Station ticket preview and control-room dialog skin. The preview is built
   from CSS geometry so this phase does not introduce a low-quality placeholder
   raster asset. */
.theme-card__preview {
  position: relative;
  width: 100%;
  height: 170px;
  overflow: hidden;
  display: block;
  background: var(--station-background);
  border: 1px solid var(--station-border);
  border-radius: var(--station-radius-control);
}

.theme-card__preview-line {
  position: absolute;
  left: 8%;
  width: 84%;
  height: 1px;
  background: var(--station-border);
  opacity: 0.72;
  transform: rotate(-4deg);
}

.theme-card__preview-line--one { top: 36%; }
.theme-card__preview-line--two { top: 64%; }

.theme-card__preview-ticket {
  position: absolute;
  left: 50%;
  top: 50%;
  padding: 14px 18px;
  color: var(--station-text-on-surface);
  background: var(--station-surface);
  border: 1px solid var(--station-accent);
  border-radius: var(--station-radius-ticket);
  font-family: var(--station-font-number);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.45;
  letter-spacing: 0.12em;
  text-align: center;
  transform: translate(-50%, -50%) rotate(-4deg);
}

.theme-card__preview-signal {
  position: absolute;
  right: 10%;
  top: 12%;
  width: 12px;
  height: 12px;
  background: var(--station-primary);
  border: 2px solid var(--station-accent);
  border-radius: 50%;
}

.theme-card--station:hover .theme-card__preview,
.theme-card--station.theme-card--active .theme-card__preview {
  border-color: var(--station-primary);
}

.luxury-settings-dialog.is-midnight-station {
  --settings-ink: var(--station-text-on-surface);
  --settings-muted: var(--station-text-muted);
  --settings-sea: var(--station-secondary);
  --settings-sea-soft: var(--station-secondary-soft);
  --settings-coral: var(--station-primary);
  --settings-gold: var(--station-accent);
  border-color: var(--station-border);
  border-radius: var(--station-radius-panel);
  background: var(--station-surface-elevated);
  box-shadow: var(--station-shadow-e3);

  &::before { display: none; }

  .el-dialog__header {
    background: var(--station-background-deep);
    border-bottom: 1px solid var(--station-border);

    .el-dialog__title { color: var(--station-text-primary); font-family: var(--station-font-brand); }
  }

  .el-dialog__headerbtn .el-dialog__close { color: var(--station-text-secondary); }
  .el-dialog__body { background: var(--station-surface-elevated); }
  .el-dialog__footer { background: var(--station-surface); border-top-color: var(--station-border); }

  .settings-hero--station {
    background: var(--station-background);
    border-color: var(--station-border);
    border-radius: var(--station-radius-panel);
    box-shadow: var(--station-shadow-e1);

    &::after {
      position: absolute;
      right: 8%;
      top: 20%;
      width: 36%;
      height: 56%;
      content: 'MIDNIGHT\A STATION';
      color: var(--station-surface);
      border: 1px solid var(--station-border);
      font-family: var(--station-font-number);
      font-size: clamp(18px, 2vw, 28px);
      font-weight: 700;
      line-height: 1.35;
      letter-spacing: 0.16em;
      text-align: center;
      white-space: pre;
      opacity: 0.9;
      display: grid;
      place-items: center;
      transform: rotate(2deg);
    }

    .settings-hero__veil {
      background: linear-gradient(90deg, var(--station-veil-deep), var(--station-veil-mid) 58%, var(--station-veil-soft));
    }

    .settings-hero__content { color: var(--station-text-primary); }
    .settings-hero__eyebrow { color: var(--station-accent); font-family: var(--station-font-number); }
    h2 { color: var(--station-text-primary); font-family: var(--station-font-brand); }
    p { color: var(--station-text-secondary); }
    .settings-hero__badge { color: var(--station-text-primary); border-color: var(--station-border); border-radius: var(--station-radius-ticket); background: transparent; }
    .settings-hero__dot { background: var(--station-primary); box-shadow: none; }
  }

  .setting-tabs .el-tabs__nav {
    border-color: var(--station-border);
    border-radius: var(--station-radius-control);
    background: var(--station-surface-muted);
  }

  .setting-tabs .el-tabs__item {
    border-radius: var(--station-radius-small);
    color: var(--settings-muted);
    &.is-active { color: var(--station-text-primary); background: var(--station-secondary); box-shadow: none; }
  }

  .theme-card,
  .language-settings,
  .conveyor-settings,
  .voice-settings {
    border-color: var(--station-border);
    border-radius: var(--station-radius-panel);
    background: var(--station-surface);
    box-shadow: var(--station-shadow-e0);
  }

  .theme-card {
    &__title { color: var(--station-text-on-surface); font-family: var(--station-font-ui); }
    &__check { background: var(--station-primary); border-radius: var(--station-radius-small); box-shadow: none; }
    &--active { border-color: var(--station-primary); background: var(--station-surface-elevated); box-shadow: inset 0 0 0 1px var(--station-primary); }
    &--active .theme-card__title { color: var(--station-primary-strong); }
  }

  .section-title,
  .voice-setting-row__content h3,
  .assistant-sound-toggle,
  .assistant-volume-control { color: var(--station-text-on-surface); }
  .voice-setting-row { border-color: var(--station-border); }
  .voice-setting-row__icon { color: var(--station-secondary); background: var(--station-surface-muted); border-color: var(--station-border); border-radius: var(--station-radius-small); }
  .voice-setting-row__content p,
  .speed-labels { color: var(--station-text-muted); }
  .direction-card { border-color: var(--station-border); border-radius: var(--station-radius-control); background: var(--station-surface-elevated); }
  .direction-card--active { border-color: var(--station-primary); background: var(--station-surface); }
  .direction-card--active .direction-icon,
  .direction-card--active .direction-label { color: var(--station-primary); }
  .direction-card .direction-check { background: var(--station-primary); border-radius: var(--station-radius-small); }
  .settings-close { background: var(--station-primary); border-radius: var(--station-radius-control); box-shadow: var(--station-shadow-e1); }
}

@media (max-width: 768px) {
  .luxury-settings-dialog.is-midnight-station .settings-hero--station::after { right: 6%; width: 42%; font-size: 14px; }
  .luxury-settings-dialog.is-midnight-station .theme-card__preview { height: 148px; }
}
</style>
