import { Vector2, Vector3, Vector4 } from "../../../Maths/math.vector";
import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes";
import { NodeGeometryBlock } from "../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../nodeGeometryBlockConnectionPoint";

/**
 * Block used to posterize a value
 * @see https://en.wikipedia.org/wiki/Posterization
 */
export class GeometryPosterizeBlock extends NodeGeometryBlock {
    /**
     * Creates a new GeometryPosterizeBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("value", NodeGeometryBlockConnectionPointTypes.AutoDetect);
        this.registerInput("steps", NodeGeometryBlockConnectionPointTypes.AutoDetect);
        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.BasedOnInput);

        this._outputs[0]._typeConnectionSource = this._inputs[0];
        this._linkConnectionTypes(0, 1);

        this._inputs[0].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Matrix);
        this._inputs[1].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Matrix);
        this._inputs[1].acceptedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Float);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "GeometryPosterizeBlock";
    }

    /**
     * Gets the value input component
     */
    public get value(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the steps input component
     */
    public get steps(): NodeGeometryConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    protected override _buildBlock() {
        if (!this.value.isConnected || !this.steps.isConnected) {
            this.output._storedFunction = null;
            this.output._storedValue = null;
            return;
        }

        this.output._storedFunction = (state) => {
            const source = this.value.getConnectedValue(state);
            const steps = this.steps.getConnectedValue(state);
            let stepVector = steps;

            if (this.steps.type === NodeGeometryBlockConnectionPointTypes.Float) {
                switch (this.value.type) {
                    case NodeGeometryBlockConnectionPointTypes.Vector2:
                        stepVector = new Vector2(steps, steps);
                        break;
                    case NodeGeometryBlockConnectionPointTypes.Vector3:
                        stepVector = new Vector3(steps, steps, steps);
                        break;
                    case NodeGeometryBlockConnectionPointTypes.Vector4:
                        stepVector = new Vector4(steps, steps, steps, steps);
                        break;
                }
            }

            switch (this.value.type) {
                case NodeGeometryBlockConnectionPointTypes.Vector2:
                    return new Vector2((source.x / (1.0 / stepVector.x)) * (1.0 / stepVector.x), (source.y / (1.0 / stepVector.y)) * (1.0 / stepVector.y));
                case NodeGeometryBlockConnectionPointTypes.Vector3:
                    return new Vector3(
                        (source.x / (1.0 / stepVector.x)) * (1.0 / stepVector.x),
                        (source.y / (1.0 / stepVector.y)) * (1.0 / stepVector.y),
                        (source.z / (1.0 / stepVector.z)) * (1.0 / stepVector.z)
                    );
                case NodeGeometryBlockConnectionPointTypes.Vector4:
                    return new Vector4(
                        (source.x / (1.0 / stepVector.x)) * (1.0 / stepVector.x),
                        (source.y / (1.0 / stepVector.y)) * (1.0 / stepVector.y),
                        (source.z / (1.0 / stepVector.z)) * (1.0 / stepVector.z),
                        (source.w / (1.0 / stepVector.w)) * (1.0 / stepVector.w)
                    );
                default:
                    return Math.floor((source / (1.0 / steps)) * (1.0 / steps));
            }
        };

        return this;
    }
}
