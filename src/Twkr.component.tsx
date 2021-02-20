import React, { useState, useEffect } from "react";
import { useControls } from "leva";
import { Schema } from "leva/dist/declarations/src/types";

type Target = Record<string, string | number>;
type Control<T> = Record<keyof T, Schema>;
type ControlMap<T> = Control<T>;
type KeyToControl = (target: Target, key: keyof Target) => Schema;

interface ITwkrProps {
  target: Target;
  controlMap?: ControlMap<Target>;
  keyToControl?: KeyToControl;
  children: (t: Target) => React.ReactElement;
}

interface IInterceptor {
  get: (t: Target, prop: string) => string;
}

type TweakTrack = React.Dispatch<React.SetStateAction<Set<string>>>;

const tweakable = (
  t: Target,
  getHandler: (u: TweakTrack) => IInterceptor,
  cb: TweakTrack
) => new Proxy(t, getHandler(cb));

const usedTokens = new Set<keyof Target>();
const handler = (track: TweakTrack) => ({
  get(t: Target, prop: keyof Target) {
    // react doesn't bail out of renders even if state doesn't change so
    // we need to maintain a copy of the tracked keys to gate calls to setState
    // https://github.com/facebook/react/issues/14994
    // TODO: has own property check via Reflect somehow
    if (!usedTokens.has(prop) && prop !== "toJSON") {
      usedTokens.add(prop);
      track(new Set(usedTokens));
    }
    return Reflect.get(t, prop);
  },
});

const getUseTweakConfigFromProps = (
  tweaked: Set<keyof Target>,
  t: Target,
  c: ControlMap<Target>,
  f: KeyToControl
): ControlMap<Target> => {
  const tweakConfig: Record<string, Schema> = {};
  for (const entry of tweaked) {
    let controlForKey;
    if (!c || !c[entry]) {
      controlForKey = f ? f(t, entry) : undefined;
    } else {
      controlForKey = c[entry];
    }
    tweakConfig[entry] = controlForKey;
  }
  return tweakConfig;
};

export const Twkr: React.FC<ITwkrProps> = ({
  target,
  controlMap,
  keyToControl,
  children,
}) => {
  const [tweaked, setTweaked] = useState<Set<string>>(() => new Set());
  const [mounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [tweakTracked] = useState(() => tweakable(target, handler, setTweaked));

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
