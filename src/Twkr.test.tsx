import React from "react";
import { screen, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
const tokens = {
  FOO: "BAR",
};

describe("Twkr test", () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.dontMock("leva");
    jest.resetModules();
  });

  test("target controls default to using the target key/value", () => {
    const useControlMock = jest.fn(() => [tokens]);
    jest.doMock("leva", () => ({
      useControls: useControlMock,
    }));
    const Twkr = require("../src/Twkr.component.tsx").Twkr;

    render(
      <Twkr target={tokens}>{(tokens: any) => <span>{tokens.FOO}</span>}</Twkr>
    );

    expect(useControlMock).toHaveBeenCalled();
    expect((useControlMock as jest.Mock).mock.calls[0][0]()).toMatchObject(
      tokens
    );
  });

  test("target controls only generated for keys that are accessed", () => {
    const useControlMock = jest.fn(() => [tokens]);
    jest.doMock("leva", () => ({
      useControls: useControlMock,
    }));

    const Twkr = require("../src/Twkr.component.tsx").Twkr;

    const partiallyUsed = { ...tokens, BAZ: "QUX" };

    render(
      <Twkr target={partiallyUsed}>
        {(tokens: any) => <span>{tokens.FOO}</span>}
      </Twkr>
    );

    expect(useControlMock).toHaveBeenCalled();
    expect((useControlMock as jest.Mock).mock.calls[0][0]()).toMatchObject(
      tokens
    );
  });

  test("target controls can be mapped via controlMap", () => {
    const useControlMock = jest.fn(() => [tokens]);
    jest.doMock("leva", () => ({
      useControls: useControlMock,
    }));
    const Twkr = require("../src/Twkr.component.tsx").Twkr;

    const controlMap = {
      FOO: { value: "BAR" },
    };
    render(
      <Twkr target={tokens} controlMap={controlMap}>
        {(tokens: any) => <span>{tokens.FOO}</span>}
      </Twkr>
    );

    expect(useControlMock).toHaveBeenCalled();
    expect((useControlMock as jest.Mock).mock.calls[0][0]()).toMatchObject(
      controlMap
    );
  });

  test("target controls can be mapped via keyToControl", () => {
    const useControlMock = jest.fn(() => [tokens]);
    jest.doMock("leva", () => ({
      useControls: useControlMock,
    }));
    const Twkr = require("../src/Twkr.component.tsx").Twkr;

    const keyToControl = (t: Record<string, string>, key: keyof typeof t) => ({
      value: t[key],
    });
    render(
      <Twkr target={tokens} keyToControl={keyToControl}>
        {(tokens: any) => <span>{tokens.FOO}</span>}
      </Twkr>
    );

    expect(useControlMock).toHaveBeenCalled();
    expect((useControlMock as jest.Mock).mock.calls[0][0]()).toMatchObject({
      FOO: keyToControl(tokens, "FOO"),
    });
  });

  test("prototype property accesses are not tracked", () => {
    const useControlMock = jest.fn(() => [tokens]);
    jest.doMock("leva", () => ({
      useControls: useControlMock,
    }));
    const Twkr = require("../src/Twkr.component.tsx").Twkr;

    render(
      <Twkr target={tokens}>
        {(tokens: any) => <span>{JSON.stringify(tokens)}</span>}
      </Twkr>
    );

    expect(useControlMock).toHaveBeenCalled();
    expect((useControlMock as jest.Mock).mock.calls[0][0]()).toMatchObject(
      tokens
    );
    expect(
      Object.keys((useControlMock as jest.Mock).mock.calls[0][0]()).indexOf(
        "toJSON"
      )
    ).toEqual(-1);
  });

  test("persistence works", async () => {
    const tokens = {
      FOO: "BAR",
      COLOR: "#FFFFFF",
    };
    jest.doMock("leva", () => jest.requireActual("leva"));
    const storageMock = {
      get: jest.fn(() => ({})),
      set: jest.fn(),
    };
    jest.mock("./storage", () => storageMock);

    const Twkr = require("../src/Twkr.component.tsx").Twkr;

    render(
      <Twkr target={tokens}>{(tokens: any) => <span>{tokens.FOO}</span>}</Twkr>
    );

    const input = document.getElementById("FOO") as HTMLInputElement;
    input.setSelectionRange(0, 3);

    userEvent.type(input, "{del}");
    userEvent.type(input, "BAZ");

    userEvent.click(screen.getByText("Save"));

    const expectedSave = {
      FOO: "BAZ",
    };

    expect(storageMock.set).toHaveBeenLastCalledWith(expectedSave);

    const expectedCopy = {
      ...tokens,
      FOO: "BAZ",
    };

    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: jest.fn() },
    });

    userEvent.click(screen.getByText("Copy"));

    expect(navigator.clipboard.writeText).toHaveBeenLastCalledWith(
      JSON.stringify(expectedCopy, null, 2)
    );

    const expectedDeltaCopy = {
      FOO: "BAZ",
    };

    userEvent.click(screen.getByText("Copy Changed"));

    expect(navigator.clipboard.writeText).toHaveBeenLastCalledWith(
      JSON.stringify(expectedDeltaCopy, null, 2)
    );

    userEvent.click(screen.getByText("Clear"));

    expect(storageMock.set).toHaveBeenLastCalledWith({});
  });
});
