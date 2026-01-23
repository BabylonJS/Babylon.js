import { Color4 } from "core/Maths/math.color";
import { Vector3 } from "core/Maths/math.vector";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "../../nodeParticleBlock";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
import type { ISolidParticleInitData } from "./ISolidParticleData";

/**
 * Block used to create a solid particle configuration (mesh, count, position, color, scaling, rotation)
 */
export class CreateSolidParticleBlock extends NodeParticleBlock {
    public constructor(name: string) {
        super(name);

        this.registerInput("count", NodeParticleBlockConnectionPointTypes.Int, true, 1);
        this.registerInput("lifeTime", NodeParticleBlockConnectionPointTypes.Float, true, -1, -1);
        this.registerInput("position", NodeParticleBlockConnectionPointTypes.Vector3, true);
        this.registerInput("color", NodeParticleBlockConnectionPointTypes.Color4, true);
        this.registerInput("scaling", NodeParticleBlockConnectionPointTypes.Vector3, true);
        this.registerInput("rotation", NodeParticleBlockConnectionPointTypes.Vector3, true);
        this.registerInput("mesh", NodeParticleBlockConnectionPointTypes.Mesh);

        this.registerOutput("solidParticle", NodeParticleBlockConnectionPointTypes.SolidParticle);
    }

    public override getClassName() {
        return "CreateSolidParticleBlock";
    }

    public get count(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    public get lifeTime(): NodeParticleConnectionPoint {
        return this._inputs[1];
    }

    public get position(): NodeParticleConnectionPoint {
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

    public get mesh(): NodeParticleConnectionPoint {
        return this._inputs[6];
    }

    public get solidParticle(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    public override _build(state: NodeParticleBuildState) {
        const meshData = this.mesh.getConnectedValue(state);
        const count = this.count.getConnectedValue(state) ?? 1;

        const lifeTime = () => {
            const value = this.lifeTime.isConnected ? this.lifeTime.getConnectedValue(state) : -1;
            return value < 0 ? Infinity : value;
        };

        const position = () => {
            return this.position.isConnected ? this.position.getConnectedValue(state) : Vector3.Zero();
        };

        const color = () => {
            return this.color.isConnected ? this.color.getConnectedValue(state) : new Color4(1, 1, 1, 1);
        };
        const scaling = () => {
            return this.scaling.isConnected ? this.scaling.getConnectedValue(state) : Vector3.One();
        };
        const rotation = () => {
            return this.rotation.isConnected ? this.rotation.getConnectedValue(state) : Vector3.Zero();
        };

        const particleConfig: ISolidParticleInitData = {
            meshData,
            count,
            lifeTime,
            position,
            color,
            scaling,
            rotation,
            updateData: null,
        };

        this.solidParticle._storedValue = particleConfig;
    }
}

RegisterClass("BABYLON.CreateSolidParticleBlock", CreateSolidParticleBlock);
