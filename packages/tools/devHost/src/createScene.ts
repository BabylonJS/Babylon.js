import { ThinParticleSystem } from "core/Particles/thinParticleSystem";
import { EngineInstance } from "./engine";
import { Vector3 } from "core/Maths/math.vector";
import { Texture } from "core/Materials/Textures/texture";
import { Scene } from "core/scene";

// eslint-disable-next-line @typescript-eslint/naming-convention, no-restricted-syntax
export const createScene = async function () {
    const scene = new Scene(EngineInstance);
    // Create a particle system
    const particleSystem = new ThinParticleSystem("particles", 2000, EngineInstance);

    //Texture of each particle
    particleSystem.particleTexture = new Texture("textures/flare.png");

    // Position where the particles are emiited from
    particleSystem.emitter = new Vector3(0, 0.5, 0);

    particleSystem.start();

    return scene;
};
