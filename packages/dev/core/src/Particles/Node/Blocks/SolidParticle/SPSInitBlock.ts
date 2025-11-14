import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "../../nodeParticleBlock";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
import type { ISPSUpdateData } from "./ISPSData";

/**
 * Block used to generate initialization function for SPS particles
 */
export class SPSInitBlock extends NodeParticleBlock {
    public constructor(name: string) {
        super(name);

        this.registerInput("position", NodeParticleBlockConnectionPointTypes.Vector3, true);
        this.registerInput("velocity", NodeParticleBlockConnectionPointTypes.Vector3, true);
        this.registerInput("color", NodeParticleBlockConnectionPointTypes.Color4, true);
        this.registerInput("scaling", NodeParticleBlockConnectionPointTypes.Vector3, true);
        this.registerInput("rotation", NodeParticleBlockConnectionPointTypes.Vector3, true);

        this.registerOutput("initData", NodeParticleBlockConnectionPointTypes.System);
    }

    public override getClassName() {
        return "SPSInitBlock";
    }

    public get initData(): NodeParticleConnectionPoint {
        return this._outputs[0];
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

    public override _build(state: NodeParticleBuildState) {
        const initData = {} as ISPSUpdateData;
        if (this.position.isConnected) {
            initData.position = () => {
                return this.position.getConnectedValue(state);
            };
        }
        if (this.velocity.isConnected) {
            initData.velocity = () => {
                return this.velocity.getConnectedValue(state);
            };
        }
        if (this.color.isConnected) {
            initData.color = () => {
                return this.color.getConnectedValue(state);
            };
        }
        if (this.scaling.isConnected) {
            initData.scaling = () => {
                return this.scaling.getConnectedValue(state);
            };
        }
        if (this.rotation.isConnected) {
            initData.rotation = () => {
                return this.rotation.getConnectedValue(state);
            };
        }

        this.initData._storedValue = initData;
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
    }
}

RegisterClass("BABYLON.SPSInitBlock", SPSInitBlock);
