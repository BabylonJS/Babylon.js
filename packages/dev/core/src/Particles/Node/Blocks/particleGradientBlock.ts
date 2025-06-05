import { RegisterClass } from "../../../Misc/typeStore";
import { NodeParticleBlock } from "../nodeParticleBlock";
import { NodeParticleBlockConnectionPointTypes } from "../Enums/nodeParticleBlockConnectionPointTypes";
import type { NodeParticleConnectionPoint } from "../nodeParticleBlockConnectionPoint";
/**
 * Block used to define a list of gradient entries
 */
export class ParticleGradientBlock extends NodeParticleBlock {
    /**
     * Creates a new ParticleGradientBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("gradient", NodeParticleBlockConnectionPointTypes.Float, true, 1, 0, 1);
        this.registerInput("entry0", NodeParticleBlockConnectionPointTypes.AutoDetect);
        this.registerInput("entry1", NodeParticleBlockConnectionPointTypes.AutoDetect);
        this.registerInput("entry2", NodeParticleBlockConnectionPointTypes.AutoDetect);
        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.BasedOnInput);

        this._outputs[0]._typeConnectionSource = this._inputs[1];
        this._linkConnectionTypes(1, 2);
        this._linkConnectionTypes(1, 3);

        this._inputs[1].excludedConnectionPointTypes.push(NodeParticleBlockConnectionPointTypes.Matrix);
        this._inputs[1].excludedConnectionPointTypes.push(NodeParticleBlockConnectionPointTypes.Particle);
        this._inputs[1].excludedConnectionPointTypes.push(NodeParticleBlockConnectionPointTypes.Texture);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "ParticleGradientBlock";
    }

    /**
     * Gets the gradient operand input component
     */
    public get gradient(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    public override _build() {
        this.output._storedFunction = (_state) => {
            return 0;
        };
    }
}

RegisterClass("BABYLON.ParticleGradientBlock", ParticleGradientBlock);
