import React, { useState } from "react";
import { Twkr } from "./";
import { render, screen } from "@testing-library/react";

// return same reference
const tweaksReturn = { FOO: "BAR" };
jest.mock("use-tweaks", () => ({
  useTweaks: () => tweaksReturn,
}));

const tokens = {
  FOO: "BAR",
};

const controlMap = {
  FOO: { value: "BAR" },
};

describe("Twkr test", () => {
  test("target is proxied", () => {
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
