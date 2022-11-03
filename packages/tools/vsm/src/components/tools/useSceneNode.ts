/**
 * Hook that retrieves a scene node from the scene.
 */

import type { AbstractMesh } from "core/Meshes/abstractMesh";
import type { Nullable } from "core/types";
import { useContext } from "react";
import { SceneContext } from "../../SceneContext";

export function useSceneNode(nodeName: string): Nullable<AbstractMesh> | undefined {
    const { scene } = useContext(SceneContext);

    const mesh = scene?.getMeshByName(nodeName);
    return mesh;
}
