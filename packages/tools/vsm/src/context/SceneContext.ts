import type { Scene } from "core/scene";
import type { Nullable } from "core/types";
import { createContext } from "react";

export type SceneContextType = { scene: Nullable<Scene>; setScene: (scene: Nullable<Scene>) => void };
export const SceneContext = createContext<SceneContextType>({ scene: null, setScene: () => {} });
