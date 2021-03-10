import React from "react";
import styled, { ThemeProvider } from "styled-components";
import { Twkr, Target } from "../";

const tokens = {
  color: "#fff",
  spacingM: "1rem",
  fontFamily: "Verdana",
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
  <>
    <Twkr
      target={tokens}
      keyToControl={keyToControl}
      tokenGroups={{ typography: new Set(["fontFamily"]) }}
    >
      {(tokens) => (
        <ThemeProvider theme={tokens}>
          {JSON.stringify(tokens)}
          <Button>Hello World</Button>
        </ThemeProvider>
      )}
    </Twkr>
  </>
);
