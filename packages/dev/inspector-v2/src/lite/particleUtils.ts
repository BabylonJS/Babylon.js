import { getParticleSystems, isParticleSystemStarted, startParticleSystem, stopParticleSystem, type EngineContext, type ParticleSystem } from "@babylonjs/lite";

import { GetSceneContexts } from "./sceneEntityUtils";

/**
 * Gets registered particle systems across scenes, deduplicated by identity.
 * @param engine The inspected engine.
 * @returns Systems in first-scene, first-registration order.
 */
export function GetEngineParticleSystems(engine: EngineContext): readonly ParticleSystem[] {
    return [...new Set(GetSceneContexts(engine).flatMap((scene) => [...getParticleSystems(scene)]))];
}

/**
 * Tests membership in a registered scene's particle list.
 * @param engine The inspected engine.
 * @param entity The candidate.
 * @returns Whether it is a reachable particle system.
 */
export function IsParticleSystem(engine: EngineContext, entity: unknown): entity is ParticleSystem {
    return GetEngineParticleSystems(engine).some((system) => system === entity);
}

/**
 * Gets a particle system's source name or numbered fallback.
 * @param system The system to label.
 * @param index Its scene-local list index.
 * @returns Its display label.
 */
export function GetParticleSystemDisplayName(system: ParticleSystem, index: number): string {
    return system.name || `Particle System ${index + 1}`;
}

/**
 * Starts or stops emission without resetting particles still draining.
 * @param system The system to toggle.
 */
export function ToggleParticleSystem(system: ParticleSystem): void {
    if (isParticleSystemStarted(system)) {
        stopParticleSystem(system);
    } else {
        startParticleSystem(system);
    }
}
