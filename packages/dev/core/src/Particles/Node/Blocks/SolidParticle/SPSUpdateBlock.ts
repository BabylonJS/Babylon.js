import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "../../nodeParticleBlock";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
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
        const updateData: ISPSUpdateData = {} as ISPSUpdateData;
        if (this.position.isConnected) {
            updateData.position = () => {
                return this.getPosition(state);
            };
        }
        if (this.velocity.isConnected) {
            updateData.velocity = () => {
                return this.getVelocity(state);
            };
        }
        if (this.color.isConnected) {
            updateData.color = () => {
                return this.getColor(state);
            };
        }
        if (this.scaling.isConnected) {
            updateData.scaling = () => {
                return this.getScaling(state);
            };
        }
        if (this.rotation.isConnected) {
            updateData.rotation = () => {
                return this.getRotation(state);
            };
        }
        this.updateData._storedValue = updateData;
    }

    private getPosition(state: NodeParticleBuildState) {
        if (this.position._storedFunction) {
            return this.position._storedFunction(state);
        }
        return this.position.getConnectedValue(state);
    }

    private getVelocity(state: NodeParticleBuildState) {
        if (this.velocity._storedFunction) {
            return this.velocity._storedFunction(state);
        }
        return this.velocity.getConnectedValue(state);
    }

    private getColor(state: NodeParticleBuildState) {
        if (this.color._storedFunction) {
            return this.color._storedFunction(state);
        }
        return this.color.getConnectedValue(state);
    }

    private getScaling(state: NodeParticleBuildState) {
        if (this.scaling._storedFunction) {
            return this.scaling._storedFunction(state);
        }
        return this.scaling.getConnectedValue(state);
    }

    private getRotation(state: NodeParticleBuildState) {
        if (this.rotation._storedFunction) {
            return this.rotation._storedFunction!(state);
        }
        return this.rotation.getConnectedValue(state);
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
