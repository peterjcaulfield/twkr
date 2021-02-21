import React from "react";
import styled, { ThemeProvider } from "styled-components";
import { Twkr } from "../";

const tokens = {
  color: "#fff",
  spacingM: "1rem",
};

const Button = styled.button`
  background: ${(props) => props.theme.color};
  padding: ${(props) => props.theme.spacingM};
`;

export const App: React.FC = () => (
  <Twkr target={tokens}>
    {(tokens) => (
      <ThemeProvider theme={tokens}>
        <Button>Hello World</Button>
      </ThemeProvider>
    )}
  </Twkr>
);
