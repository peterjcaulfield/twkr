import React, { useEffect, useState } from "react";
import { createPlugin, Components, useInputContext } from "leva/plugin";
import { useStoreContext } from "leva";
import { set } from "../storage";
import { Target } from "../Twkr.component";
import { InputWithSettings } from "leva/dist/declarations/src/types";
import styled from "styled-components";
import { darken } from "polished";

const Button = styled.button`
  display: block;
  outline: none;
  font-size: inherit;
  font-family: inherit;
  border: none;
  appearance: none;
  color: #fefefe;
  height: 24px;
  border-style: none;
  border-radius: 3px;
  background-color: #007bff;
  cursor: pointer;
  box-sizing: border-box;
  &:active {
    background-color: ${darken(0.1, "#007bff")};
  }
  margin-bottom: 5px;
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

/**
 * Values that are contained with in folders keyed in to the leva state using
 * the folder path. We want the original key for the token when persisting.
 */
const parseOriginalTokenKeyFromStateKey = (stateKey: string) => {
  const [key] = stateKey.split(".").reverse();
  return key;
};

const formatState = (state: Record<string, InputWithSettings<string>>) => {
  const formatted: Target = {};
  for (const key of Object.keys(state)) {
    formatted[parseOriginalTokenKeyFromStateKey(key)] = state[key].value;
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
      <Components.Row>
        <Button onClick={() => set(formatState(values))}>Save</Button>
      </Components.Row>
      <Components.Row>
        <Button onClick={() => set({})}>Clear</Button>
      </Components.Row>
      <Components.Row>
        <Button
          onClick={() =>
            copy({ ...(originalValues as Target), ...formatState(values) })
          }
        >
          Copy
        </Button>
      </Components.Row>
      <Components.Row>
        <Button
          onClick={() =>
            copyDelta(originalValues as Target, formatState(values))
          }
        >
          Copy Changed
        </Button>
      </Components.Row>
    </>
  );
}

export const persistControls = createPlugin({
  normalize,
  component: PersistControls,
});
