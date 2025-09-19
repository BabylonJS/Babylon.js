import { RegisterClass } from "../../../Misc/typeStore";
import { NodeParticleBlock } from "../nodeParticleBlock";
import { NodeParticleBlockConnectionPointTypes } from "../Enums/nodeParticleBlockConnectionPointTypes";
import type { NodeParticleConnectionPoint } from "../nodeParticleBlockConnectionPoint";

/**
 * Block used to compute vector length
 */
export class ParticleVectorLengthBlock extends NodeParticleBlock {
    /**
     * Creates a new ParticleVectorLengthBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("input", NodeParticleBlockConnectionPointTypes.AutoDetect);
        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.Float);

        this._inputs[0].addExcludedConnectionPointFromAllowedTypes(NodeParticleBlockConnectionPointTypes.Vector2 | NodeParticleBlockConnectionPointTypes.Vector3);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "ParticleVectorLengthBlock";
    }

    /**
     * Gets the input operand input component
     */
    public get input(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    public override _build() {
        if (!this.input.isConnected) {
            this.output._storedFunction = null;
            this.output._storedValue = null;
            return;
        }

        this.output._storedFunction = (state) => {
            const input = this.input.getConnectedValue(state);
            return input.length();
        };
    }
}

RegisterClass("BABYLON.ParticleVectorLengthBlock", ParticleVectorLengthBlock);
