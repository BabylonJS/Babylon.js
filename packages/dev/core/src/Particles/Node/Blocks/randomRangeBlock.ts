import { Vector2, Vector3 } from "core/Maths/math.vector";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "../nodeParticleBlock";
import type { NodeParticleConnectionPoint } from "../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../nodeParticleBuildState";
import { Color4 } from "core/Maths/math.color";
import { ParticleRandomBlockLocks } from "./particleRandomBlock";
import { editableInPropertyPage, PropertyTypeForEdition } from "core/Decorators/nodeDecorator";
import type { Nullable } from "core/types";

/**
 * Block used to pick a value randomly from a range
 */
export class RandomRangeBlock extends NodeParticleBlock {
    private _currentLockId = -2;
    /**
     * Gets or sets a value indicating if that block will lock its value for a specific event
     */
    @editableInPropertyPage("LockMode", PropertyTypeForEdition.List, "ADVANCED", {
        notifiers: { rebuild: true },
        embedded: true,
        options: [
            { label: "None", value: ParticleRandomBlockLocks.None },
            { label: "Per particle", value: ParticleRandomBlockLocks.PerParticle },
            { label: "Per system", value: ParticleRandomBlockLocks.PerSystem },
        ],
    })
    public lockMode = ParticleRandomBlockLocks.PerParticle;
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
            NodeParticleBlockConnectionPointTypes.System,
            NodeParticleBlockConnectionPointTypes.FloatGradient,
            NodeParticleBlockConnectionPointTypes.Color4Gradient,
            NodeParticleBlockConnectionPointTypes.Vector2Gradient,
            NodeParticleBlockConnectionPointTypes.Vector3Gradient,
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
    public override _build() {
        let func: Nullable<(state: NodeParticleBuildState) => any> = null;
        this._currentLockId = -2;

        switch (this.min.type) {
            case NodeParticleBlockConnectionPointTypes.Float:
            case NodeParticleBlockConnectionPointTypes.Int:
                func = (state) => {
                    const minValue = this.min.getConnectedValue(state);
                    const maxValue = this.max.getConnectedValue(state);
                    return Math.random() * (maxValue - minValue) + minValue;
                };
                break;
            case NodeParticleBlockConnectionPointTypes.Vector2:
                func = (state) => {
                    const minValue = this.min.getConnectedValue(state);
                    const maxValue = this.max.getConnectedValue(state);
                    return new Vector2(Math.random() * (maxValue.x - minValue.x) + minValue.x, Math.random() * (maxValue.y - minValue.y) + minValue.y);
                };
                break;
            case NodeParticleBlockConnectionPointTypes.Vector3:
                func = (state) => {
                    const minValue = this.min.getConnectedValue(state);
                    const maxValue = this.max.getConnectedValue(state);
                    return new Vector3(
                        Math.random() * (maxValue.x - minValue.x) + minValue.x,
                        Math.random() * (maxValue.y - minValue.y) + minValue.y,
                        Math.random() * (maxValue.z - minValue.z) + minValue.z
                    );
                };
                break;
            case NodeParticleBlockConnectionPointTypes.Color4:
                func = (state) => {
                    const minValue = this.min.getConnectedValue(state);
                    const maxValue = this.max.getConnectedValue(state);
                    return new Color4(
                        Math.random() * (maxValue.r - minValue.r) + minValue.r,
                        Math.random() * (maxValue.g - minValue.g) + minValue.g,
                        Math.random() * (maxValue.b - minValue.b) + minValue.b,
                        Math.random() * (maxValue.a - minValue.a) + minValue.a
                    );
                };
                break;
        }

        this.output._storedFunction = (state: NodeParticleBuildState) => {
            let lockId = 0;

            switch (this.lockMode) {
                case ParticleRandomBlockLocks.PerParticle:
                    lockId = state.particleContext?.id || -1;
                    break;
                case ParticleRandomBlockLocks.PerSystem:
                    lockId = state.buildId || 0;
                    break;
            }

            if (this._currentLockId !== lockId) {
                if (this.lockMode !== ParticleRandomBlockLocks.None) {
                    this._currentLockId = lockId;
                }
                this.output._storedValue = func!(state);
            }
            return this.output._storedValue;
        };
    }

    /**
     * Serializes this block in a JSON representation
     * @returns the serialized block object
     */
    public override serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.lockMode = this.lockMode;

        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);

        if (serializationObject.lockMode !== undefined) {
            this.lockMode = serializationObject.lockMode;
        }
    }
}

RegisterClass("BABYLON.RandomRangeBlock", RandomRangeBlock);
