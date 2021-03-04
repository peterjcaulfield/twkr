import React from "react";
import styled, { ThemeProvider } from "styled-components";
import { Twkr, Target } from "../";

const tokens = {
  color: "#fff",
  spacingM: "1rem",
  dropShadow:
    "1px 0 4px 0px rgba(194, 86, 8, 0.15), 1px 0 12px 0px rgba(40, 42, 46, 0.33)",
};

const Button = styled.button`
  background: ${(props) => props.theme.color};
  padding: ${(props) => props.theme.spacingM};
  box-shadow: ${(props) => props.theme.dropShadow};
`;

const keyToControl = (t: Target, key: string) => {
  let control;
  if (key.includes("Shadow")) {
    control = {
      value: t[key],
      type: "STRING",
    };
  } else {
    control = t[key];
  }
  return control;
};

export const App: React.FC = () => (
  <Twkr keyToControl={keyToControl} target={tokens}>
    {(tokens) => (
      <ThemeProvider theme={tokens}>
        <Button>Hello World</Button>
      </ThemeProvider>
    )}
  </Twkr>
);
