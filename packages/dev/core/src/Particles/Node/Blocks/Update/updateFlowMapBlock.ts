import type { Nullable } from "core/types";
import type { ThinParticleSystem } from "core/Particles/thinParticleSystem";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
import type { Particle } from "core/Particles/particle";
import type { INodeParticleTextureData, ParticleTextureSourceBlock } from "../particleSourceTextureBlock";

import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "../../nodeParticleBlock";
import { _ConnectAtTheEnd } from "core/Particles/Queue/executionQueue";
import { FlowMap } from "core/Particles/flowMap";

/**
 * Block used to update particle position based on a flow map
 */
export class UpdateFlowMapBlock extends NodeParticleBlock {
    /**
     * Create a new UpdateFlowMapBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("particle", NodeParticleBlockConnectionPointTypes.Particle);
        this.registerInput("flowMap", NodeParticleBlockConnectionPointTypes.Texture);
        this.registerInput("strength", NodeParticleBlockConnectionPointTypes.Float, true, 1);
        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.Particle);
    }

    /**
     * Gets the particle component
     */
    public get particle(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the flowMap input component
     */
    public get flowMap(): NodeParticleConnectionPoint {
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
        return "UpdateFlowMapBlock";
    }

    /**
     * Builds the block
     * @param state defines the current build state
     */
    public override _build(state: NodeParticleBuildState) {
        const system = this.particle.getConnectedValue(state) as ThinParticleSystem;
        const scene = state.scene;

        const flowMapTexture = this.flowMap.connectedPoint?.ownerBlock as ParticleTextureSourceBlock;
        let flowMap: FlowMap;

        // eslint-disable-next-line github/no-then
        void flowMapTexture.extractTextureContentAsync().then((textureContent: Nullable<INodeParticleTextureData>) => {
            if (!textureContent) {
                return;
            }
            flowMap = new FlowMap(textureContent.width, textureContent.height, textureContent.data as Uint8ClampedArray);
        });

        const processFlowMap = (particle: Particle) => {
            const matrix = scene.getTransformMatrix();
            if (!flowMap) {
                // If the flow map is not ready, we skip processing
                return;
            }
            const strength = this.strength.getConnectedValue(state) as number;
            flowMap._processParticle(particle, strength * system._tempScaledUpdateSpeed, matrix);
        };

        const flowMapProcessing = {
            process: processFlowMap,
            previousItem: null,
            nextItem: null,
        };

        if (system._updateQueueStart) {
            _ConnectAtTheEnd(flowMapProcessing, system._updateQueueStart);
        } else {
            system._updateQueueStart = flowMapProcessing;
        }

        this.output._storedValue = system;
    }
}

RegisterClass("BABYLON.UpdateFlowMapBlock", UpdateFlowMapBlock);
