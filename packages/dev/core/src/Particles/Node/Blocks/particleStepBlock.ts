import { Vector2, Vector3, Vector4 } from "core/Maths/math.vector";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeParticleBlock } from "../nodeParticleBlock";
import type { NodeParticleConnectionPoint } from "../nodeParticleBlockConnectionPoint";
import { NodeParticleBlockConnectionPointTypes } from "../Enums/nodeParticleBlockConnectionPointTypes";

/**
 * Block used to step a value
 */
export class ParticleStepBlock extends NodeParticleBlock {
    /**
     * Creates a new ParticleStepBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("value", NodeParticleBlockConnectionPointTypes.AutoDetect);
        this.registerInput("edge", NodeParticleBlockConnectionPointTypes.Float, true, 0);
        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.BasedOnInput);

        this._outputs[0]._typeConnectionSource = this._inputs[0];
        this._inputs[0].excludedConnectionPointTypes.push(NodeParticleBlockConnectionPointTypes.Matrix);
        this._inputs[0].excludedConnectionPointTypes.push(NodeParticleBlockConnectionPointTypes.Particle);
        this._inputs[0].excludedConnectionPointTypes.push(NodeParticleBlockConnectionPointTypes.Texture);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "ParticleStepBlock";
    }

    /**
     * Gets the value operand input component
     */
    public get value(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the edge operand input component
     */
    public get edge(): NodeParticleConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    public override _build() {
        if (!this.value.isConnected) {
            this.output._storedFunction = null;
            this.output._storedValue = null;
            return;
        }
        const func = (value: number, edge: number) => {
            if (value < edge) {
                return 0;
            }

            return 1;
        };

        this.output._storedFunction = (state) => {
            const source = this.value.getConnectedValue(state);
            const edge = this.edge.getConnectedValue(state);
            switch (this.value.type) {
                case NodeParticleBlockConnectionPointTypes.Int:
                case NodeParticleBlockConnectionPointTypes.Float: {
                    return func(source, edge);
                }
                case NodeParticleBlockConnectionPointTypes.Vector2: {
                    return new Vector2(func(source.x, edge), func(source.y, edge));
                }
                case NodeParticleBlockConnectionPointTypes.Vector3: {
                    return new Vector3(func(source.x, edge), func(source.y, edge), func(source.z, edge));
                }
                case NodeParticleBlockConnectionPointTypes.Color4: {
                    return new Vector4(func(source.r, edge), func(source.g, edge), func(source.b, edge), func(source.a, edge));
                }
            }

            return 0;
        };

        return this;
    }
}

RegisterClass("BABYLON.ParticleStepBlock", ParticleStepBlock);
