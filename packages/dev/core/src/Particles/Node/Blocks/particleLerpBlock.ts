import { RegisterClass } from "../../../Misc/typeStore";
import { Vector2, Vector3 } from "core/Maths/math.vector";
import { NodeParticleBlock } from "../nodeParticleBlock";
import { NodeParticleBlockConnectionPointTypes } from "../Enums/nodeParticleBlockConnectionPointTypes";
import type { NodeParticleConnectionPoint } from "../nodeParticleBlockConnectionPoint";
import { Color4 } from "core/Maths/math.color";
/**
 * Block used to lerp between 2 values
 */
export class ParticleLerpBlock extends NodeParticleBlock {
    /**
     * Creates a new GeometryLerpBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("left", NodeParticleBlockConnectionPointTypes.AutoDetect);
        this.registerInput("right", NodeParticleBlockConnectionPointTypes.AutoDetect);
        this.registerInput("gradient", NodeParticleBlockConnectionPointTypes.Float, true, 0, 0, 1);
        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.BasedOnInput);

        this._outputs[0]._typeConnectionSource = this._inputs[0];
        this._linkConnectionTypes(0, 1);

        this._inputs[0].addExcludedConnectionPointFromAllowedTypes(
            NodeParticleBlockConnectionPointTypes.Float |
                NodeParticleBlockConnectionPointTypes.Int |
                NodeParticleBlockConnectionPointTypes.Vector2 |
                NodeParticleBlockConnectionPointTypes.Vector3 |
                NodeParticleBlockConnectionPointTypes.Color4
        );
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "ParticleLerpBlock";
    }

    /**
     * Gets the left operand input component
     */
    public get left(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the right operand input component
     */
    public get right(): NodeParticleConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the gradient operand input component
     */
    public get gradient(): NodeParticleConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    public override _build() {
        if (!this.left.isConnected || !this.right.isConnected) {
            this.output._storedFunction = null;
            this.output._storedValue = null;
            return;
        }

        const func = (gradient: number, left: number, right: number) => {
            return (1 - gradient) * left + gradient * right;
        };

        this.output._storedFunction = (state) => {
            const left = this.left.getConnectedValue(state);
            const right = this.right.getConnectedValue(state);
            const gradient = this.gradient.getConnectedValue(state);
            switch (this.left.type) {
                case NodeParticleBlockConnectionPointTypes.Int:
                case NodeParticleBlockConnectionPointTypes.Float: {
                    return func(gradient, left, right);
                }
                case NodeParticleBlockConnectionPointTypes.Vector2: {
                    return new Vector2(func(gradient, left.x, right.x), func(gradient, left.y, right.y));
                }
                case NodeParticleBlockConnectionPointTypes.Vector3: {
                    return new Vector3(func(gradient, left.x, right.x), func(gradient, left.y, right.y), func(gradient, left.z, right.z));
                }
                case NodeParticleBlockConnectionPointTypes.Color4: {
                    return new Color4(func(gradient, left.r, right.r), func(gradient, left.g, right.g), func(gradient, left.b, right.b), func(gradient, left.a, right.a));
                }
            }

            return 0;
        };
    }
}

RegisterClass("BABYLON.ParticleLerpBlock", ParticleLerpBlock);
