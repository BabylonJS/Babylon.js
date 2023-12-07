import { createContext } from "react";

/**
 * Context used to update a scene when an entity is added or removed from the accessibility tree.
 */
export interface ISceneContext {
    updateScene: () => void;
}

export const SceneContext = createContext<ISceneContext>({ updateScene: () => {} });
