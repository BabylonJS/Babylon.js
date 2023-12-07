import { NodeGeometryBlock } from "../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../nodeGeometryBlockConnectionPoint";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes";
import type { NodeGeometryBuildState } from "../nodeGeometryBuildState";
import { GeometryInputBlock } from "./geometryInputBlock";
import { Vector2, Vector3, Vector4 } from "../../../Maths/math.vector";
import type { Nullable } from "../../../types";
import { PropertyTypeForEdition, editableInPropertyPage } from "core/Decorators/nodeDecorator";
import { NodeGeometryContextualSources } from "../Enums/nodeGeometryContextualSources";

/**
 * Locks supported by the random block
 */
export enum RandomBlockLocks {
    /** None */
    None,
    /** LoopID */
    LoopID,
    /** InstanceID */
    InstanceID,
}

/**
 * Block used to get a random number
 */
export class RandomBlock extends NodeGeometryBlock {
    private _currentLockId = -1;
    /**
     * Gets or sets a value indicating if that block will lock its value for a specific duration
     */
    @editableInPropertyPage("LockMode", PropertyTypeForEdition.List, "ADVANCED", {
        notifiers: { rebuild: true },
        options: [
            { label: "None", value: RandomBlockLocks.None },
            { label: "LoopID", value: RandomBlockLocks.LoopID },
            { label: "InstanceID", value: RandomBlockLocks.InstanceID },
        ],
    })
    public lockMode = RandomBlockLocks.None;

    /**
     * Create a new RandomBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("min", NodeGeometryBlockConnectionPointTypes.AutoDetect);
        this.registerInput("max", NodeGeometryBlockConnectionPointTypes.AutoDetect);

        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.BasedOnInput);

        this._inputs[0].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Matrix);
        this._inputs[0].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Geometry);
        this._inputs[0].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Texture);
        this._inputs[1].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Matrix);
        this._inputs[1].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Geometry);
        this._inputs[1].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Texture);

        this._outputs[0]._typeConnectionSource = this._inputs[0];
        this._linkConnectionTypes(0, 1);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "RandomBlock";
    }

    /**
     * Gets the min input component
     */
    public get min(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the max input component
     */
    public get max(): NodeGeometryConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the geometry output component
     */
    public get output(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    public autoConfigure() {
        if (!this.min.isConnected) {
            const minInput = new GeometryInputBlock("Min");
            minInput.value = 0;
            minInput.output.connectTo(this.min);
        }

        if (!this.max.isConnected) {
            const maxInput = new GeometryInputBlock("Max");
            maxInput.value = 1;
            maxInput.output.connectTo(this.max);
        }
    }

    protected _buildBlock() {
        let func: Nullable<(state: NodeGeometryBuildState) => any> = null;
        this._currentLockId = -1;

        switch (this.min.type) {
            case NodeGeometryBlockConnectionPointTypes.Int:
            case NodeGeometryBlockConnectionPointTypes.Float: {
                func = (state) => {
                    const min = this.min.getConnectedValue(state) || 0;
                    const max = this.max.getConnectedValue(state) || 0;
                    return min + Math.random() * (max - min);
                };
                break;
            }
            case NodeGeometryBlockConnectionPointTypes.Vector2: {
                func = (state) => {
                    const min = this.min.getConnectedValue(state) || Vector2.Zero();
                    const max = this.max.getConnectedValue(state) || Vector2.Zero();
                    return new Vector2(min.x + Math.random() * (max.x - min.x), min.y + Math.random() * (max.y - min.y));
                };
                break;
            }
            case NodeGeometryBlockConnectionPointTypes.Vector3: {
                func = (state) => {
                    const min = this.min.getConnectedValue(state) || Vector3.Zero();
                    const max = this.max.getConnectedValue(state) || Vector3.Zero();
                    return new Vector3(min.x + Math.random() * (max.x - min.x), min.y + Math.random() * (max.y - min.y), min.z + Math.random() * (max.z - min.z));
                };
                break;
            }
            case NodeGeometryBlockConnectionPointTypes.Vector4: {
                func = (state) => {
                    const min = this.min.getConnectedValue(state) || Vector4.Zero();
                    const max = this.max.getConnectedValue(state) || Vector4.Zero();
                    return new Vector4(
                        min.x + Math.random() * (max.x - min.x),
                        min.y + Math.random() * (max.y - min.y),
                        min.z + Math.random() * (max.z - min.z),
                        min.w + Math.random() * (max.w - min.w)
                    );
                };
                break;
            }
        }

        if (this.lockMode === RandomBlockLocks.None || !func) {
            this.output._storedFunction = func;
        } else {
            this.output._storedFunction = (state) => {
                let lockId = 0;

                switch (this.lockMode) {
                    case RandomBlockLocks.InstanceID:
                        lockId = state.getContextualValue(NodeGeometryContextualSources.InstanceID, true) || 0;
                        break;
                    case RandomBlockLocks.LoopID:
                        lockId = state.getContextualValue(NodeGeometryContextualSources.LoopID, true) || 0;
                        break;
                }

                if (this._currentLockId !== lockId || this.lockMode === RandomBlockLocks.None) {
                    this._currentLockId = lockId;
                    this.output._storedValue = func!(state);
                }
                return this.output._storedValue;
            };
        }
    }

    protected _dumpPropertiesCode() {
        const codeString = super._dumpPropertiesCode() + `${this._codeVariableName}.lockMode = BABYLON.RandomBlockLocks.${RandomBlockLocks[this.lockMode]};\n`;
        return codeString;
    }

    /**
     * Serializes this block in a JSON representation
     * @returns the serialized block object
     */
    public serialize(): any {
        const serializationObject = super.serialize();

        serializationObject.lockMode = this.lockMode;

        return serializationObject;
    }

    public _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);

        this.lockMode = serializationObject.lockMode;
    }
}

RegisterClass("BABYLON.RandomBlock", RandomBlock);
