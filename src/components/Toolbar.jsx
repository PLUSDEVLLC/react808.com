import { useContext, memo, useState } from "react";
import { sequenceList } from "../constants/config";
import { Context } from "../Provider";
import {
  renderSequence,
  audioBufferToWavBlob,
  downloadBlob,
} from "../utils/exportWav";
import { applyOpusLofi, isWebCodecsSupported } from "../utils/lofiCodec";
import "./Toolbar.css";

const LOFI_OPTIONS = [
  { value: 0, label: "Hi-Fi" },
  { value: 64000, label: "64k Opus" },
  { value: 32000, label: "32k Opus" },
  { value: 16000, label: "16k Opus" },
  { value: 6000, label: "6k Opus" },
];

const ToolBar = ({
  setStartTime,
  setPastLapse,
  setBPM,
  isSequencePlaying,
  startTime,
  BPM,
  totalSteps,
  totalBeats,
}) => {
  const { sequence, selectSequence } = useContext(Context);
  const { id: selectedSequenceID, title: sequenceTitle } = sequence;
  const [isSaving, setIsSaving] = useState(false);
  const [lofiBitrate, setLofiBitrate] = useState(0);

  function togglePlayback() {
    if (isSequencePlaying) {
      setPastLapse((l) => l + performance.now() - startTime);
      setStartTime(null);
    } else {
      setStartTime(performance.now());
    }
  }

  function stopPlayback() {
    setPastLapse(0);
    setStartTime(null);
  }

  function updateBPM(e) {
    setBPM(e.target.value);
  }

  async function saveTrack() {
    setIsSaving(true);
    try {
      // Opus only natively supports 8/12/16/24/48kHz; render at 48k when lo-fi
      // is enabled to avoid an extra resampling step before the encoder.
      const sampleRate = lofiBitrate ? 48000 : 44100;
      const rendered = await renderSequence({
        sequence,
        BPM: Number(BPM),
        totalSteps,
        totalBeats,
        sampleRate,
      });
      const finalBuffer = lofiBitrate
        ? await applyOpusLofi(rendered, lofiBitrate)
        : rendered;
      const safeName = String(sequenceTitle).replace(/\s+/g, "_").toLowerCase();
      const suffix = lofiBitrate ? `_opus${lofiBitrate / 1000}k` : "";
      downloadBlob(
        audioBufferToWavBlob(finalBuffer),
        `${safeName}_${BPM}bpm${suffix}.wav`,
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <nav className="toolbar">
      <button
        className="form_element button_stop"
        onClick={stopPlayback}
        aria-label="Stop"
      >
        <svg width="14" height="14" viewBox="0 0 14 14">
          <rect
            className="button_icon_path"
            x="2"
            y="2"
            width="10"
            height="10"
          />
        </svg>
      </button>
      <button
        className="form_element button_play_pause"
        onClick={togglePlayback}
        aria-label="Play / Pause"
      >
        <svg width="14" height="14" viewBox="8 8 20 20">
          {isSequencePlaying && (
            <path
              className="button_icon_path"
              id="pause-icon"
              data-state="playing"
              d="M11,10 L17,10 17,26 11,26 M20,10 L26,10 26,26 20,26"
            />
          )}
          {!isSequencePlaying && (
            <path
              className="button_icon_path"
              id="play-icon"
              data-state="paused"
              d="M11,10 L18,13.74 18,22.28 11,26 M18,13.74 L26,18 26,18 18,22.28"
            />
          )}
        </svg>
      </button>
      <input
        className="form_element input_bpm"
        id="bpm"
        type="text"
        value={BPM}
        onChange={updateBPM}
      />
      <label className="label_bpm" htmlFor="bpm">
        BPM
      </label>
      <select
        className="form_element select_lofi"
        value={lofiBitrate}
        onChange={(e) => setLofiBitrate(+e.target.value)}
        disabled={!isWebCodecsSupported}
        aria-label="Lo-fi bitrate"
        title={
          isWebCodecsSupported
            ? "Run the saved track through Opus at this bitrate"
            : "WebCodecs not supported in this browser"
        }
      >
        {LOFI_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <button
        className="form_element button_save"
        onClick={saveTrack}
        disabled={isSaving}
        aria-label="Save track to WAV file"
        title="Save track to WAV file"
      >
        {isSaving ? "..." : "SAVE"}
      </button>
      <select
        className="form_element select_sequence"
        value={selectedSequenceID}
        onChange={(e) => selectSequence(+e.target.value)}
        aria-label="Select sequence"
      >
        {sequenceList.map((seq) => {
          return (
            <option key={seq.id} value={seq.id}>
              {seq.title}
            </option>
          );
        })}
      </select>
    </nav>
  );
};

export default memo(ToolBar);
