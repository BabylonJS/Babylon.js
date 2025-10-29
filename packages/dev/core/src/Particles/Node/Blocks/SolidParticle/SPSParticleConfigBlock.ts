import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "../../nodeParticleBlock";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
import type { ISPSParticleConfigData } from "./ISPSData";

/**
 * Block used to configure SPS particle parameters (mesh, count, material, initBlock, updateBlock)
 */
export class SPSParticleConfigBlock extends NodeParticleBlock {
    public constructor(name: string) {
        super(name);

        this.registerInput("mesh", NodeParticleBlockConnectionPointTypes.Mesh);
        this.registerInput("count", NodeParticleBlockConnectionPointTypes.Int, true, 1);
        this.registerInput("material", NodeParticleBlockConnectionPointTypes.Material, true);
        this.registerInput("initBlock", NodeParticleBlockConnectionPointTypes.System, true);
        this.registerInput("updateBlock", NodeParticleBlockConnectionPointTypes.System, true);

        this.registerOutput("particleConfig", NodeParticleBlockConnectionPointTypes.SolidParticle);
    }

    public override getClassName() {
        return "SPSParticleConfigBlock";
    }

    public get mesh(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    public get count(): NodeParticleConnectionPoint {
        return this._inputs[1];
    }

    public get material(): NodeParticleConnectionPoint {
        return this._inputs[2];
    }

    public get initBlock(): NodeParticleConnectionPoint {
        return this._inputs[3];
    }

    public get updateBlock(): NodeParticleConnectionPoint {
        return this._inputs[4];
    }

    public get particleConfig(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    public override _build(state: NodeParticleBuildState) {
        const mesh = this.mesh.getConnectedValue(state);
        const count = (this.count.getConnectedValue(state) as number) || 1;
        const material = this.material.getConnectedValue(state);

        const initBlock = this.initBlock.isConnected ? this.initBlock.getConnectedValue(state) : null;
        const updateBlock = this.updateBlock.isConnected ? this.updateBlock.getConnectedValue(state) : null;

        const particleConfig: ISPSParticleConfigData = {
            mesh,
            count,
            material,
            initBlock,
            updateBlock,
        };

        this.particleConfig._storedValue = particleConfig;
    }
}

RegisterClass("BABYLON.SPSParticleConfigBlock", SPSParticleConfigBlock);
