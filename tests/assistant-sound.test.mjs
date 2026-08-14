import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DEFAULT_ASSISTANT_VOLUME,
  normalizeAssistantVolume
} from '../src/utils/assistantSound.js'
import { ASSISTANT_AUDIO, getAssistantErrorAudioKey } from '../src/utils/assistantAudio.js'

test('uses the assistant default when no saved volume exists', () => {
  assert.equal(normalizeAssistantVolume(null), DEFAULT_ASSISTANT_VOLUME)
  assert.equal(normalizeAssistantVolume(undefined), DEFAULT_ASSISTANT_VOLUME)
  assert.equal(normalizeAssistantVolume('invalid'), DEFAULT_ASSISTANT_VOLUME)
})

test('normalizes persisted assistant volume to the supported range', () => {
  assert.equal(normalizeAssistantVolume('0.35'), 0.35)
  assert.equal(normalizeAssistantVolume(-1), 0)
  assert.equal(normalizeAssistantVolume(2), 1)
})

test('maps assistant errors to the matching recorded prompt', () => {
  const audioKeys = Object.values(ASSISTANT_AUDIO)
  assert.equal(audioKeys.length, 22)
  assert.equal(new Set(audioKeys).size, 22)
  assert.equal(ASSISTANT_AUDIO.SINGLE_BATCH, 'single-batch')
  assert.equal(ASSISTANT_AUDIO.CART_SPACE_INSUFFICIENT, 'cart-space-insufficient')
  assert.equal(ASSISTANT_AUDIO.ORDER_EMPTY, 'order-empty')
  assert.equal(ASSISTANT_AUDIO.SESSION_ENDED, 'session-ended')
  assert.equal(ASSISTANT_AUDIO.ORDER_SUBMITTING, 'order-submitting')
  assert.equal(ASSISTANT_AUDIO.ORDER_SUCCESS, 'order-success')
  assert.equal(ASSISTANT_AUDIO.ORDER_FAILED, 'order-failed')
  assert.equal(getAssistantErrorAudioKey('permission_denied'), ASSISTANT_AUDIO.MIC_PERMISSION)
  assert.equal(getAssistantErrorAudioKey('speech_too_short'), ASSISTANT_AUDIO.REPEAT)
  assert.equal(getAssistantErrorAudioKey('service_unavailable'), ASSISTANT_AUDIO.SERVICE_UNAVAILABLE)
  assert.equal(getAssistantErrorAudioKey('microphone_busy'), '')
})
