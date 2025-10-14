import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "../../nodeParticleBlock";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
import { Vector3 } from "core/Maths/math.vector";
import { Color4 } from "core/Maths/math.color";
import type { ISPSUpdateData } from "./ISPSData";

/**
 * Block used to generate update function for SPS particles
 */
export class SPSUpdateBlock extends NodeParticleBlock {
    public constructor(name: string) {
        super(name);

        this.registerInput("position", NodeParticleBlockConnectionPointTypes.Vector3, true);
        this.registerInput("velocity", NodeParticleBlockConnectionPointTypes.Vector3, true);
        this.registerInput("color", NodeParticleBlockConnectionPointTypes.Color4, true);
        this.registerInput("scaling", NodeParticleBlockConnectionPointTypes.Vector3, true);
        this.registerInput("rotation", NodeParticleBlockConnectionPointTypes.Vector3, true);

        this.registerOutput("updateData", NodeParticleBlockConnectionPointTypes.System);
    }

    public override getClassName() {
        return "SPSUpdateBlock";
    }

    public get position(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    public get velocity(): NodeParticleConnectionPoint {
        return this._inputs[1];
    }

    public get color(): NodeParticleConnectionPoint {
        return this._inputs[2];
    }

    public get scaling(): NodeParticleConnectionPoint {
        return this._inputs[3];
    }

    public get rotation(): NodeParticleConnectionPoint {
        return this._inputs[4];
    }

    public get updateData(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    public override _build(state: NodeParticleBuildState) {
        const updateData: ISPSUpdateData = {};

        if (this.position.isConnected) {
            updateData.position = () => {
                const particleContext = {
                    id: 0,
                    position: new Vector3(0, 0, 0),
                    velocity: new Vector3(0, 0, 0),
                    color: new Color4(1, 1, 1, 1),
                    scaling: new Vector3(1, 1, 1),
                    rotation: new Vector3(0, 0, 0),
                };
                state.particleContext = particleContext as any;
                return this.position.getConnectedValue(state) as Vector3;
            };
        } else {
            updateData.position = undefined;
        }

        if (this.velocity.isConnected) {
            updateData.velocity = () => {
                return this.velocity.getConnectedValue(state) as Vector3;
            };
        } else {
            updateData.velocity = undefined;
        }

        if (this.color.isConnected) {
            updateData.color = () => {
                return this.color.getConnectedValue(state) as Color4;
            };
        } else {
            updateData.color = undefined;
        }

        if (this.scaling.isConnected) {
            updateData.scaling = () => {
                return this.scaling.getConnectedValue(state) as Vector3;
            };
        } else {
            updateData.scaling = undefined;
        }

        if (this.rotation.isConnected) {
            updateData.rotation = () => {
                return this.rotation.getConnectedValue(state) as Vector3;
            };
        } else {
            updateData.rotation = undefined;
        }

        this.updateData._storedValue = updateData;
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
    }
}

RegisterClass("BABYLON.SPSUpdateBlock", SPSUpdateBlock);
