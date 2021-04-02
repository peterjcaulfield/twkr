import React from "react";
import { ThemeProvider, useTheme } from "styled-components";
import { Twkr, ITwkrProps } from "./";

type StyledTwkrProps = Omit<ITwkrProps, "target" | "children"> & {
  children: React.ReactElement;
};

export const StyledTwkr: React.FC<StyledTwkrProps> = ({
  children,
  ...unhandledProps
}) => {
  const trackedTheme = { ...useTheme() };
  return (
    <Twkr target={trackedTheme} {...unhandledProps}>
      {(tokens: any) => (
        <ThemeProvider theme={() => tokens}>
          {React.cloneElement(children)}
        </ThemeProvider>
      )}
    </Twkr>
  );
};
