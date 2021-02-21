import React, { useState, useEffect, useRef } from "react";
import { useControls } from "leva";
import { Schema } from "leva/dist/declarations/src/types";

type Target = Record<string, string | number>;
type Control<T> = Record<keyof T, Schema>;
type ControlMap<T> = Control<T>;
type KeyToControl = (target: Target, key: keyof Target) => Schema;

interface ITwkrProps {
  target: Target;
  controlMap?: Schema;
  keyToControl?: KeyToControl;
  children: (t: Target) => React.ReactElement;
}

interface IInterceptor {
  get: (t: Target, prop: string) => string;
}

type TweakTrack = React.Dispatch<React.SetStateAction<Set<string>>>;

const tweakable = (
  t: Target,
  getHandler: (
    u: TweakTrack,
    r: React.MutableRefObject<Set<keyof Target>>
  ) => IInterceptor,
  cb: TweakTrack,
  usedTokensRef: React.MutableRefObject<Set<keyof Target>>
) => new Proxy(t, getHandler(cb, usedTokensRef));

const handler = (
  track: TweakTrack,
  usedTokensRef: React.MutableRefObject<Set<keyof Target>>
) => ({
  get(t: Target, prop: keyof Target) {
    // react doesn't bail out of renders even if state doesn't change so
    // we need to maintain a copy of the tracked keys to gate calls to setState
    // https://github.com/facebook/react/issues/14994
    // TODO: has own property check via Reflect somehow
    if (!usedTokensRef.current.has(prop) && prop !== "toJSON") {
      usedTokensRef.current.add(prop);
      track(new Set(usedTokensRef.current));
    }
    return Reflect.get(t, prop);
  },
});

const getUseTweakConfigFromProps = (
  tweaked: Set<keyof Target>,
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
      // default to just using the value
      tweakConfig[entry] = t[entry];
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
  const [tweaked, setTweaked] = useState<Set<string>>(() => new Set());
  const [mounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [tweakTracked] = useState(() =>
    tweakable(target, handler, setTweaked, usedTokens)
  );

  return mounted ? (
    <TweakedChildren
      target={target}
      tweaked={tweaked}
      controlMap={controlMap}
      keyToControl={keyToControl}
      children={children}
    />
  ) : (
    children(tweakTracked)
  );
};

const TweakedChildren: React.FC<
  ITwkrProps & { tweaked: Set<keyof Target> }
> = ({ children, target, controlMap, keyToControl, tweaked }) => {
  // @ts-ignore
  // TODO: fix type error
  const [values] = useControls(() =>
    getUseTweakConfigFromProps(tweaked, target, controlMap, keyToControl)
  );

  return children(values);
};
