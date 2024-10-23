import { useContext, useEffect, memo } from "react";
import classNames from "classnames";
import { Context } from "../Provider";
import "./Note.css";

const Note = ({ trackID, stepID, isNoteOn, isNoteOnCurrentStep, play }) => {
  const { toggleNote } = useContext(Context);
  const noteClassNames = classNames("note", {
    on: isNoteOn,
    playing: isNoteOn && isNoteOnCurrentStep,
  });

  useEffect(() => {
    if (isNoteOn && isNoteOnCurrentStep) {
      play();
    }
  }, [isNoteOn, isNoteOnCurrentStep, play]);

  const noteClicked = (e) => {
    e.target.classList.toggle("on");
    toggleNote({ trackID, stepID });
    play();
  };

  return <div className={noteClassNames} onClick={noteClicked} />;
};

export default memo(Note);
