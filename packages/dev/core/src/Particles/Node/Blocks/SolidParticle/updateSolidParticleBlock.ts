import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "../../nodeParticleBlock";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
import type { ISolidParticleInitData, ISolidParticleUpdateData } from "./ISolidParticleData";

/**
 * Block used to generate update function for SPS particles
 */
export class UpdateSolidParticleBlock extends NodeParticleBlock {
    public constructor(name: string) {
        super(name);

        this.registerInput("config", NodeParticleBlockConnectionPointTypes.SolidParticleConfig);
        this.registerInput("position", NodeParticleBlockConnectionPointTypes.Vector3, true);
        this.registerInput("velocity", NodeParticleBlockConnectionPointTypes.Vector3, true);
        this.registerInput("color", NodeParticleBlockConnectionPointTypes.Color4, true);
        this.registerInput("scaling", NodeParticleBlockConnectionPointTypes.Vector3, true);
        this.registerInput("rotation", NodeParticleBlockConnectionPointTypes.Vector3, true);

        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.SolidParticleConfig);
    }

    public override getClassName() {
        return "UpdateSolidParticleBlock";
    }

    public get configInput(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    public get position(): NodeParticleConnectionPoint {
        return this._inputs[1];
    }

    public get velocity(): NodeParticleConnectionPoint {
        return this._inputs[2];
    }

    public get color(): NodeParticleConnectionPoint {
        return this._inputs[3];
    }

    public get scaling(): NodeParticleConnectionPoint {
        return this._inputs[4];
    }

    public get rotation(): NodeParticleConnectionPoint {
        return this._inputs[5];
    }

    public get output(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    public override _build(state: NodeParticleBuildState) {
        const updateData: ISolidParticleUpdateData = {} as ISolidParticleUpdateData;
        if (this.position.isConnected) {
            updateData.position = () => {
                return this.position.getConnectedValue(state);
            };
        }
        if (this.velocity.isConnected) {
            updateData.velocity = () => {
                return this.velocity.getConnectedValue(state);
            };
        }
        if (this.color.isConnected) {
            updateData.color = () => {
                return this.color.getConnectedValue(state);
            };
        }
        if (this.scaling.isConnected) {
            updateData.scaling = () => {
                return this.scaling.getConnectedValue(state);
            };
        }
        if (this.rotation.isConnected) {
            updateData.rotation = () => {
                return this.rotation.getConnectedValue(state);
            };
        }
        this.output._storedValue = { ...(this.configInput.getConnectedValue(state) as ISolidParticleInitData), updateBlock: updateData };
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
    }
}

RegisterClass("BABYLON.UpdateSolidParticleBlock", UpdateSolidParticleBlock);
