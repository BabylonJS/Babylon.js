import type { Scene } from "core/scene";
import { NodeParticleBuildState } from "../../nodeParticleBuildState";
import type { SystemBlock } from "../systemBlock";
import type { Vector3 } from "core/Maths/math.vector";

/**
 * @internal
 * Tools for managing particle triggers and sub-emitter systems.
 */
export function _TriggerSubEmitter(template: SystemBlock, scene: Scene, location: Vector3) {
    const newState = new NodeParticleBuildState();
    newState.scene = scene;
    const clone = template.createSystem(newState);
    clone.canStart = () => true; // Allow the cloned system to start
    clone.emitter = location.clone(); // Set the emitter to the particle's position
    clone.disposeOnStop = true; // Clean up the system when it stops
    clone.start();

    return clone;
}
