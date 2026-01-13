import { RegisterClass } from "../../../Misc/typeStore";
import { Vector2, Vector3 } from "core/Maths/math.vector";
import { NodeParticleBlock } from "../nodeParticleBlock";
import { NodeParticleBlockConnectionPointTypes } from "../Enums/nodeParticleBlockConnectionPointTypes";
import type { NodeParticleConnectionPoint } from "../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../nodeParticleBuildState";
import { Color4 } from "../../../Maths/math.color";

/**
 * Block used to clamp a float
 */
export class ParticleClampBlock extends NodeParticleBlock {
    /** Gets or sets the minimum range */
    public get minimum() {
        return this.min.value;
    }

    public set minimum(value: number) {
        this.min.value = value;
    }

    /** Gets or sets the maximum range */
    public get maximum() {
        return this.max.value;
    }

    public set maximum(value: number) {
        this.max.value = value;
    }

    /**
     * Creates a new ParticleClampBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("value", NodeParticleBlockConnectionPointTypes.AutoDetect);
        this.registerInput("min", NodeParticleBlockConnectionPointTypes.Float, true, 0);
        this.registerInput("max", NodeParticleBlockConnectionPointTypes.Float, true, 1);
        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.BasedOnInput);

        this._outputs[0]._typeConnectionSource = this._inputs[0];
        this._inputs[0].excludedConnectionPointTypes.push(NodeParticleBlockConnectionPointTypes.Matrix);
        this._inputs[0].excludedConnectionPointTypes.push(NodeParticleBlockConnectionPointTypes.Particle);
        this._inputs[0].excludedConnectionPointTypes.push(NodeParticleBlockConnectionPointTypes.Texture);
        this._inputs[0].excludedConnectionPointTypes.push(NodeParticleBlockConnectionPointTypes.FloatGradient);
        this._inputs[0].excludedConnectionPointTypes.push(NodeParticleBlockConnectionPointTypes.Vector2Gradient);
        this._inputs[0].excludedConnectionPointTypes.push(NodeParticleBlockConnectionPointTypes.Vector3Gradient);
        this._inputs[0].excludedConnectionPointTypes.push(NodeParticleBlockConnectionPointTypes.Color4Gradient);
        this._inputs[0].excludedConnectionPointTypes.push(NodeParticleBlockConnectionPointTypes.System);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "ParticleClampBlock";
    }

    /**
     * Gets the value input component
     */
    public get value(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the min input component
     */
    public get min(): NodeParticleConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the max input component
     */
    public get max(): NodeParticleConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    public override _build(state: NodeParticleBuildState) {
        if (!this.value.isConnected) {
            this.output._storedFunction = null;
            this.output._storedValue = null;
            return;
        }

        const func = (value: number, min: number, max: number) => {
            return Math.max(min, Math.min(value, max));
        };

        this.output._storedFunction = (state) => {
            const value = this.value.getConnectedValue(state);
            const min = this.min.isConnected ? this.min.getConnectedValue(state) : this.minimum;
            const max = this.max.isConnected ? this.max.getConnectedValue(state) : this.maximum;

            switch (this.value.type) {
                case NodeParticleBlockConnectionPointTypes.Int:
                case NodeParticleBlockConnectionPointTypes.Float: {
                    return func(value, min, max);
                }
                case NodeParticleBlockConnectionPointTypes.Vector2: {
                    return new Vector2(func(value.x, min, max), func(value.y, min, max));
                }
                case NodeParticleBlockConnectionPointTypes.Vector3: {
                    return new Vector3(func(value.x, min, max), func(value.y, min, max), func(value.z, min, max));
                }
                case NodeParticleBlockConnectionPointTypes.Color4: {
                    return new Color4(func(value.x, min, max), func(value.y, min, max), func(value.z, min, max), func(value.w, min, max));
                }
            }

            return 0;
        };

        return this;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);

        this.minimum = serializationObject.minimum;
        this.maximum = serializationObject.maximum;
    }
}

RegisterClass("BABYLON.ParticleClampBlock", ParticleClampBlock);
