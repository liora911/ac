// PCM capture worklet.
//
// Pulls mono Float32 samples from the input, downsamples (linear) to a target
// sample rate (default 24kHz), and posts Int16 PCM ArrayBuffers back to the
// main thread roughly every `chunkMs` milliseconds. Designed for streaming to
// OpenAI Realtime (`input_audio_format: "pcm16"` at 24kHz).
class PCMCaptureProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const { targetSampleRate = 24000, chunkMs = 40 } =
      (options && options.processorOptions) || {};
    this.targetSampleRate = targetSampleRate;
    this.inputSampleRate = sampleRate; // global from AudioWorkletGlobalScope
    this.ratio = this.inputSampleRate / this.targetSampleRate;

    // ~chunkMs of audio at the target rate
    this.chunkSize = Math.max(
      1,
      Math.floor((this.targetSampleRate * chunkMs) / 1000)
    );

    this.buffer = new Float32Array(this.chunkSize);
    this.bufferIndex = 0;

    this.resamplePos = 0; // position within input stream, in input samples
    this.stopped = false;

    this.port.onmessage = (event) => {
      if (event.data === "stop") this.stopped = true;
    };
  }

  process(inputs) {
    if (this.stopped) return false;
    const input = inputs[0];
    if (!input || input.length === 0) return true;

    // Mix down to mono if necessary
    const channelCount = input.length;
    const frames = input[0].length;
    const mono = new Float32Array(frames);
    if (channelCount === 1) {
      mono.set(input[0]);
    } else {
      for (let i = 0; i < frames; i++) {
        let sum = 0;
        for (let c = 0; c < channelCount; c++) sum += input[c][i];
        mono[i] = sum / channelCount;
      }
    }

    // Linear-interpolate down to the target sample rate. resamplePos tracks
    // a virtual cursor into the conceptual concatenation of all input frames
    // we've seen this `process` call. We never write past the end of `mono`.
    let pos = this.resamplePos;
    while (pos < frames - 1) {
      const i0 = Math.floor(pos);
      const i1 = i0 + 1;
      const frac = pos - i0;
      const sample = mono[i0] * (1 - frac) + mono[i1] * frac;

      this.buffer[this.bufferIndex++] = sample;
      if (this.bufferIndex >= this.chunkSize) {
        this.flush();
      }
      pos += this.ratio;
    }
    // Carry over the fractional remainder for the next frame batch.
    this.resamplePos = pos - frames;

    return true;
  }

  flush() {
    const len = this.bufferIndex;
    if (len === 0) return;
    const pcm = new Int16Array(len);
    for (let i = 0; i < len; i++) {
      let s = this.buffer[i];
      if (s > 1) s = 1;
      else if (s < -1) s = -1;
      pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    // Transfer ownership to avoid a copy.
    this.port.postMessage(pcm.buffer, [pcm.buffer]);
    this.bufferIndex = 0;
  }
}

registerProcessor("pcm-capture-processor", PCMCaptureProcessor);
