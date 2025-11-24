import type { Color4, Vector3 } from "../../../../Maths";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "../../nodeParticleBlock";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
import type { ISolidParticleInitData } from "./ISolidParticleData";

/**
 * Block used to configure SPS particle parameters (mesh, count, material, position, velocity, color, scaling, rotation)
 */
export class InitSolidParticleBlock extends NodeParticleBlock {
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

        this.registerOutput("config", NodeParticleBlockConnectionPointTypes.SolidParticleConfig);
    }

    public override getClassName() {
        return "InitSolidParticleBlock";
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

    public get config(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    public override _build(state: NodeParticleBuildState) {
        const meshData = this.mesh.getConnectedValue(state);
        const count = (this.count.getConnectedValue(state) as number) ?? 1;
        const lifeTime = this.lifeTime.isConnected
            ? () => {
                  return (this.lifeTime.getConnectedValue(state) as number) ?? Infinity;
              }
            : undefined;
        const material = this.material.getConnectedValue(state);

        const position = this.position.isConnected ? () => this.position.getConnectedValue(state) as Vector3 : undefined;
        const velocity = this.velocity.isConnected ? () => this.velocity.getConnectedValue(state) as Vector3 : undefined;
        const color = this.color.isConnected ? () => this.color.getConnectedValue(state) as Color4 : undefined;
        const scaling = this.scaling.isConnected ? () => this.scaling.getConnectedValue(state) as Vector3 : undefined;
        const rotation = this.rotation.isConnected ? () => this.rotation.getConnectedValue(state) as Vector3 : undefined;

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
            updateBlock: null,
        };

        this.config._storedValue = particleConfig;
    }
}

RegisterClass("BABYLON.InitSolidParticleBlock", InitSolidParticleBlock);
