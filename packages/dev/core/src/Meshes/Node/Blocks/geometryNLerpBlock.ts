import { Vector2, Vector3, Vector4 } from "core/Maths/math.vector";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes";
import { NodeGeometryBlock } from "../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../nodeGeometryBlockConnectionPoint";
/**
 * Block used to normalize lerp between 2 values
 */
export class GeometryNLerpBlock extends NodeGeometryBlock {
    /**
     * Creates a new GeometryNLerpBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("left", NodeGeometryBlockConnectionPointTypes.AutoDetect);
        this.registerInput("right", NodeGeometryBlockConnectionPointTypes.AutoDetect);
        this.registerInput("gradient", NodeGeometryBlockConnectionPointTypes.Float);
        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.BasedOnInput);

        this._outputs[0]._typeConnectionSource = this._inputs[0];
        this._linkConnectionTypes(0, 1);

        this._inputs[0].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Matrix);
        this._inputs[0].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Geometry);
        this._inputs[0].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Texture);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "GeometryNLerpBlock";
    }

    /**
     * Gets the left operand input component
     */
    public get left(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the right operand input component
     */
    public get right(): NodeGeometryConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the gradient operand input component
     */
    public get gradient(): NodeGeometryConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    protected _buildBlock() {
        if (!this.left.isConnected || !this.right.isConnected || !this.gradient.isConnected) {
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
                case NodeGeometryBlockConnectionPointTypes.Int:
                case NodeGeometryBlockConnectionPointTypes.Float: {
                    return func!(gradient, left, right); // NLerp is really lerp in that case
                }
                case NodeGeometryBlockConnectionPointTypes.Vector2: {
                    const result = new Vector2(func!(gradient, left.x, right.x), func!(gradient, left.y, right.y));
                    result.normalize();

                    return result;
                }
                case NodeGeometryBlockConnectionPointTypes.Vector3: {
                    const result = new Vector3(func!(gradient, left.x, right.x), func!(gradient, left.y, right.y), func!(gradient, left.z, right.z));
                    result.normalize();

                    return result;
                }
                case NodeGeometryBlockConnectionPointTypes.Vector4: {
                    const result = new Vector4(
                        func!(gradient, left.x, right.x),
                        func!(gradient, left.y, right.y),
                        func!(gradient, left.z, right.z),
                        func!(gradient, left.w, right.w)
                    );
                    result.normalize();

                    return result;
                }
            }

            return 0;
        };

        return this;
    }
}

RegisterClass("BABYLON.GeometryNLerpBlock", GeometryNLerpBlock);
