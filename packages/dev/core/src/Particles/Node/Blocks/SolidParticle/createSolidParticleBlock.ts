import { Color4, Vector3 } from "../../../../Maths";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "../../nodeParticleBlock";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
import type { ISolidParticleInitData } from "./ISolidParticleData";

/**
 * Block used to create a solid particle configuration (mesh, count, material, position, velocity, color, scaling, rotation)
 */
export class CreateSolidParticleBlock extends NodeParticleBlock {
    public constructor(name: string) {
        super(name);

        this.registerInput("count", NodeParticleBlockConnectionPointTypes.Int, true, 1);
        this.registerInput("lifeTime", NodeParticleBlockConnectionPointTypes.Float, true, Infinity);
        this.registerInput("position", NodeParticleBlockConnectionPointTypes.Vector3, true);
        this.registerInput("velocity", NodeParticleBlockConnectionPointTypes.Vector3, true);
        this.registerInput("color", NodeParticleBlockConnectionPointTypes.Color4, true);
        this.registerInput("scaling", NodeParticleBlockConnectionPointTypes.Vector3, true);
        this.registerInput("rotation", NodeParticleBlockConnectionPointTypes.Vector3, true);
        this.registerInput("mesh", NodeParticleBlockConnectionPointTypes.Mesh);
        this.registerInput("material", NodeParticleBlockConnectionPointTypes.Material, true);

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

    public get velocity(): NodeParticleConnectionPoint {
        return this._inputs[3];
    }

    public get color(): NodeParticleConnectionPoint {
        return this._inputs[4];
    }

    public get scaling(): NodeParticleConnectionPoint {
        return this._inputs[5];
    }

    public get rotation(): NodeParticleConnectionPoint {
        return this._inputs[6];
    }

    public get mesh(): NodeParticleConnectionPoint {
        return this._inputs[7];
    }

    public get material(): NodeParticleConnectionPoint {
        return this._inputs[8];
    }

    public get solidParticle(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    public override _build(state: NodeParticleBuildState) {
        const meshData = this.mesh.getConnectedValue(state);
        const count = this.count.getConnectedValue(state) ?? 1;

        const material = this.material.getConnectedValue(state);

        const lifeTime = () => {
            return this.lifeTime.isConnected ? this.lifeTime.getConnectedValue(state) : Infinity;
        };

        const position = () => {
            return this.position.isConnected ? this.position.getConnectedValue(state) : Vector3.Zero();
        };
        const velocity = () => {
            return this.velocity.isConnected ? this.velocity.getConnectedValue(state) : Vector3.Zero();
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
            material,
            lifeTime,
            position,
            velocity,
            color,
            scaling,
            rotation,
            updateData: null,
        };

        this.solidParticle._storedValue = particleConfig;
    }
}

RegisterClass("BABYLON.CreateSolidParticleBlock", CreateSolidParticleBlock);
