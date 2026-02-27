import { Vector2, Vector3, Vector4 } from "core/Maths/math.vector";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeParticleBlock } from "../nodeParticleBlock";
import { NodeParticleBlockConnectionPointTypes } from "../Enums/nodeParticleBlockConnectionPointTypes";
import type { NodeParticleConnectionPoint } from "../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../nodeParticleBuildState";

/**
 * Block used to normalize lerp between 2 values
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class ParticleNLerpBlock extends NodeParticleBlock {
    /**
     * Creates a new ParticleNLerpBlock
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

        this._inputs[0].excludedConnectionPointTypes.push(NodeParticleBlockConnectionPointTypes.Matrix);
        this._inputs[0].excludedConnectionPointTypes.push(NodeParticleBlockConnectionPointTypes.Particle);
        this._inputs[0].excludedConnectionPointTypes.push(NodeParticleBlockConnectionPointTypes.Texture);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "ParticleNLerpBlock";
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

    public override _build(_state: NodeParticleBuildState) {
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
                    return func(gradient, left, right); // NLerp is really lerp in that case
                }
                case NodeParticleBlockConnectionPointTypes.Vector2: {
                    const result = new Vector2(func(gradient, left.x, right.x), func(gradient, left.y, right.y));
                    result.normalize();

                    return result;
                }
                case NodeParticleBlockConnectionPointTypes.Vector3: {
                    const result = new Vector3(func(gradient, left.x, right.x), func(gradient, left.y, right.y), func(gradient, left.z, right.z));
                    result.normalize();

                    return result;
                }
                case NodeParticleBlockConnectionPointTypes.Color4: {
                    const result = new Vector4(func(gradient, left.r, right.r), func(gradient, left.g, right.g), func(gradient, left.b, right.b), func(gradient, left.a, right.a));
                    result.normalize();

                    return result;
                }
            }

            return 0;
        };

        return this;
    }
}

RegisterClass("BABYLON.ParticleNLerpBlock", ParticleNLerpBlock);
