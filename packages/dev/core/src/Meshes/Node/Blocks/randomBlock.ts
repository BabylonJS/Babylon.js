import { NodeGeometryBlock } from "../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../nodeGeometryBlockConnectionPoint";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes";
import type { NodeGeometryBuildState } from "../nodeGeometryBuildState";
import { GeometryInputBlock } from "./geometryInputBlock";
import { Vector2, Vector3, Vector4 } from "../../../Maths";
import type { Nullable } from "../../../types";

/**
 * Block used to get a random number
 */
export class RandomBlock extends NodeGeometryBlock {
    /**
     * Create a new RandomBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("min", NodeGeometryBlockConnectionPointTypes.AutoDetect);
        this.registerInput("max", NodeGeometryBlockConnectionPointTypes.AutoDetect);

        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.BasedOnInput);

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
     * Gets the left input component
     */
    public get min(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the positions input component
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

        switch (this.min.type) {
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

        this.output._storedFunction = func;
    }
}

RegisterClass("BABYLON.RandomBlock", RandomBlock);
