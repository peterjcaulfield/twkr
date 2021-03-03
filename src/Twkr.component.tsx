import React, { useState, useEffect, useRef, useMemo } from "react";
import { useControls } from "leva";
import { Schema } from "leva/dist/declarations/src/types";
import { get, set } from "./storage";
import { persistControls } from "./plugin/PersistControls";

export type Target = Record<string, string>;
type KeyToControl = (target: Target, key: keyof typeof target) => Schema;

interface ITwkrProps {
  target: Target;
  controlMap?: Schema;
  keyToControl?: KeyToControl;
  children: (t: Target) => React.ReactElement;
}

interface IInterceptor {
  get: (t: Target, prop: keyof typeof t) => string;
}

const tweakable = (
  t: Target,
  getHandler: (r: React.MutableRefObject<Set<keyof typeof t>>) => IInterceptor,
  usedTokensRef: React.MutableRefObject<Set<keyof typeof t>>
) => new Proxy(t, getHandler(usedTokensRef));

const handler = (usedTokensRef: React.MutableRefObject<Set<string>>) => ({
  get: (t: Target, prop: keyof typeof t) => {
    // TODO: has own property check via Reflect somehow
    if (!usedTokensRef.current.has(prop) && prop !== "toJSON") {
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
      max: Number.MAX_SAFE_INTEGER,
    }),
  },
];

const getSantizedControlFromToken = (token: string) => {
  let control: Schema;
  for (let i = 0; i < sanitizedControlMappings.length; i++) {
    if (sanitizedControlMappings[i].re.test(token)) {
      control = sanitizedControlMappings[i].control(token);
      return control;
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
      // TODO fix type f(t, entry) returns a SchemaItem rather than a Schema
      // but SchemaItem is not exposed as an export from leva yet
      // @ts-ignore
      tweakConfig[entry] = f(t, entry);
    } else {
      // default to just using the value/sanitized control from value
      // TODO fix type getSantizedControlFromToken(t, entry) returns a SchemaItem
      // rather than a Schema but SchemaItem is not exposed as an export from leva yet
      // @ts-ignore
      tweakConfig[entry] = getSantizedControlFromToken(t[entry]);
    }
  }
  return tweakConfig;
};

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
  // @ts-ignore
  // TODO: fix type error
  // TODO: reset should re build the controls (use dep array API when available)
  const [values] = useControls(() => ({
    persistence: persistControls(originalValues),
    ...getUseTweakConfigFromProps(tweaked, target, controlMap, keyToControl),
  }));

  // @ts-ignore
  return <>{children(values)}</>;
};
