import { RegisterClass } from "../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "../nodeParticleBlock";
import type { NodeParticleConnectionPoint } from "../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../nodeParticleBuildState";
import { Vector2, Vector3, Vector4 } from "core/Maths";

/**
 * Block used to pick a value randomly from a range
 */
export class RandomRangeBlock extends NodeParticleBlock {
    /**
     * Create a new RandomRangeBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("min", NodeParticleBlockConnectionPointTypes.AutoDetect);
        this.registerInput("max", NodeParticleBlockConnectionPointTypes.AutoDetect);
        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.BasedOnInput);

        this.output._typeConnectionSource = this.min;

        this._linkConnectionTypes(0, 1);
        const excludedConnectionPointTypes = [
            NodeParticleBlockConnectionPointTypes.Matrix,
            NodeParticleBlockConnectionPointTypes.Particle,
            NodeParticleBlockConnectionPointTypes.Texture,
        ] as const;

        this.min.excludedConnectionPointTypes.push(...excludedConnectionPointTypes);
        this.max.excludedConnectionPointTypes.push(...excludedConnectionPointTypes);
    }

    /**
     * Gets the min input component
     */
    public get min(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the max input component
     */
    public get max(): NodeParticleConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "RandomRangeBlock";
    }

    /**
     * Builds the block
     */
    public override async _buildAsync() {
        this.output._storedFunction = (state: NodeParticleBuildState) => {
            const minValue = this.min.getConnectedValue(state);
            const maxValue = this.max.getConnectedValue(state);

            switch (this.min.type) {
                case NodeParticleBlockConnectionPointTypes.Float:
                case NodeParticleBlockConnectionPointTypes.Int:
                    return Math.random() * (maxValue - minValue) + minValue;
                case NodeParticleBlockConnectionPointTypes.Vector2:
                    return new Vector2(Math.random() * (maxValue.x - minValue.x) + minValue.x, Math.random() * (maxValue.y - minValue.y) + minValue.y);
                case NodeParticleBlockConnectionPointTypes.Vector3:
                    return new Vector3(
                        Math.random() * (maxValue.x - minValue.x) + minValue.x,
                        Math.random() * (maxValue.y - minValue.y) + minValue.y,
                        Math.random() * (maxValue.z - minValue.z) + minValue.z
                    );
                case NodeParticleBlockConnectionPointTypes.Vector4:
                    return new Vector4(
                        Math.random() * (maxValue.x - minValue.x) + minValue.x,
                        Math.random() * (maxValue.y - minValue.y) + minValue.y,
                        Math.random() * (maxValue.z - minValue.z) + minValue.z,
                        Math.random() * (maxValue.w - minValue.w) + minValue.w
                    );
            }
        };
    }
}

RegisterClass("BABYLON.RandomRangeBlock", RandomRangeBlock);
