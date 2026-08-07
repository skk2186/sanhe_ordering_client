import { computed, ref } from 'vue'
import messages from './messages'

export const supportedLocales = ['zh-CN', 'en-US', 'ja-JP']
const initialLocale = localStorage.getItem('app-language')
const locale = ref(supportedLocales.includes(initialLocale) ? initialLocale : 'zh-CN')

const resolveMessage = (source, path) => path.split('.').reduce((value, segment) => value?.[segment], source)

export const t = (key, params = {}) => {
  const current = resolveMessage(messages[locale.value], key)
  const fallback = resolveMessage(messages['zh-CN'], key)
  const template = current ?? fallback ?? key
  return String(template).replace(/\{(\w+)\}/g, (_, name) => params[name] ?? `{${name}}`)
}

export const setLocale = (nextLocale) => {
  if (!supportedLocales.includes(nextLocale)) return
  locale.value = nextLocale
  localStorage.setItem('app-language', nextLocale)
  document.documentElement.lang = nextLocale
}

export const useI18n = () => ({
  locale,
  t,
  currentLocale: computed(() => locale.value)
})

export const i18n = {
  install(app) {
    app.config.globalProperties.$t = t
    app.provide('i18n', { locale, t, setLocale })
  },
  locale,
  t,
  setLocale,
  messages
}

document.documentElement.lang = locale.value

