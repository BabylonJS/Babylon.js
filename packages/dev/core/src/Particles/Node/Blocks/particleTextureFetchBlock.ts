import { RegisterClass } from "core/Misc/typeStore";
import { NodeParticleBlock } from "core/Particles/Node/nodeParticleBlock";

/**
 * Block used to fetch a color from texture data
 */
export class ParticleTextureFetchBlock extends NodeParticleBlock {}

RegisterClass("BABYLON.ParticleTextureFetchBlock", ParticleTextureFetchBlock);
