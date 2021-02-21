import React from "react";
import { Twkr } from "./";
import { render, cleanup } from "@testing-library/react";
import { useControls } from "leva";

// return same reference
const levaReturn = { FOO: "BAR" };
jest.mock("leva", () => ({
  useControls: jest.fn(() => [levaReturn]),
}));

const tokens = {
  FOO: "BAR",
};

describe("Twkr test", () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  test("target controls default to using the target key/value", () => {
    render(
      <Twkr target={tokens}>{(tokens) => <span>{tokens.FOO}</span>}</Twkr>
    );

    expect(useControls).toHaveBeenCalled();
    expect((useControls as jest.Mock).mock.calls[0][0]()).toEqual(tokens);
  });

  test("target controls can be mapped via controlMap", () => {
    const controlMap = {
      FOO: { value: "BAR" },
    };
    render(
      <Twkr key="bloop" target={tokens} controlMap={controlMap}>
        {(tokens) => <span>{tokens.FOO}</span>}
      </Twkr>
    );

    expect(useControls).toHaveBeenCalled();
    expect((useControls as jest.Mock).mock.calls[0][0]()).toEqual(controlMap);
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

    expect(useControls).toHaveBeenCalled();
    expect((useControls as jest.Mock).mock.calls[0][0]()).toEqual({
      FOO: keyToControl(tokens, "FOO"),
    });
  });
});
