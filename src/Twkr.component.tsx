import React, { useState, useEffect, useMemo } from "react";
import { Schema, Settings } from "use-tweaks/dist/types";
import { useTweaks } from "use-tweaks";

interface ControlType {
  name?: string;
  controlType: Schema;
  settings: Settings;
}

type Target = Record<string, string>;
type ControlMap = Record<string, ControlType>;

const tweakMap = new Set<string>();

interface ITwkrProps {
  target: Target;
  controlMap: ControlMap;
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

const handler = (track: TweakTrack) => ({
  // TODO add set?
  get(t: Target, prop: keyof Target) {
    track((curr) => {
      if (!curr.has(prop)) {
        const update = new Set(curr);
        curr.add(prop);
        return update;
      } else {
        return curr;
      }
    });
    return Reflect.get(t, prop);
  },
});

const getUseTweakConfigFromProps = (
  t: Target,
  c: ControlMap,
  tweaked: Set<keyof Target>
) => {
  const tweakConfig = {};
  // TODO: construct the config
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

  const tweakConfig = useMemo(
    () => getUseTweakConfigFromProps(target, controlMap, tweaked),
    [tweaked]
  );

  const tweakControlled = useTweaks("test", tweakConfig);

  useEffect(() => {
    // TODO: ensure updates are proxied as expected when retrieved
    const update = { ...target, ...tweakControlled };
    // @ts-ignore
    // TODO: fix type here as it needs to be Record<keyof Target, string>
    setTweakTracked(update);
  }, [tweakControlled]);

  return children(tweakTracked);
};
