import type { Particle } from "core/Particles/particle";

/**
 * Creates the local position data for the particle
 * @param particle The particle to update
 */
export function _CreateLocalPositionData(particle: Particle): void {
    if (!particle._properties.localPosition) {
        particle._properties.localPosition = particle.position.clone();
    } else {
        particle._properties.localPosition.copyFrom(particle.position);
    }
}
