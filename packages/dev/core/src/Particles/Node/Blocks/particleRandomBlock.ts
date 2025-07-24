import { RegisterClass } from "../../../Misc/typeStore";
import { Vector2, Vector3 } from "../../../Maths/math.vector";
import type { Nullable } from "../../../types";
import { PropertyTypeForEdition, editableInPropertyPage } from "core/Decorators/nodeDecorator";
import { NodeParticleBlock } from "../nodeParticleBlock";
import { NodeParticleBlockConnectionPointTypes } from "../Enums/nodeParticleBlockConnectionPointTypes";
import type { NodeParticleConnectionPoint } from "../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../nodeParticleBuildState";
import { Color4 } from "core/Maths/math.color";

/**
 * Locks supported by the random block
 */
export enum ParticleRandomBlockLocks {
    /** None */
    None = 0,
    /** PerParticle */
    PerParticle = 1,
    /** PerSystem */
    PerSystem = 2,
}

/**
 * Block used to get a random number
 */
export class ParticleRandomBlock extends NodeParticleBlock {
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
     * Create a new ParticleRandomBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("min", NodeParticleBlockConnectionPointTypes.AutoDetect, true, 0);
        this.registerInput("max", NodeParticleBlockConnectionPointTypes.AutoDetect, true, 1);

        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.BasedOnInput);

        this._inputs[0].addExcludedConnectionPointFromAllowedTypes(
            NodeParticleBlockConnectionPointTypes.Float |
                NodeParticleBlockConnectionPointTypes.Int |
                NodeParticleBlockConnectionPointTypes.Vector2 |
                NodeParticleBlockConnectionPointTypes.Vector3 |
                NodeParticleBlockConnectionPointTypes.Color4
        );
        this._inputs[1].addExcludedConnectionPointFromAllowedTypes(
            NodeParticleBlockConnectionPointTypes.Float |
                NodeParticleBlockConnectionPointTypes.Int |
                NodeParticleBlockConnectionPointTypes.Vector2 |
                NodeParticleBlockConnectionPointTypes.Vector3 |
                NodeParticleBlockConnectionPointTypes.Color4
        );

        this._outputs[0]._typeConnectionSource = this._inputs[0];
        this._outputs[0]._defaultConnectionPointType = NodeParticleBlockConnectionPointTypes.Float;
        this._linkConnectionTypes(0, 1);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "ParticleRandomBlock";
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
     * Gets the geometry output component
     */
    public get output(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    public override _build() {
        let func: Nullable<(state: NodeParticleBuildState) => any> = null;
        this._currentLockId = -2;

        switch (this.min.type) {
            case NodeParticleBlockConnectionPointTypes.AutoDetect:
            case NodeParticleBlockConnectionPointTypes.Int:
            case NodeParticleBlockConnectionPointTypes.Float: {
                func = (state) => {
                    const min = this.min.getConnectedValue(state) || 0;
                    const max = this.max.getConnectedValue(state) || 1;
                    return min + Math.random() * (max - min);
                };
                break;
            }
            case NodeParticleBlockConnectionPointTypes.Vector2: {
                func = (state) => {
                    const min = this.min.getConnectedValue(state) || Vector2.Zero();
                    const max = this.max.getConnectedValue(state) || Vector2.One();
                    return new Vector2(min.x + Math.random() * (max.x - min.x), min.y + Math.random() * (max.y - min.y));
                };
                break;
            }
            case NodeParticleBlockConnectionPointTypes.Vector3: {
                func = (state) => {
                    const min = this.min.getConnectedValue(state) || Vector3.Zero();
                    const max = this.max.getConnectedValue(state) || Vector3.One();
                    return new Vector3(min.x + Math.random() * (max.x - min.x), min.y + Math.random() * (max.y - min.y), min.z + Math.random() * (max.z - min.z));
                };
                break;
            }
            case NodeParticleBlockConnectionPointTypes.Color4: {
                func = (state) => {
                    const min = this.min.getConnectedValue(state) || new Color4(0, 0, 0, 0);
                    const max = this.max.getConnectedValue(state) || new Color4(1, 1, 1, 1);
                    return new Color4(
                        min.r + Math.random() * (max.r - min.r),
                        min.g + Math.random() * (max.g - min.g),
                        min.b + Math.random() * (max.b - min.b),
                        min.a + Math.random() * (max.a - min.a)
                    );
                };
                break;
            }
        }

        this.output._storedFunction = (state) => {
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

        this.lockMode = serializationObject.lockMode;
    }
}

RegisterClass("BABYLON.ParticleRandomBlock", ParticleRandomBlock);
