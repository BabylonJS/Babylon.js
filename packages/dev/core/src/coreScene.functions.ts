import type { CoreScene } from "./coreScene";
import type { Scene } from "./scene";

/**
 * Determine if the current scene is a Scene or a CoreScene
 * @param scene defines the scene to check
 * @returns true if the scene is a Scene
 */
export function IsFullScene(scene: CoreScene): scene is Scene {
    return !scene.isCore;
}
