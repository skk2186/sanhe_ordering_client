export const DEFAULT_ASSISTANT_VOLUME = 0.8

/**
 * 将本地存储或表单传入的音量收敛到 Web Audio 使用的 0 到 1 区间。
 * null、空字符串和非数字使用回退值；数值 0 是有效的静音设置。
 */
export const normalizeAssistantVolume = (value, fallback = DEFAULT_ASSISTANT_VOLUME) => {
  if (value === null || value === undefined || value === '') return fallback
  const numericVolume = Number(value)
  if (!Number.isFinite(numericVolume)) return fallback
  return Math.min(1, Math.max(0, numericVolume))
}
