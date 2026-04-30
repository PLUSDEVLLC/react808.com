import { soundFiles } from '../constants/config'

export async function renderSequenceToWav({ sequence, BPM, totalSteps, totalBeats }) {
    const sampleRate = 44100
    const numChannels = 2
    const tailSeconds = 1
    const durationSeconds = (60 / BPM) * totalBeats + tailSeconds
    const secondsPerStep = ((60 / BPM) * totalBeats) / totalSteps

    const offlineCtx = new OfflineAudioContext(
        numChannels,
        Math.ceil(durationSeconds * sampleRate),
        sampleRate
    )

    const uniquePaths = [...new Set(sequence.trackList.map(t => soundFiles[t.soundFile]))]
    const decoded = {}
    await Promise.all(
        uniquePaths.map(async (path) => {
            const res = await fetch(path)
            const arrayBuffer = await res.arrayBuffer()
            decoded[path] = await offlineCtx.decodeAudioData(arrayBuffer)
        })
    )

    for (const track of sequence.trackList) {
        const buffer = decoded[soundFiles[track.soundFile]]
        for (const stepID of track.onNotes) {
            const src = offlineCtx.createBufferSource()
            src.buffer = buffer
            src.connect(offlineCtx.destination)
            src.start(stepID * secondsPerStep)
        }
    }

    const rendered = await offlineCtx.startRendering()
    return audioBufferToWavBlob(rendered)
}

function audioBufferToWavBlob(buffer) {
    const numChannels = buffer.numberOfChannels
    const sampleRate = buffer.sampleRate
    const bytesPerSample = 2
    const dataSize = buffer.length * numChannels * bytesPerSample
    const ab = new ArrayBuffer(44 + dataSize)
    const view = new DataView(ab)

    let offset = 0
    const writeStr = (s) => {
        for (let i = 0; i < s.length; i++) view.setUint8(offset++, s.charCodeAt(i))
    }
    const writeU32 = (v) => { view.setUint32(offset, v, true); offset += 4 }
    const writeU16 = (v) => { view.setUint16(offset, v, true); offset += 2 }

    writeStr('RIFF')
    writeU32(36 + dataSize)
    writeStr('WAVE')
    writeStr('fmt ')
    writeU32(16)
    writeU16(1)
    writeU16(numChannels)
    writeU32(sampleRate)
    writeU32(sampleRate * numChannels * bytesPerSample)
    writeU16(numChannels * bytesPerSample)
    writeU16(16)
    writeStr('data')
    writeU32(dataSize)

    const channels = []
    for (let c = 0; c < numChannels; c++) channels.push(buffer.getChannelData(c))
    for (let i = 0; i < buffer.length; i++) {
        for (let c = 0; c < numChannels; c++) {
            const s = Math.max(-1, Math.min(1, channels[c][i]))
            view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
            offset += 2
        }
    }

    return new Blob([ab], { type: 'audio/wav' })
}

export function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
}
