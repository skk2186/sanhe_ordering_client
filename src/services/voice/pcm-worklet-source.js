export const PCM_WORKLET_SOURCE = `
class RestaurantPcmCaptureProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const processorOptions = options.processorOptions || {};
    this.targetRate = processorOptions.targetSampleRate || 16000;
    this.frameSamples = processorOptions.frameSamples || 320;
    this.ratio = sampleRate / this.targetRate;
    this.buffer = [];
  }

  process(inputs) {
    const channel = inputs[0] && inputs[0][0];
    if (!channel) return true;
    for (let i = 0; i < channel.length; i += 1) this.buffer.push(channel[i]);

    const sourceSamples = Math.ceil((this.frameSamples - 1) * this.ratio) + 1;
    const consumedSamples = Math.max(1, Math.floor(this.frameSamples * this.ratio));
    while (this.buffer.length >= sourceSamples) {
      const pcm = new Int16Array(this.frameSamples);
      for (let i = 0; i < this.frameSamples; i += 1) {
        const value = Math.max(-1, Math.min(1, this.buffer[Math.floor(i * this.ratio)]));
        pcm[i] = value < 0 ? value * 32768 : value * 32767;
      }
      this.buffer.splice(0, consumedSamples);
      this.port.postMessage(pcm.buffer, [pcm.buffer]);
    }
    return true;
  }
}
registerProcessor("restaurant-pcm-capture", RestaurantPcmCaptureProcessor);
`
