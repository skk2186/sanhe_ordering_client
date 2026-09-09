// 组件之间只传递稳定的语义键，实际 MP3 路径由播放组件集中维护。
export const ASSISTANT_AUDIO = Object.freeze({
  WAKE_ACK: 'wake-ack',
  COMMAND_READY: 'command-ready',
  RESULTS_READY: 'results-ready',
  RESULTS_PAGED: 'results-paged',
  NEXT_BATCH: 'next-batch',
  BATCH_RESTARTED: 'batch-restarted',
  SINGLE_BATCH: 'single-batch',
  NO_MATCH: 'no-match',
  SELECTION_INVALID: 'selection-invalid',
  ADDED: 'added',
  CART_FULL: 'cart-full',
  CART_SPACE_INSUFFICIENT: 'cart-space-insufficient',
  ADD_FAILED: 'add-failed',
  REPEAT: 'repeat',
  MIC_PERMISSION: 'mic-permission',
  SERVICE_UNAVAILABLE: 'service-unavailable',
  SESSION_TIMEOUT: 'session-timeout',
  SESSION_ENDED: 'session-ended',
  ORDER_EMPTY: 'order-empty',
  ORDER_SUBMITTING: 'order-submitting',
  ORDER_SUCCESS: 'order-success',
  ORDER_FAILED: 'order-failed',
  OPEN_MENU: 'open-menu',
  OPEN_LEFT_MENU: 'open-left-menu',
  OPEN_RIGHT_MENU: 'open-right-menu',
  OPEN_NAVIGATION: 'open-navigation',
  OPEN_HISTORY: 'open-history',
  OPEN_SETTINGS: 'open-settings',
  CALL_WAITER_CONFIRM: 'call-waiter-confirm',
  CALL_WAITER_SENT: 'call-waiter-sent',
  ORDER_CONFIRM: 'order-confirm',
  ACTION_CANCELLED: 'action-cancelled',
  STREAM_PAUSED: 'stream-paused',
  STREAM_RESUMED: 'stream-resumed',
  STREAM_SLOWER: 'stream-slower',
  STREAM_FASTER: 'stream-faster',
  POPULAR_INTRO: 'popular-intro',
  FEATURED_INTRO: 'featured-intro',
  COMBO_INTRO: 'combo-intro',
  RECOMMENDATION_EMPTY: 'recommendation-empty',
  RECOMMENDATION_REPLACED: 'recommendation-replaced',
  ADDED_LEFT: 'added-left',
  ADDED_RIGHT: 'added-right',
  ADDED_BOTH: 'added-both'
})

// 错误码来自浏览器、VoiceClient 和语音服务，统一映射到有限的用户提示录音。
const ERROR_AUDIO_BY_CODE = Object.freeze({
  permission_denied: ASSISTANT_AUDIO.MIC_PERMISSION,
  recognition_failed: ASSISTANT_AUDIO.REPEAT,
  speech_too_short: ASSISTANT_AUDIO.REPEAT,
  no_speech: ASSISTANT_AUDIO.REPEAT,
  processing_timeout: ASSISTANT_AUDIO.REPEAT,
  audio_too_long: ASSISTANT_AUDIO.REPEAT,
  connection_timeout: ASSISTANT_AUDIO.SERVICE_UNAVAILABLE,
  service_unavailable: ASSISTANT_AUDIO.SERVICE_UNAVAILABLE,
  invalid_server_event: ASSISTANT_AUDIO.SERVICE_UNAVAILABLE,
  model_busy: ASSISTANT_AUDIO.SERVICE_UNAVAILABLE
})

/** 返回错误场景对应的录音键；没有专用录音时交由调用方使用文本提示。 */
export const getAssistantErrorAudioKey = (errorCode) => ERROR_AUDIO_BY_CODE[errorCode] || ''
