import { useState } from "react";
import "./Debug.css";

const Debug = ({ enabled, ...displayProps }) => {
  const [on, setOn] = useState(enabled);

  const propValues = Object.keys(displayProps).map((prop) => (
    <li key={prop}>
      <dl>
        <dt>{prop} = </dt>
        <dd>{displayProps[prop]};</dd>
      </dl>
    </li>
  ));

  return (
    <ul className="debug">
      <li>
        <label>
          <input
            type="checkbox"
            onChange={(e) => setOn(e.target.checked)}
            value={on}
            defaultChecked={on}
          />
          Debug
        </label>
      </li>
      {on && <>{propValues}</>}
    </ul>
  );
};

export default Debug;
