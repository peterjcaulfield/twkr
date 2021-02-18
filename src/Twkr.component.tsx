import { Schema, Settings } from "use-tweaks/dist/types";
import React, { useState } from "react";

interface ControlType {
  name?: string;
  controlType: Schema;
  settings: Settings;
}

type Target = Record<string, string>;
type ControlMap = Record<string, ControlType>;

const tweakMap = new Set();

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

export const Twkr: React.FC<ITwkrProps> = ({
  target,
  controlMap,
  children,
}) => {
  const [tweaked, setTweaked] = useState(tweakMap);
  const [tweakTracked] = useState(() => tweakable(target, handler, setTweaked));

  return children(tweakTracked);
};
