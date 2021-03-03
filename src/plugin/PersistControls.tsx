import React, { useEffect, useState } from "react";
import { createPlugin, Row, useInputContext } from "leva/plugins";
import { useStoreContext } from "leva";
import { set } from "../storage";
import { Target } from "../Twkr.component";
import { InputWithSettings } from "leva/dist/declarations/src/types";

const copy = async (values: Target) => {
  try {
    await navigator.clipboard.writeText(JSON.stringify(values));
  } catch (e) {
    alert(e);
  }
};

const normalize = (originalValues: Target) => {
  return { value: originalValues };
};

const formatState = (state: Record<string, InputWithSettings<string>>) => {
  const formatted: Target = {};
  for (const key of Object.keys(state)) {
    formatted[key] = state[key].value;
  }
  return formatted;
};

const copyDelta = (s1: Target, s2: Target) => {
  const delta: Target = {};
  for (const key of Object.keys(s2)) {
    if (s1[key] != s2[key]) {
      delta[key] = s2[key];
    }
  }
  copy(delta);
};

function PersistControls() {
  const store = useStoreContext();
  const [values, setValues] = useState(() => {
    const { persistence, ...values } = store.getData();
    return values as Record<string, InputWithSettings<string>>;
  });
  const { value: originalValues } = useInputContext();

  useEffect(() => {
    const handler = (state: any) => {
      const { persistence, ...values } = state.data;
      setValues(values);
    };
    const unsub = store.useStore.subscribe(handler);
    return () => unsub();
  }, []);

  return (
    <>
      <Row>
        <button onClick={() => set(values)}>Save</button>
      </Row>
      <Row>
        <button onClick={() => set({})}>Clear</button>
      </Row>
      <Row>
        <button onClick={() => copy(formatState(values))}>Copy</button>
        <button onClick={() => copyDelta(originalValues, formatState(values))}>
          Copy Changed
        </button>
      </Row>
    </>
  );
}

export const persistControls = createPlugin({
  normalize,
  component: PersistControls,
});
