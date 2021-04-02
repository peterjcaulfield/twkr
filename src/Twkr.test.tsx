import React from "react";
import { screen, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
const tokens = {
  FOO: "BAR",
};

const folderize = (folder: string, schema: any, collapsed = false) => ({
  [folder]: {
    type: "FOLDER",
    schema,
    settings: {
      collapsed,
    },
  },
});

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
      folderize("Used Tokens", tokens)
    );
  });

  test("target controls are separated by keys that are accessed", () => {
    const useControlMock = jest.fn(() => [tokens]);
    jest.doMock("leva", () => ({
      useControls: useControlMock,
    }));

    const Twkr = require("../src/Twkr.component.tsx").Twkr;

    const unusedTokens = { BAZ: "QUX" };
    const partiallyUsed = { ...tokens, ...unusedTokens };

    render(
      <Twkr target={partiallyUsed}>
        {(tokens: any) => <span>{tokens.FOO}</span>}
      </Twkr>
    );

    expect(useControlMock).toHaveBeenCalled();
    expect((useControlMock as jest.Mock).mock.calls[0][0]()).toMatchObject({
      ...folderize("Used Tokens", tokens),
      ...folderize("Unused Tokens", unusedTokens, true),
    });
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
      folderize("Used Tokens", controlMap)
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
    expect((useControlMock as jest.Mock).mock.calls[0][0]()).toMatchObject(
      folderize("Used Tokens", {
        FOO: keyToControl(tokens, "FOO"),
      })
    );
  });

  test("tokens can be grouped in to folders via tokenGroups", () => {
    const useControlMock = jest.fn(() => [tokens]);
    jest.doMock("leva", () => ({
      useControls: useControlMock,
    }));
    const Twkr = require("../src/Twkr.component.tsx").Twkr;

    const tokens = {
      fontFamily: "verdana",
    };

    render(
      <Twkr
        target={tokens}
        tokenGroups={{ typography: new Set(["fontFamily"]) }}
      >
        {(tokens: any) => <span>{tokens.fontFamily}</span>}
      </Twkr>
    );

    const expectedConfig = {
      typography: {
        type: "FOLDER",
        schema: {
          fontFamily: "verdana",
        },
        settings: {
          collapsed: true,
        },
      },
    };

    expect(useControlMock).toHaveBeenCalled();
    expect((useControlMock as jest.Mock).mock.calls[0][0]()).toMatchObject(
      folderize("Used Tokens", expectedConfig)
    );
  });

  test("tokens can be grouped in to folders via keyToGroup", () => {
    const useControlMock = jest.fn(() => [tokens]);
    jest.doMock("leva", () => ({
      useControls: useControlMock,
    }));
    const Twkr = require("../src/Twkr.component.tsx").Twkr;

    const tokens = {
      fontFamily: "verdana",
    };

    const keyToGroup = (key: string) => {
      if (key === "fontFamily") return "typography";

      return null;
    };

    render(
      <Twkr target={tokens} keyToGroup={keyToGroup}>
        {(tokens: any) => <span>{tokens.fontFamily}</span>}
      </Twkr>
    );

    const expectedConfig = {
      typography: {
        type: "FOLDER",
        schema: {
          fontFamily: "verdana",
        },
        settings: {
          collapsed: true,
        },
      },
    };

    expect(useControlMock).toHaveBeenCalled();
    expect((useControlMock as jest.Mock).mock.calls[0][0]()).toMatchObject(
      folderize("Used Tokens", expectedConfig)
    );
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
      folderize("Used Tokens", tokens)
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
      COLOR: "#ffffff",
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

    const input = document.getElementById(
      "leva__Used Tokens.FOO"
    ) as HTMLInputElement;
    input.setSelectionRange(0, 3);

    userEvent.type(input, "{del}");
    userEvent.type(input, "BAZ");

    userEvent.click(screen.getByText("Save"));

    const expectedSave = {
      ...tokens,
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
