import { ThinParticleSystem } from "core/Particles/thinParticleSystem";
import { engine } from "./engine";
import { Vector3 } from "core/Maths/math.vector";
import { Texture } from "core/Materials/Textures/texture";

export const createScene = async function () {
    // Create a particle system
    const particleSystem = new ThinParticleSystem("particles", 2000, engine);

    //Texture of each particle
    particleSystem.particleTexture = new Texture("textures/flare.png");

    // Position where the particles are emiited from
    particleSystem.emitter = new Vector3(0, 0.5, 0);

    particleSystem.start();
};
