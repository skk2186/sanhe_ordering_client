import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { setLocale } from '@/i18n'
import { DEFAULT_ASSISTANT_VOLUME, normalizeAssistantVolume } from '@/utils/assistantSound'

export const useGlobalStore = defineStore('global', () => {
  // 状态
  const loading = ref(false)
  const theme = ref('light')
  const language = ref('zh-CN')
  const sidebarCollapsed = ref(false)
  const voiceAssistantEnabled = ref(true)
  const ttsEnabled = ref(false)
  const assistantVolume = ref(DEFAULT_ASSISTANT_VOLUME)
  
  // 应用配置
  const appConfig = ref({
    name: '回转寿司点餐系统',
    title: '回转寿司点餐系统',
    version: '1.0.0',
    author: 'Sushi Team',
    description: '现代化回转寿司点餐管理系统'
  })
  
  // 计算属性
  const isDark = computed(() => theme.value === 'dark')
  
  // 方法
  const setLoading = (value) => {
    loading.value = value
  }
  
  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }
  
  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }
  
  const setLanguage = (lang) => {
    language.value = lang
    setLocale(lang)
  }
  
  /** 应用启动时一次性恢复持久设置，并同步 i18n 的当前语言。 */
  const initApp = () => {
    // 每个键独立恢复，旧版本缺少新配置时仍可使用代码中的安全默认值。
    const savedTheme = localStorage.getItem('app-theme')
    if (savedTheme) {
      theme.value = savedTheme
    }
    
    const savedLanguage = localStorage.getItem('app-language')
    if (savedLanguage) {
      language.value = savedLanguage
      setLocale(savedLanguage)
    }
    
    const savedSidebar = localStorage.getItem('sidebar-collapsed')
    if (savedSidebar) {
      sidebarCollapsed.value = JSON.parse(savedSidebar)
    }

    const savedVoiceAssistant = localStorage.getItem('voice-assistant-enabled')
    if (savedVoiceAssistant !== null) {
      voiceAssistantEnabled.value = savedVoiceAssistant === 'true'
    }

    const savedTts = localStorage.getItem('tts-enabled')
    if (savedTts !== null) {
      ttsEnabled.value = savedTts === 'true'
    }

    const savedAssistantVolume = localStorage.getItem('assistant-volume')
    assistantVolume.value = normalizeAssistantVolume(savedAssistantVolume)
  }
  
  // 监听主题变化并保存
  const saveTheme = () => {
    localStorage.setItem('app-theme', theme.value)
  }
  
  const saveLanguage = () => {
    localStorage.setItem('app-language', language.value)
  }
  
  const saveSidebar = () => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(sidebarCollapsed.value))
  }

  const setVoiceAssistantEnabled = (enabled) => {
    voiceAssistantEnabled.value = Boolean(enabled)
    localStorage.setItem('voice-assistant-enabled', String(voiceAssistantEnabled.value))
  }

  const setTtsEnabled = (enabled) => {
    ttsEnabled.value = Boolean(enabled)
    localStorage.setItem('tts-enabled', String(ttsEnabled.value))
  }

  const setAssistantVolume = (volume) => {
    // 以当前值作为非法输入的回退，拖动滑块时不会因瞬时空值跳回默认音量。
    assistantVolume.value = normalizeAssistantVolume(volume, assistantVolume.value)
    localStorage.setItem('assistant-volume', String(assistantVolume.value))
  }
  
  return {
    // 状态
    loading,
    theme,
    language,
    sidebarCollapsed,
    voiceAssistantEnabled,
    ttsEnabled,
    assistantVolume,
    appConfig,
    
    // 计算属性
    isDark,
    
    // 方法
    setLoading,
    toggleTheme,
    toggleSidebar,
    setLanguage,
    initApp,
    saveTheme,
    saveLanguage,
    saveSidebar,
    setVoiceAssistantEnabled,
    setTtsEnabled,
    setAssistantVolume
  }
})
