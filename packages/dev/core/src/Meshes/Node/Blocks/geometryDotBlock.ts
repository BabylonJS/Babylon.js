import { NodeGeometryBlockConnectionPointTypes } from "../Enums/nodeGeometryConnectionPointTypes";
import { NodeGeometryBlock } from "../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../nodeGeometryBlockConnectionPoint";

/**
 * Block used to apply a dot product between 2 vectors
 */
export class GeometryDotBlock extends NodeGeometryBlock {
    /**
     * Creates a new GeometryDotBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("left", NodeGeometryBlockConnectionPointTypes.AutoDetect);
        this.registerInput("right", NodeGeometryBlockConnectionPointTypes.AutoDetect);
        this.registerOutput("output", NodeGeometryBlockConnectionPointTypes.Float);

        this._linkConnectionTypes(0, 1);
        this._inputs[0].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Int);
        this._inputs[0].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Float);
        this._inputs[0].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Matrix);
        this._inputs[1].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Float);
        this._inputs[1].excludedConnectionPointTypes.push(NodeGeometryBlockConnectionPointTypes.Matrix);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "GeometryDotBlock";
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
     * Gets the output component
     */
    public get output(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    protected override _buildBlock() {
        if (!this.left.isConnected || !this.right.isConnected) {
            this.output._storedFunction = null;
            this.output._storedValue = null;
            return;
        }

        this.output._storedFunction = (state) => {
            const left = this.left.getConnectedValue(state);
            const right = this.right.getConnectedValue(state);

            return left.dot(right);
        };

        return this;
    }
}
