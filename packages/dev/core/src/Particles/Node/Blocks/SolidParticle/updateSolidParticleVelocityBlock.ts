import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "../../nodeParticleBlock";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
import type { ISolidParticleInitData, ISolidParticleUpdateData } from "./ISolidParticleData";
import type { Vector3 } from "core/Maths/math.vector";

/**
 * Block used to update the velocity of a solid particle
 */
export class UpdateSolidParticleVelocityBlock extends NodeParticleBlock {
    public constructor(name: string) {
        super(name);

        this.registerInput("solidParticle", NodeParticleBlockConnectionPointTypes.SolidParticle);
        this.registerInput("velocity", NodeParticleBlockConnectionPointTypes.Vector3);
        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.SolidParticle);
    }

    public override getClassName() {
        return "UpdateSolidParticleVelocityBlock";
    }

    public get solidParticle(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    public get velocity(): NodeParticleConnectionPoint {
        return this._inputs[1];
    }

    public get output(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    public override _build(state: NodeParticleBuildState) {
        const inputConfig = this.solidParticle.getConnectedValue(state) as ISolidParticleInitData;
        const updateData: ISolidParticleUpdateData = { ...(inputConfig.updateData || {}) };

        if (this.velocity.isConnected) {
            updateData.velocity = () => {
                return this.velocity.getConnectedValue(state) as Vector3;
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

RegisterClass("BABYLON.UpdateSolidParticleVelocityBlock", UpdateSolidParticleVelocityBlock);
