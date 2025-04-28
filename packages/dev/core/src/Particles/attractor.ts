import { Vector3 } from "core/Maths/math.vector";
import type { Particle } from "./particle";
import type { ThinParticleSystem } from "./thinParticleSystem";

const toAttractor: Vector3 = Vector3.Zero();
const force: Vector3 = Vector3.Zero();
const scaledForce: Vector3 = Vector3.Zero();

/**
 * Class representing an attractor in a particle system.
 */
export class Attractor {
    /**
     * Gets or sets the strength of the attractor.
     * A positive value attracts particles, while a negative value repels them.
     */
    public strength = 0.0;

    /**
     * Gets or sets the position of the attractor in 3D space.
     */
    public position = Vector3.Zero();

    /** @internal */
    public _processParticle(particle: Particle, system: ThinParticleSystem, maxAttractorForce: number) {
        this.position.subtractToRef(particle.position, toAttractor);
        const distanceSquared = toAttractor.lengthSquared() + 0.0001; // Avoid division by zero
        toAttractor.normalize().scaleToRef(this.strength / distanceSquared, force);

        if (force.length() > maxAttractorForce) {
            force.normalize().scaleToRef(maxAttractorForce, force);
        }

        force.scaleToRef(system._tempScaledUpdateSpeed, scaledForce);

        particle.direction.addInPlace(scaledForce); // Update particle velocity
    }
}
