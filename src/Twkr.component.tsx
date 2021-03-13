import React, { useState, useEffect, useRef, useMemo } from "react";
import { useControls } from "leva";
import {
  Schema,
  FolderInput,
  // SpecialInputTypes,
} from "leva/dist/declarations/src/types";
import { get, set } from "./storage";
import { persistControls } from "./plugin/PersistControls";

export type Target = Record<string, string>;

type Folders = {
  [key: string]: Set<string>;
};

type KeyToControl = (
  target: Target,
  key: keyof typeof target
) => Schema[keyof Schema] | string;

export interface ITwkrProps {
  target: Target;
  controlMap?: Schema;
  keyToControl?: KeyToControl;
  children: (t: Target) => any;
  // TODO: propagate persistence key to storage somehow
  // it should be used as a _suffix to the root key
  persistenceKey?: string;
  tokenGroups?: Folders;
}

interface IInterceptor {
  get: (t: Target, prop: keyof typeof t) => string;
}

type TargetKeys = Set<string | number | symbol>;

const tweakable = (
  t: Target,
  getHandler: (
    ownKeys: TargetKeys,
    r: React.MutableRefObject<Set<keyof typeof t>>
  ) => IInterceptor,
  usedTokensRef: React.MutableRefObject<Set<keyof typeof t>>
) => new Proxy(t, getHandler(new Set(Reflect.ownKeys(t)), usedTokensRef));

const handler = (
  ownKeys: TargetKeys,
  usedTokensRef: React.MutableRefObject<Set<string>>
) => ({
  get: (t: Target, prop: keyof typeof t) => {
    if (!usedTokensRef.current.has(prop) && ownKeys.has(prop)) {
      usedTokensRef.current.add(prop);
    }

    return Reflect.get(t, prop);
  },
});

const sanitizedControlMappings = [
  {
    re: /^\d+px/, // pixel value strings
    control: (value: string) => ({
      value,
      min: 0,
      // TODO: this is prob too large?
      max: Number.MAX_SAFE_INTEGER,
    }),
  },
];

const getSanitizedSchemaItemFromToken = (
  token: string
): string | Schema[keyof Schema] => {
  let schemaItem = {};
  for (let i = 0; i < sanitizedControlMappings.length; i++) {
    if (sanitizedControlMappings[i].re.test(token)) {
      schemaItem = sanitizedControlMappings[i].control(token);
      return schemaItem;
    }
  }
  return token;
};

const getFolderForToken = (key: string, folders: Folders) => {
  const folder = Object.entries(folders).find(([_, tokens]) => tokens.has(key));

  return folder ? folder[0] : null;
};

const getUseTweakConfigFromProps = (
  tweaked: Set<keyof typeof t>,
  t: Target,
  c: Schema,
  f: KeyToControl,
  folders: Folders = {}
): Schema => {
  const trackedTweakConfig: Schema = {};
  const untrackedTweakConfig: Schema = {};
  for (const entry of Object.keys(t)) {
    let configForKey = tweaked.has(entry)
      ? trackedTweakConfig
      : untrackedTweakConfig;
    const folder = getFolderForToken(entry, folders);

    if (folder && !configForKey[folder]) {
      const folderInput: FolderInput<any> = {
        // TODO: tests break if I try to use the enum :(
        // type: SpecialInputTypes.FOLDER,
        // @ts-ignore
        type: "FOLDER",
        schema: {},
        settings: {
          collapsed: true,
        },
      };
      configForKey[folder] = folderInput;
    }

    let control;
    if (c && c[entry]) {
      control = c[entry];
    } else if (f) {
      control = f(t, entry);
    } else {
      control = getSanitizedSchemaItemFromToken(t[entry]);
    }

    if (folder) {
      (configForKey[folder] as FolderInput<any>).schema[entry] = control;
    } else {
      configForKey[entry] = control;
    }
  }

  const config: Schema = {};

  if (Object.keys(untrackedTweakConfig).length) {
    const untrackedTokenFolder: FolderInput<any> = {
      // TODO: tests break if I try to use the enum :(
      // type: SpecialInputTypes.FOLDER,
      // @ts-ignore
      type: "FOLDER",
      schema: untrackedTweakConfig,
      settings: {
        collapsed: true,
      },
    };
    config["Unused Tokens"] = untrackedTokenFolder;
  }

  return { ...trackedTweakConfig, ...config };
};

const getPersistControlsSchema = (originalTokenValues: Target) => ({
  persistence: persistControls(originalTokenValues),
});

export const Twkr: React.FC<ITwkrProps> = ({
  target,
  controlMap,
  keyToControl,
  children,
  tokenGroups,
}) => {
  const usedTokens = useRef<Set<string>>(new Set());
  const [mounted, setIsMounted] = useState(false);

  const hydratedTarget = useMemo(
    () => ({
      ...target,
      ...get(),
    }),
    [target]
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    return () => set(hydratedTarget);
  }, [hydratedTarget]);

  const [tweakTracked] = useState(() => tweakable(target, handler, usedTokens));

  return mounted ? (
    <TweakedChildren
      originalValues={target}
      target={hydratedTarget}
      tweaked={usedTokens.current}
      controlMap={controlMap}
      keyToControl={keyToControl}
      children={children}
      tokenGroups={tokenGroups}
    />
  ) : (
    children(tweakTracked)
  );
};

const TweakedChildren: React.FC<
  ITwkrProps & { tweaked: Set<string>; originalValues: Target }
> = ({
  children,
  originalValues,
  target,
  controlMap,
  keyToControl,
  tweaked,
  tokenGroups,
}) => {
  const [values] = useControls(() => ({
    ...getPersistControlsSchema(originalValues),
    ...getUseTweakConfigFromProps(
      tweaked,
      target,
      controlMap,
      keyToControl,
      tokenGroups
    ),
  }));

  const { persistence, ...tokens } = values;

  return <>{children(tokens as Target)}</>;
};
