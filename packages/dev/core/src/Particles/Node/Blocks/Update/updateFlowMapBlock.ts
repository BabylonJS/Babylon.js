import type { ThinParticleSystem } from "core/Particles/thinParticleSystem";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "../../nodeParticleBlock";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
import type { Particle } from "core/Particles/particle";
import { _ConnectAtTheEnd } from "core/Particles/Queue/executionQueue";
import { FlowMap } from "core/Particles/flowMap";
import { editableInPropertyPage, PropertyTypeForEdition } from "core/Decorators/nodeDecorator";
import type { ParticleTextureSourceBlock } from "../particleSourceTextureBlock";

/**
 * Block used to update particle position based on a flow map
 */
export class UpdateFlowMapBlock extends NodeParticleBlock {
    /**
     * Gets or sets the strenght of the flow map effect
     */
    @editableInPropertyPage("strength", PropertyTypeForEdition.Float, "ADVANCED", { embedded: true, notifiers: { rebuild: true }, min: 0 })
    public strength = 1;
    /**
     * Create a new UpdateFlowMapBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("particle", NodeParticleBlockConnectionPointTypes.Particle);
        this.registerInput("flowMap", NodeParticleBlockConnectionPointTypes.Texture);
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
        void flowMapTexture.extractTextureContentAsync().then((textureContent) => {
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

            flowMap._processParticle(particle, this.strength * system._tempScaledUpdateSpeed, matrix);
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

    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.strength = this.strength;

        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);

        this.strength = serializationObject.strength;
    }
}

RegisterClass("BABYLON.UpdateFlowMapBlock", UpdateFlowMapBlock);
