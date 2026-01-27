import { Vector2, Vector3, Vector4 } from "core/Maths/math.vector";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeParticleBlock } from "../nodeParticleBlock";
import { NodeParticleBlockConnectionPointTypes } from "../Enums/nodeParticleBlockConnectionPointTypes";
import type { NodeParticleConnectionPoint } from "../nodeParticleBlockConnectionPoint";

/**
 * Block used to smooth step a value
 */
export class ParticleSmoothStepBlock extends NodeParticleBlock {
    /**
     * Creates a new ParticleSmoothStepBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("value", NodeParticleBlockConnectionPointTypes.AutoDetect);
        this.registerInput("edge0", NodeParticleBlockConnectionPointTypes.Float, true, 0);
        this.registerInput("edge1", NodeParticleBlockConnectionPointTypes.Float, true, 1);
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
        return "ParticleSmoothStepBlock";
    }

    /**
     * Gets the value operand input component
     */
    public get value(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the first edge operand input component
     */
    public get edge0(): NodeParticleConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the second edge operand input component
     */
    public get edge1(): NodeParticleConnectionPoint {
        return this._inputs[2];
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

        const func = (value: number, edge0: number, edge1: number) => {
            const x = Math.max(0, Math.min((value - edge0) / (edge1 - edge0), 1));

            // Smoothstep formula: 3x^2 - 2x^3
            return x * x * (3 - 2 * x);
        };

        this.output._storedFunction = (state) => {
            const source = this.value.getConnectedValue(state);
            const edge0 = this.edge0.getConnectedValue(state);
            const edge1 = this.edge1.getConnectedValue(state);
            switch (this.value.type) {
                case NodeParticleBlockConnectionPointTypes.Int:
                case NodeParticleBlockConnectionPointTypes.Float: {
                    return func(source, edge0, edge1);
                }
                case NodeParticleBlockConnectionPointTypes.Vector2: {
                    return new Vector2(func(source.x, edge0, edge1), func(source.y, edge0, edge1));
                }
                case NodeParticleBlockConnectionPointTypes.Vector3: {
                    return new Vector3(func(source.x, edge0, edge1), func(source.y, edge0, edge1), func(source.z, edge0, edge1));
                }
                case NodeParticleBlockConnectionPointTypes.Color4: {
                    return new Vector4(func(source.r, edge0, edge1), func(source.g, edge0, edge1), func(source.b, edge0, edge1), func(source.a, edge0, edge1));
                }
            }

            return 0;
        };

        return this;
    }
}

RegisterClass("BABYLON.ParticleSmoothStepBlock", ParticleSmoothStepBlock);
