export const isWebCodecsSupported =
    typeof globalThis.AudioEncoder !== 'undefined' &&
    typeof globalThis.AudioDecoder !== 'undefined' &&
    typeof globalThis.AudioData !== 'undefined'

// Push the rendered AudioBuffer through Opus at the given bitrate, then decode
// it back to PCM. Lower bitrate = more audible codec artifacts.
export async function applyOpusLofi(audioBuffer, bitrate) {
    if (!isWebCodecsSupported) {
        throw new Error('WebCodecs AudioEncoder/AudioDecoder not available in this browser')
    }

    const sampleRate = audioBuffer.sampleRate
    const numberOfChannels = audioBuffer.numberOfChannels

    const encoderConfig = { codec: 'opus', sampleRate, numberOfChannels, bitrate }
    const support = await AudioEncoder.isConfigSupported(encoderConfig)
    if (!support.supported) {
        throw new Error(`Opus config not supported: ${JSON.stringify(encoderConfig)}`)
    }

    // Per-channel buffers we'll fill from decoded AudioData frames.
    const decodedChunks = Array.from({ length: numberOfChannels }, () => [])
    let totalDecodedFrames = 0
    let pipelineError = null

    const decoder = new AudioDecoder({
        output: (audioData) => {
            const frames = audioData.numberOfFrames
            for (let c = 0; c < audioData.numberOfChannels; c++) {
                const chunk = new Float32Array(frames)
                audioData.copyTo(chunk, { planeIndex: c, format: 'f32-planar' })
                decodedChunks[c].push(chunk)
            }
            totalDecodedFrames += frames
            audioData.close()
        },
        error: (e) => { pipelineError = e },
    })
    decoder.configure({ codec: 'opus', sampleRate, numberOfChannels })

    const encoder = new AudioEncoder({
        output: (chunk) => decoder.decode(chunk),
        error: (e) => { pipelineError = e },
    })
    encoder.configure(encoderConfig)

    // Feed the rendered buffer into the encoder in 20ms slices. WebCodecs is
    // happy with any size, but matching Opus' native frame size keeps things
    // tidy and timestamps clean.
    const framesPerChunk = Math.floor(sampleRate * 0.02)
    const totalFrames = audioBuffer.length
    const channelData = []
    for (let c = 0; c < numberOfChannels; c++) channelData.push(audioBuffer.getChannelData(c))

    for (let offset = 0; offset < totalFrames; offset += framesPerChunk) {
        const frames = Math.min(framesPerChunk, totalFrames - offset)
        // f32-planar = each channel laid out contiguously, back-to-back.
        const planar = new Float32Array(frames * numberOfChannels)
        for (let c = 0; c < numberOfChannels; c++) {
            planar.set(channelData[c].subarray(offset, offset + frames), c * frames)
        }
        // Timestamps are in microseconds.
        const timestamp = Math.round((offset / sampleRate) * 1_000_000)
        const data = new AudioData({
            format: 'f32-planar',
            sampleRate,
            numberOfFrames: frames,
            numberOfChannels,
            timestamp,
            data: planar,
        })
        encoder.encode(data)
        data.close()
    }

    await encoder.flush()
    encoder.close()
    await decoder.flush()
    decoder.close()

    if (pipelineError) throw pipelineError

    const result = new AudioBuffer({ sampleRate, length: totalDecodedFrames, numberOfChannels })
    for (let c = 0; c < numberOfChannels; c++) {
        const merged = new Float32Array(totalDecodedFrames)
        let p = 0
        for (const arr of decodedChunks[c]) {
            merged.set(arr, p)
            p += arr.length
        }
        result.copyToChannel(merged, c, 0)
    }
    return result
}
