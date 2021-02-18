import { Schema, Settings } from "use-tweaks/dist/types";
import React, { useState } from "react";

interface ControlType {
  name?: string;
  controlType: Schema;
  settings: Settings;
}

type Target = Record<string, string>;
type ControlMap = Record<string, ControlType>;

const tweakMap = new Map();

interface ITwkrProps {
  target: Target;
  controlMap: ControlMap;
  children: (t: Target) => React.ReactElement;
}

interface IInterceptor {
  get: (t: Target, prop: string) => string;
}

const tweakable = (t: Target, handler: IInterceptor) => new Proxy(t, handler);

const tweakHandler = {
  get(t: Target, prop: keyof Target) {
    console.log(`${t[prop]}`);
    return Reflect.get(t, prop);
  },
};

export const Twkr: React.FC<ITwkrProps> = ({
  target,
  controlMap,
  children,
}) => {
  const [tweaked, setTweaked] = useState(tweakMap);
  const [tweakTracked] = useState(() => tweakable(target, tweakHandler));

  return children(tweakTracked);
};
