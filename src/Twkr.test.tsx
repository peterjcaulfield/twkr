import React, { useState } from "react";
import { Twkr } from "./";
import { render, screen } from "@testing-library/react";

const getKeyValuesFromTweakConfig = (
  config: Record<string, { value: string }>
) => {
  return Object.keys(config).reduce(
    (acc: Record<string, string>, key: keyof typeof config) => {
      acc[key] = config[key].value;
      return acc;
    },
    {}
  );
};

const tweaksReturn = { FOO: "BAR" };
jest.mock("use-tweaks", () => ({
  useTweaks: (_: any, map: any) => tweaksReturn,
}));

const tokens = {
  FOO: "BAR",
};

const controlMap = {
  FOO: { value: "BAR" },
};

describe("Twkr test", () => {
  test("target is proxied", () => {
    console.log(getKeyValuesFromTweakConfig({ FOO: { value: "bar" } }));

    render(
      <Twkr target={tokens} controlMap={controlMap}>
        {(tokens) => {
          return <span>{tokens.FOO}</span>;
        }}
      </Twkr>
    );

    screen.debug();
  });
});
