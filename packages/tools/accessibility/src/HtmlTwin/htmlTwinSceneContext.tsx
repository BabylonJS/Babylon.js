import { createContext } from "react";

export interface ISceneContext {
    updateScene: () => void;
}

export const SceneContext = createContext<ISceneContext>({ updateScene: () => {} });
