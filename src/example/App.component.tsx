import React from "react";
import { Twkr } from "../";

const tokens = {
  text: "FOO",
  color: "#fff",
  number: 10,
};

const keyToControl = (t: Record<string, string>, key: keyof typeof t) => ({
  value: t[key],
});

export const App: React.FC = () => (
  <Twkr target={tokens} keyToControl={keyToControl}>
    {(tokens) => <span>{JSON.stringify(tokens)}</span>}
  </Twkr>
);
