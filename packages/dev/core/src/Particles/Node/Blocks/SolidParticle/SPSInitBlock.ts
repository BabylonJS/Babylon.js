import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "../../nodeParticleBlock";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
import { Vector3 } from "core/Maths/math.vector";
import { Color4 } from "core/Maths/math.color";
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
        initData.position = () => {
            return this.getPosition(state);
        };
        initData.velocity = () => {
            return this.getVelocity(state);
        };
        initData.color = () => {
            return this.getColor(state);
        };
        initData.scaling = () => {
            return this.getScaling(state);
        };
        initData.rotation = () => {
            return this.getRotation(state);
        };

        this.initData._storedValue = initData;
    }

    private getPosition(state: NodeParticleBuildState) {
        if (this.position.isConnected) {
            if (this.position._storedFunction) {
                return this.position._storedFunction!(state);
            }
            return this.position.getConnectedValue(state);
        }
        return new Vector3(0, 0, 0);
    }
    private getVelocity(state: NodeParticleBuildState) {
        if (this.velocity.isConnected) {
            if (this.velocity._storedFunction) {
                return this.velocity._storedFunction!(state);
            }
            return this.velocity.getConnectedValue(state);
        }
        return new Vector3(0, 0, 0);
    }
    private getColor(state: NodeParticleBuildState) {
        if (this.color.isConnected) {
            if (this.color._storedFunction) {
                return this.color._storedFunction!(state);
            }
            return this.color.getConnectedValue(state);
        }
        return new Color4(1, 1, 1, 1);
    }
    private getScaling(state: NodeParticleBuildState) {
        if (this.scaling.isConnected) {
            if (this.scaling._storedFunction) {
                return this.scaling._storedFunction!(state);
            }
            return this.scaling.getConnectedValue(state);
        }
        return new Vector3(1, 1, 1);
    }
    private getRotation(state: NodeParticleBuildState) {
        if (this.rotation.isConnected) {
            if (this.rotation._storedFunction) {
                return this.rotation._storedFunction!(state);
            }
            return this.rotation.getConnectedValue(state);
        }
        return new Vector3(0, 0, 0);
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
