import React, { useEffect, useState } from "react";
import { createPlugin, Row, useInputContext } from "leva/plugins";
import { useStoreContext } from "leva";
import { set } from "../storage";
import { Target } from "../Twkr.component";
import { InputWithSettings } from "leva/dist/declarations/src/types";
import styled from "styled-components";
import { darken, cssVar } from "polished";

const Button = styled.button`
  display: block;
  outline: none;
  font-size: inherit;
  font-family: inherit;
  border: none;
  appearance: none;
  font-weight: var(--fontWeights-button);
  color: var(--colors-highlight3);
  height: var(--sizes-rowHeight);
  border-style: none;
  border-radius: var(--radii-sm);
  background-color: var(--colors-accent2);
  cursor: pointer;
  box-sizing: border-box;
  &:active {
    background-color: ${darken(
      0.1,
      cssVar("--colors-accent2", "#fff") as string
    )};
  }
`;

const copy = async (values: Target) => {
  try {
    await navigator.clipboard.writeText(JSON.stringify(values, null, 2));
  } catch (e) {
    console.error("Unable to copy tokens to clipboard");
    console.error(e);
  }
};

const isColorToken = (token: string) => /^#[a-zA-Z0-9]+$/.test(token);

const compare = (a: string, b: string) => {
  if (isColorToken(a) && isColorToken(b)) {
    return a.toLowerCase() == b.toLowerCase();
  }
  return a == b;
};

const copyDelta = (s1: Target, s2: Target) => {
  const delta: Target = {};
  for (const key of Object.keys(s2)) {
    if (!compare(s1[key], s2[key])) {
      delta[key] = s2[key];
    }
  }
  copy(delta);
};

const formatState = (state: Record<string, InputWithSettings<string>>) => {
  const formatted: Target = {};
  for (const key of Object.keys(state)) {
    formatted[key] = state[key].value;
  }
  return formatted;
};

const normalize = (originalValues: Target) => {
  return { value: originalValues };
};

function PersistControls() {
  const store = useStoreContext();
  const [values, setValues] = useState(() => {
    const { persistence, ...values } = store.getData();
    // should be Record<string, DataItem> but DataItem is not exposed in leva
    // types
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
        <Button onClick={() => set(formatState(values))}>Save</Button>
      </Row>
      <Row>
        <Button onClick={() => set({})}>Clear</Button>
      </Row>
      <Row>
        <Button
          onClick={() => copy({ ...originalValues, ...formatState(values) })}
        >
          Copy
        </Button>
        <Button onClick={() => copyDelta(originalValues, formatState(values))}>
          Copy Changed
        </Button>
      </Row>
    </>
  );
}

export const persistControls = createPlugin({
  normalize,
  component: PersistControls,
});
