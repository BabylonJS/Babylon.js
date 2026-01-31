import type { Nullable } from "core/types";
import type { ISize } from "core/Maths/math.size";
import type { ProceduralTexture } from "core/Materials/Textures/Procedurals/proceduralTexture";
import type { Particle } from "core/Particles/particle";
import type { ThinParticleSystem } from "core/Particles/thinParticleSystem";
import type { NodeParticleConnectionPoint } from "core/Particles/Node/nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "core/Particles/Node/nodeParticleBuildState";
import type { ParticleTextureSourceBlock } from "core/Particles/Node/Blocks/particleSourceTextureBlock";

import { TmpVectors, Vector3 } from "core/Maths/math.vector";
import { RegisterClass } from "core/Misc/typeStore";
import { NodeParticleBlock } from "core/Particles/Node/nodeParticleBlock";
import { NodeParticleBlockConnectionPointTypes } from "core/Particles/Node/Enums/nodeParticleBlockConnectionPointTypes";
import { _ConnectAtTheEnd } from "core/Particles/Queue/executionQueue";

/**
 * Block used to update particle position based on a noise texture
 */
export class UpdateNoiseBlock extends NodeParticleBlock {
    /**
     * Create a new UpdateNoiseBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("particle", NodeParticleBlockConnectionPointTypes.Particle);
        this.registerInput("noiseTexture", NodeParticleBlockConnectionPointTypes.Texture);
        this.registerInput("strength", NodeParticleBlockConnectionPointTypes.Vector3, true, new Vector3(100, 100, 100));
        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.Particle);
    }

    /**
     * Gets the particle component
     */
    public get particle(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the noiseTexture input component
     */
    public get noiseTexture(): NodeParticleConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the strength input component
     */
    public get strength(): NodeParticleConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "UpdateNoiseBlock";
    }

    /**
     * Builds the block
     * @param state defines the current build state
     */
    public override _build(state: NodeParticleBuildState) {
        const system = this.particle.getConnectedValue(state) as ThinParticleSystem;

        const strength = this.strength.getConnectedValue(state) as Vector3;
        if (!strength) {
            return;
        }

        const noiseTextureBlock = this.noiseTexture.connectedPoint?.ownerBlock as ParticleTextureSourceBlock;
        if (!noiseTextureBlock) {
            return;
        }

        // These will be updated each frame for procedural textures
        let noiseTextureData: Nullable<Uint8Array | Uint8ClampedArray> = null;
        let noiseTextureSize: Nullable<ISize> = null;
        let lastFrameId = -1;

        const processNoise = (particle: Particle) => {
            // Get the texture directly from the block's stored value to support procedural textures
            // (as the block caches the texture data)
            const texture = noiseTextureBlock.texture._storedValue as ProceduralTexture;
            if (!texture || !texture.isReady()) {
                return;
            }

            // Fetch fresh texture data once per frame (like in thinParticleSystem)
            const currentFrameId = texture.getScene()?.getFrameId() ?? -1;
            if (currentFrameId !== lastFrameId) {
                lastFrameId = currentFrameId;

                // Texture size only needs to be fetched once
                if (!noiseTextureSize) {
                    noiseTextureSize = texture.getSize();
                }

                // eslint-disable-next-line @typescript-eslint/no-floating-promises, github/no-then
                texture.getContent()?.then((data) => {
                    noiseTextureData = data as Uint8Array;
                });
            }

            // Skip if we don't have texture data yet
            if (!noiseTextureData || !noiseTextureSize) {
                return;
            }

            if (!particle._randomNoiseCoordinates1) {
                particle._randomNoiseCoordinates1 = new Vector3(Math.random(), Math.random(), Math.random());
            }

            if (!particle._randomNoiseCoordinates2) {
                particle._randomNoiseCoordinates2 = new Vector3(Math.random(), Math.random(), Math.random());
            }

            const fetchedColorR = system._fetchR(
                particle._randomNoiseCoordinates1.x,
                particle._randomNoiseCoordinates1.y,
                noiseTextureSize.width,
                noiseTextureSize.height,
                noiseTextureData
            );
            const fetchedColorG = system._fetchR(
                particle._randomNoiseCoordinates1.z,
                particle._randomNoiseCoordinates2.x,
                noiseTextureSize.width,
                noiseTextureSize.height,
                noiseTextureData
            );
            const fetchedColorB = system._fetchR(
                particle._randomNoiseCoordinates2.y,
                particle._randomNoiseCoordinates2.z,
                noiseTextureSize.width,
                noiseTextureSize.height,
                noiseTextureData
            );

            const force = TmpVectors.Vector3[0];
            const scaledForce = TmpVectors.Vector3[1];

            force.copyFromFloats((2 * fetchedColorR - 1) * strength.x, (2 * fetchedColorG - 1) * strength.y, (2 * fetchedColorB - 1) * strength.z);

            force.scaleToRef(system._tempScaledUpdateSpeed, scaledForce);
            particle.direction.addInPlace(scaledForce);
        };

        const noiseProcessing = {
            process: processNoise,
            previousItem: null,
            nextItem: null,
        };

        if (system._updateQueueStart) {
            _ConnectAtTheEnd(noiseProcessing, system._updateQueueStart);
        } else {
            system._updateQueueStart = noiseProcessing;
        }

        this.output._storedValue = system;
    }
}

RegisterClass("BABYLON.UpdateNoiseBlock", UpdateNoiseBlock);
