import { useContext, memo, useState } from "react";
import { sequenceList } from "../constants/config";
import { Context } from "../Provider";
import { renderSequenceToWav, downloadBlob } from "../utils/exportWav";
import "./Toolbar.css";

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
      const blob = await renderSequenceToWav({
        sequence,
        BPM: Number(BPM),
        totalSteps,
        totalBeats,
      });
      const safeName = String(sequenceTitle).replace(/\s+/g, "_").toLowerCase();
      downloadBlob(blob, `${safeName}_${BPM}bpm.wav`);
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
