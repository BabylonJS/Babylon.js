import type { Particle } from "core/Particles/particle";

/**
 * Creates the local position data for the particle
 * @param particle The particle to update
 */
export function _CreateLocalPositionData(particle: Particle): void {
    if (!particle._localPosition) {
        particle._localPosition = particle.position.clone();
    } else {
        particle._localPosition.copyFrom(particle.position);
    }
}
