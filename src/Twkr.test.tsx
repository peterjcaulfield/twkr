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

const controlMap = {
  FOO: { value: "BAR" },
};

describe("Twkr test", () => {
  test("target is proxied", () => {
    render(
      <Twkr target={tokens} controlMap={controlMap}>
        {(tokens) => <span>{tokens.FOO}</span>}
      </Twkr>
    );

    expect(useTweaks).toHaveBeenLastCalledWith("test", {
      FOO: { value: "BAR" },
    });
  });
});
