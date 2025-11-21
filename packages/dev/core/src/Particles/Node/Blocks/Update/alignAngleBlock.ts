import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "../../nodeParticleBlock";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
import type { ThinParticleSystem } from "core/Particles/thinParticleSystem";
import type { Particle } from "core/Particles/particle";
import { _ConnectAtTheEnd } from "core/Particles/Queue/executionQueue";
import { Vector3 } from "../../../../Maths/math.vector";
import { editableInPropertyPage, PropertyTypeForEdition } from "../../../../Decorators/nodeDecorator";

/**
 * Block used to align the angle of a particle to its direction
 * We assume the sprite is facing +Y
 * NPE: #W5054F
 * PG: #H5RP91
 */
export class AlignAngleBlock extends NodeParticleBlock {
    /**
     * Gets or sets the strenght of the flow map effect
     */
    @editableInPropertyPage("alignment", PropertyTypeForEdition.Float, "ADVANCED", { embedded: true, notifiers: { rebuild: true }, min: -0, max: 2 * Math.PI })
    public alignment = Math.PI / 2; // Default to 90 degrees, aligning +Y with direction

    /**
     * Create a new AlignAngleBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("particle", NodeParticleBlockConnectionPointTypes.Particle);
        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.Particle);
    }

    /**
     * Gets the particle component
     */
    public get particle(): NodeParticleConnectionPoint {
        return this._inputs[0];
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
        return "AlignAngleBlock";
    }

    /**
     * Builds the block
     * @param state defines the current build state
     */
    public override _build(state: NodeParticleBuildState) {
        const system = this.particle.getConnectedValue(state) as ThinParticleSystem;

        this.output._storedValue = system;

        const tempVector3 = new Vector3();

        const processAngle = (particle: Particle) => {
            const cam = state.scene.activeCamera;
            if (!cam) {
                return;
            }
            const dir = particle.direction;
            const view = cam.getViewMatrix();

            const dirInView = Vector3.TransformNormalToRef(dir, view, tempVector3);

            // Angle so sprite’s +Y aligns with projected direction
            const angle = Math.atan2(dirInView.y, dirInView.x) + this.alignment;
            particle.angle = angle; // radians
        };

        const angleProcessing = {
            process: processAngle,
            previousItem: null,
            nextItem: null,
        };

        if (system._updateQueueStart) {
            _ConnectAtTheEnd(angleProcessing, system._updateQueueStart);
        } else {
            system._updateQueueStart = angleProcessing;
        }
    }

    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.alignment = this.alignment;

        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);

        if (serializationObject.alignment !== undefined) {
            this.alignment = serializationObject.alignment;
        }
    }
}

RegisterClass("BABYLON.AlignAngleBlock", AlignAngleBlock);
