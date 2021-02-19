import React, { useState, useEffect, useMemo } from "react";
import { Schema, Settings } from "use-tweaks/dist/types";
import { useTweaks } from "use-tweaks";

type Target = Record<string, string>;
type ControlMap<T> = Record<keyof T, Settings>;

const tweakMap = new Set<string>();

interface ITwkrProps {
  target: Target;
  controlMap: ControlMap<Target>;
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
    if (!usedTokens.has(prop)) {
      usedTokens.add(prop);
      track(new Set(usedTokens));
    }
    return Reflect.get(t, prop);
  },
});

const getUseTweakConfigFromProps = (
  tweaked: Set<keyof Target>,
  c: ControlMap<Target>
): ControlMap<Target> => {
  const tweakConfig: Record<string, Settings> = {};
  for (const entry of tweaked) {
    tweakConfig[entry] = c[entry];
  }
  return tweakConfig;
};

export const Twkr: React.FC<ITwkrProps> = ({
  target,
  controlMap,
  children,
}) => {
  const [tweaked, setTweaked] = useState<Set<string>>(tweakMap);

  const [tweakTracked, setTweakTracked] = useState(() =>
    tweakable(target, handler, setTweaked)
  );

  const tweakConfig = useMemo(() => {
    return getUseTweakConfigFromProps(tweaked, controlMap);
  }, [tweaked]);

  // confirm this returns same reference if tweakConfig doesnt change
  // lest ye olde infinite loop occurs in the effect below
  const tweakControlled = useTweaks("test", tweakConfig);

  useEffect(() => {
    const update = { ...target, ...tweakControlled };
    // @ts-ignore
    // TODO: fix type here as it needs to be Record<keyof Target, string>
    setTweakTracked(update);
  }, [tweakControlled]);

  return children(tweakTracked);
};
