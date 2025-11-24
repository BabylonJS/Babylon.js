/* eslint-disable @typescript-eslint/naming-convention */

import { Color4, Vector3 } from "../../../../Maths";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "../../nodeParticleBlock";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
import type { ISpsParticleConfigData, ISpsUpdateData } from "./ISPSData";

/**
 * Block used to configure SPS particle parameters (mesh, count, material, initBlock, updateBlock)
 */
export class SPSParticleConfigBlock extends NodeParticleBlock {
    public constructor(name: string) {
        super(name);
        this.registerInput("mesh", NodeParticleBlockConnectionPointTypes.Mesh);
        this.registerInput("count", NodeParticleBlockConnectionPointTypes.Int, true, 1);
        this.registerInput("lifeTime", NodeParticleBlockConnectionPointTypes.Float, true);
        this.registerInput("position", NodeParticleBlockConnectionPointTypes.Vector3, true);
        this.registerInput("velocity", NodeParticleBlockConnectionPointTypes.Vector3, true);
        this.registerInput("color", NodeParticleBlockConnectionPointTypes.Color4, true);
        this.registerInput("scaling", NodeParticleBlockConnectionPointTypes.Vector3, true);
        this.registerInput("rotation", NodeParticleBlockConnectionPointTypes.Vector3, true);
        this.registerInput("material", NodeParticleBlockConnectionPointTypes.Material, true);
        this.registerInput("updateBlock", NodeParticleBlockConnectionPointTypes.System, true);

        this.registerOutput("config", NodeParticleBlockConnectionPointTypes.SolidParticleConfig);
    }

    public override getClassName() {
        return "SPSParticleConfigBlock";
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

    public get updateBlock(): NodeParticleConnectionPoint {
        return this._inputs[9];
    }

    public get config(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    public override _build(state: NodeParticleBuildState) {
        const meshData = this.mesh.getConnectedValue(state);
        const count = (this.count.getConnectedValue(state) as number) ?? 1;
        const lifeTime = (this.lifeTime.getConnectedValue(state) as number) ?? Infinity;
        const material = this.material.getConnectedValue(state);

        const position = (this.position.getConnectedValue(state) as Vector3) ?? new Vector3(0, 0, 0);
        const velocity = (this.velocity.getConnectedValue(state) as Vector3) ?? new Vector3(0, 0, 0);
        const color = (this.color.getConnectedValue(state) as Color4) ?? new Color4(1, 1, 1, 1);
        const scaling = (this.scaling.getConnectedValue(state) as Vector3) ?? new Vector3(1, 1, 1);
        const rotation = (this.rotation.getConnectedValue(state) as Vector3) ?? new Vector3(0, 0, 0);

        const updateBlock = this.updateBlock.isConnected ? (this.updateBlock.getConnectedValue(state) as ISpsUpdateData) : null;

        const particleConfig: ISpsParticleConfigData = {
            meshData,
            count,
            material,
            lifeTime,
            position,
            velocity,
            color,
            scaling,
            rotation,
            updateBlock,
        };

        this.config._storedValue = particleConfig;
    }
}

RegisterClass("BABYLON.SPSParticleConfigBlock", SPSParticleConfigBlock);
