import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "../../nodeParticleBlock";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
import type { ISPSCreateData } from "./ISPSData";
import { SPSSystemBlock } from "./SPSSystemBlock";

/**
 * Block used to configure SPS parameters (mesh, count, initBlocks)
 */
export class SPSCreateBlock extends NodeParticleBlock {
    public constructor(name: string) {
        super(name);

        this.registerInput("mesh", NodeParticleBlockConnectionPointTypes.Mesh);
        this.registerInput("count", NodeParticleBlockConnectionPointTypes.Int, true, 1);
        this.registerInput("material", NodeParticleBlockConnectionPointTypes.Material, true);
        this.registerInput("initBlock", NodeParticleBlockConnectionPointTypes.System, true);
        this.registerInput("updateBlock", NodeParticleBlockConnectionPointTypes.System, true);

        this.registerOutput("solidParticle", NodeParticleBlockConnectionPointTypes.SolidParticle);
    }

    public override getClassName() {
        return "SPSCreateBlock";
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

    public get solidParticle(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    public override _build(state: NodeParticleBuildState) {
        const mesh = this.mesh.getConnectedValue(state);
        const count = (this.count.getConnectedValue(state) as number) || 1;
        const material = this.material.getConnectedValue(state);

        const initBlock = this.initBlock.isConnected ? this.initBlock.getConnectedValue(state) : null;
        const updateBlock = this.updateBlock.isConnected ? this.updateBlock.getConnectedValue(state) : null;

        const solidParticle: ISPSCreateData = {
            mesh,
            count,
            material,
            initBlock,
            updateBlock,
        };

        this.solidParticle._storedValue = solidParticle;

        // If connected to SPSSystemBlock, add this create block to its particle sources
        if (this.solidParticle.isConnected && this.solidParticle.connectedPoint?.ownerBlock instanceof SPSSystemBlock) {
            const systemBlock = this.solidParticle.connectedPoint.ownerBlock as SPSSystemBlock;
            // Remove existing source if it exists
            systemBlock.removeParticleSource(solidParticle);
            // Add the new source
            systemBlock.addParticleSource(solidParticle);
        }
    }
}

RegisterClass("BABYLON.SPSCreateBlock", SPSCreateBlock);
