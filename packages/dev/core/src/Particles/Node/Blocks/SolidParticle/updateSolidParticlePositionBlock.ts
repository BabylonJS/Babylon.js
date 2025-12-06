import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "../../nodeParticleBlock";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
import type { ISolidParticleInitData, ISolidParticleUpdateData } from "./ISolidParticleData";
import type { Vector3 } from "core/Maths/math.vector";

/**
 * Block used to update the position of a solid particle
 */
export class UpdateSolidParticlePositionBlock extends NodeParticleBlock {
    public constructor(name: string) {
        super(name);

        this.registerInput("solidParticle", NodeParticleBlockConnectionPointTypes.SolidParticle);
        this.registerInput("position", NodeParticleBlockConnectionPointTypes.Vector3);
        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.SolidParticle);
    }

    public override getClassName() {
        return "UpdateSolidParticlePositionBlock";
    }

    public get solidParticle(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    public get position(): NodeParticleConnectionPoint {
        return this._inputs[1];
    }

    public get output(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    public override _build(state: NodeParticleBuildState) {
        const inputConfig = this.solidParticle.getConnectedValue(state) as ISolidParticleInitData;
        const updateData: ISolidParticleUpdateData = { ...(inputConfig.updateData || {}) };

        if (this.position.isConnected) {
            updateData.position = () => {
                return this.position.getConnectedValue(state) as Vector3;
            };
        }

        this.output._storedValue = { ...inputConfig, updateData };
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
    }
}

RegisterClass("BABYLON.UpdateSolidParticlePositionBlock", UpdateSolidParticlePositionBlock);
