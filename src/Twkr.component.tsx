import React, { useState, useEffect, useRef, useMemo } from "react";
import { useControls } from "leva";
import { Schema, FolderInput } from "leva/dist/declarations/src/types";
// we gotta import the enum from src: https://github.com/kulshekhar/ts-jest/issues/1229#issuecomment-569906667
import { SpecialInputs } from "leva/src/types";
import { get, set } from "./storage";
import { persistControls } from "./plugin/PersistControls";
export { LevaInputs as InputTypes } from "leva";

export type Target = Record<string, string>;

type Folders = {
  [key: string]: Set<string>;
};

type KeyToControl = (
  target: Target,
  key: keyof typeof target
) => Schema[keyof Schema] | string;

type KeyToGroup = (key: string) => string | null;

export interface ITwkrProps {
  target: Target;
  controlMap?: Schema;
  keyToControl?: KeyToControl;
  children: (t: Target) => any;
  // TODO: propagate persistence key to storage somehow
  // it should be used as a _suffix to the root key
  persistenceKey?: string;
  tokenGroups?: Folders;
  keyToGroup?: KeyToGroup;
}

interface IInterceptor {
  get: (t: Target, prop: keyof typeof t) => string;
}

const tweakable = <T extends Target, K extends keyof T>(
  t: T,
  getHandler: (
    ownKeys: Set<K>,
    r: React.MutableRefObject<Set<K>>
  ) => IInterceptor,
  usedTokensRef: React.MutableRefObject<Set<K>>
) =>
  new Proxy(t, getHandler(new Set(Reflect.ownKeys(t) as K[]), usedTokensRef));

const handler = <T extends Target>(
  ownKeys: Set<keyof T>,
  usedTokensRef: React.MutableRefObject<Set<keyof T>>
): IInterceptor => ({
  get: (t: T, prop: keyof T) => {
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

const noop = (): null => null;
const getFolderForToken = (
  key: string,
  folders: Folders,
  keyToGroup: KeyToGroup = noop
) => {
  const folder = Object.entries(folders).find(([_, tokens]) => tokens.has(key));

  return folder ? folder[0] : keyToGroup(key);
};

const createFolder = (schema = {}, collapsed = false): FolderInput<any> => ({
  type: SpecialInputs.FOLDER,
  schema,
  settings: {
    collapsed,
  },
});

const USED_TOKENS_FOLDER = "Used Tokens";
const UNUSED_TOKENS_FOLDER = "Unused Tokens";

const getUseTweakConfigFromProps = <T extends Target, K extends keyof T>(
  tweaked: Set<K>,
  t: Target,
  c: Schema,
  f: KeyToControl,
  g: KeyToGroup,
  folders: Folders = {}
): Schema => {
  const trackedTweakConfig: Schema = {};
  const untrackedTweakConfig: Schema = {};

  for (const entry of Object.keys(t)) {
    let configForKey = tweaked.has(entry as K)
      ? trackedTweakConfig
      : untrackedTweakConfig;

    const folder = getFolderForToken(entry, folders, g);

    if (folder && !configForKey[folder]) {
      configForKey[folder] = createFolder({}, true);
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

  config[USED_TOKENS_FOLDER] = createFolder(trackedTweakConfig);

  if (Object.keys(untrackedTweakConfig).length) {
    config[UNUSED_TOKENS_FOLDER] = createFolder(untrackedTweakConfig, true);
  }

  return config;
};

const getPersistControlsSchema = (originalTokenValues: Target) => ({
  persistence: persistControls(originalTokenValues),
});

export const Twkr: React.FC<ITwkrProps> = ({
  target,
  controlMap,
  keyToControl,
  keyToGroup,
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
      keyToGroup={keyToGroup}
      children={children}
      tokenGroups={tokenGroups}
    />
  ) : (
    children(tweakTracked)
  );
};

const TweakedChildren: React.FC<ITwkrProps & {
  tweaked: Set<string>;
  originalValues: Target;
}> = ({
  children,
  originalValues,
  target,
  controlMap,
  keyToControl,
  keyToGroup,
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
      keyToGroup,
      tokenGroups
    ),
  }));

  const { persistence, ...tokens } = values;

  return <>{children(tokens as Target)}</>;
};
