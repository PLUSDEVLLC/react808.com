import { useRef, useLayoutEffect, memo } from "react";
import "./PlayHead.css";

const PlayHead = ({
  notesAreaWidthInPixels,
  timePerSequence,
  totalLapsedTime,
}) => {
  const PlayHead = useRef(null);

  useLayoutEffect(() => {
    let progress = Math.min(
      (totalLapsedTime % timePerSequence) / timePerSequence,
      1
    );

    PlayHead.current.style.transform =
      "translate3d(" +
      (progress * notesAreaWidthInPixels).toFixed(2) +
      "px, 0, 0px)";
  }, [notesAreaWidthInPixels, timePerSequence, totalLapsedTime]);

  return <div className="play_head" ref={PlayHead}></div>;
};

export default memo(PlayHead);
