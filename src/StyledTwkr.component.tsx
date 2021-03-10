import React from "react";
import { ThemeProvider, useTheme } from "styled-components";
import { Twkr } from "./";

export const StyledTwkr: React.FC<{
  children: React.ReactElement;
  peristenceKey?: string;
}> = (props) => {
  const trackedTheme = { ...useTheme() };
  return (
    <Twkr target={trackedTheme} persistenceKey={props.peristenceKey}>
      {(tokens: any) => (
        <ThemeProvider theme={() => tokens}>
          {React.cloneElement(props.children)}
        </ThemeProvider>
      )}
    </Twkr>
  );
};
