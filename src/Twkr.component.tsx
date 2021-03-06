import React, { useState, useEffect, useRef, useMemo } from "react";
import { useControls } from "leva";
import { Schema } from "leva/dist/declarations/src/types";
import { get, set } from "./storage";
import { persistControls } from "./plugin/PersistControls";

export type Target = Record<string, string>;

type KeyToControl = (
  target: Target,
  key: keyof typeof target
) => Schema[keyof Schema] | string;

interface ITwkrProps {
  target: Target;
  controlMap?: Schema;
  keyToControl?: KeyToControl;
  children: (t: Target) => React.ReactElement;
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

const getUseTweakConfigFromProps = (
  tweaked: Set<keyof typeof t>,
  t: Target,
  c: Schema,
  f: KeyToControl
): Schema => {
  const tweakConfig: Schema = {};
  for (const entry of tweaked) {
    if (c && c[entry]) {
      tweakConfig[entry] = c[entry];
    } else if (f) {
      tweakConfig[entry] = f(t, entry);
    } else {
      tweakConfig[entry] = getSanitizedSchemaItemFromToken(t[entry]);
    }
  }
  return tweakConfig;
};

const getPersistControlsSchema = (originalTokenValues: Target) => ({
  persistence: persistControls(originalTokenValues),
});

export const Twkr: React.FC<ITwkrProps> = ({
  target,
  controlMap,
  keyToControl,
  children,
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
}) => {
  const [values] = useControls(() => ({
    ...getPersistControlsSchema(originalValues),
    ...getUseTweakConfigFromProps(tweaked, target, controlMap, keyToControl),
  }));

  const { persistence, ...tokens } = values;

  return <>{children(tokens as Target)}</>;
};
