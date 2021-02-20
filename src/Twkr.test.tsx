import React from "react";
import { Twkr } from "./";
import { render } from "@testing-library/react";
import { useTweaks } from "use-tweaks";

// return same reference
const tweaksReturn = { FOO: "BAR" };
jest.mock("use-tweaks", () => ({
  useTweaks: jest.fn(() => tweaksReturn),
}));

const tokens = {
  FOO: "BAR",
};

describe("Twkr test", () => {
  test("target is proxied", () => {
    const controlMap = {
      FOO: { value: "BAR" },
    };
    render(
      <Twkr target={tokens} controlMap={controlMap}>
        {(tokens) => <span>{tokens.FOO}</span>}
      </Twkr>
    );

    expect(useTweaks).toHaveBeenLastCalledWith("test", {
      FOO: { value: "BAR" },
    });
  });

  test("target controls can be mapped via keyToControl", () => {
    const keyToControl = (t: Record<string, string>, key: keyof typeof t) => ({
      value: t[key],
    });
    render(
      <Twkr target={tokens} keyToControl={keyToControl}>
        {(tokens) => <span>{tokens.FOO}</span>}
      </Twkr>
    );

    expect(useTweaks).toHaveBeenLastCalledWith("test", {
      FOO: { value: "BAR" },
    });
  });
});
