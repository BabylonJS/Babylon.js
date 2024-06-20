import { Vector3 } from "core/Maths/math.vector";
import { PointParticleEmitter } from "./EmitterTypes/pointParticleEmitter";
import { HemisphericParticleEmitter } from "./EmitterTypes/hemisphericParticleEmitter";
import { SphereDirectedParticleEmitter, SphereParticleEmitter } from "./EmitterTypes/sphereParticleEmitter";
import { CylinderDirectedParticleEmitter, CylinderParticleEmitter } from "./EmitterTypes/cylinderParticleEmitter";
import { ConeDirectedParticleEmitter, ConeParticleEmitter } from "./EmitterTypes/coneParticleEmitter";

/**
 * Creates a Point Emitter for the particle system (emits directly from the emitter position)
 * @param direction1 Particles are emitted between the direction1 and direction2 from within the box
 * @param direction2 Particles are emitted between the direction1 and direction2 from within the box
 * @returns the emitter
 */
export function CreatePointEmitter(direction1: Vector3, direction2: Vector3): PointParticleEmitter {
    const particleEmitter = new PointParticleEmitter();
    particleEmitter.direction1 = direction1;
    particleEmitter.direction2 = direction2;
    return particleEmitter;
}

/**
 * Creates a Hemisphere Emitter for the particle system (emits along the hemisphere radius)
 * @param radius The radius of the hemisphere to emit from
 * @param radiusRange The range of the hemisphere to emit from [0-1] 0 Surface Only, 1 Entire Radius
 * @returns the emitter
 */
export function CreateHemisphericEmitter(radius = 1, radiusRange = 1): HemisphericParticleEmitter {
    return new HemisphericParticleEmitter(radius, radiusRange);
}

/**
 * Creates a Sphere Emitter for the particle system (emits along the sphere radius)
 * @param radius The radius of the sphere to emit from
 * @param radiusRange The range of the sphere to emit from [0-1] 0 Surface Only, 1 Entire Radius
 * @returns the emitter
 */
export function CreateSphereEmitter(radius = 1, radiusRange = 1): SphereParticleEmitter {
    return new SphereParticleEmitter(radius, radiusRange);
}

/**
 * Creates a Directed Sphere Emitter for the particle system (emits between direction1 and direction2)
 * @param radius The radius of the sphere to emit from
 * @param direction1 Particles are emitted between the direction1 and direction2 from within the sphere
 * @param direction2 Particles are emitted between the direction1 and direction2 from within the sphere
 * @returns the emitter
 */
export function CreateDirectedSphereEmitter(radius = 1, direction1 = new Vector3(0, 1.0, 0), direction2 = new Vector3(0, 1.0, 0)): SphereDirectedParticleEmitter {
    return new SphereDirectedParticleEmitter(radius, direction1, direction2);
}

/**
 * Creates a Cylinder Emitter for the particle system (emits from the cylinder to the particle position)
 * @param radius The radius of the emission cylinder
 * @param height The height of the emission cylinder
 * @param radiusRange The range of emission [0-1] 0 Surface only, 1 Entire Radius
 * @param directionRandomizer How much to randomize the particle direction [0-1]
 * @returns the emitter
 */
export function CreateCylinderEmitter(radius = 1, height = 1, radiusRange = 1, directionRandomizer = 0): CylinderParticleEmitter {
    return new CylinderParticleEmitter(radius, height, radiusRange, directionRandomizer);
}

/**
 * Creates a Directed Cylinder Emitter for the particle system (emits between direction1 and direction2)
 * @param radius The radius of the cylinder to emit from
 * @param height The height of the emission cylinder
 * @param radiusRange the range of the emission cylinder [0-1] 0 Surface only, 1 Entire Radius (1 by default)
 * @param direction1 Particles are emitted between the direction1 and direction2 from within the cylinder
 * @param direction2 Particles are emitted between the direction1 and direction2 from within the cylinder
 * @returns the emitter
 */
export function CreateDirectedCylinderEmitter(
    radius = 1,
    height = 1,
    radiusRange = 1,
    direction1 = new Vector3(0, 1.0, 0),
    direction2 = new Vector3(0, 1.0, 0)
): CylinderDirectedParticleEmitter {
    return new CylinderDirectedParticleEmitter(radius, height, radiusRange, direction1, direction2);
}

/**
 * Creates a Cone Emitter for the particle system (emits from the cone to the particle position)
 * @param radius The radius of the cone to emit from
 * @param angle The base angle of the cone
 * @returns the emitter
 */
export function CreateConeEmitter(radius = 1, angle = Math.PI / 4): ConeParticleEmitter {
    return new ConeParticleEmitter(radius, angle);
}

export function CreateDirectedConeEmitter(radius = 1, angle = Math.PI / 4, direction1 = new Vector3(0, 1.0, 0), direction2 = new Vector3(0, 1.0, 0)): ConeDirectedParticleEmitter {
    return new ConeDirectedParticleEmitter(radius, angle, direction1, direction2);
}
