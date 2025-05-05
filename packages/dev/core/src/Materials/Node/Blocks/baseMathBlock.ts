import type { Observer } from "core/Misc/observable";
import { NodeMaterialBlockTargets } from "../Enums/nodeMaterialBlockTargets";
import { NodeMaterialBlock } from "../nodeMaterialBlock";
import type { NodeMaterialConnectionPoint } from "../nodeMaterialBlockConnectionPoint";
import { NodeMaterialBlockConnectionPointTypes } from "../Enums/nodeMaterialBlockConnectionPointTypes";

/**
 * Block used to perform a mathematical operation on 2 values
 */
export class BaseMathBlock extends NodeMaterialBlock {
    private readonly _connectionObservers: Observer<NodeMaterialBlockConnectionPointTypes>[];

    protected constructor(name: string) {
        super(name, NodeMaterialBlockTargets.Neutral);

        this.registerInput("left", NodeMaterialBlockConnectionPointTypes.AutoDetect);
        this.registerInput("right", NodeMaterialBlockConnectionPointTypes.AutoDetect);
        this.registerOutput("output", NodeMaterialBlockConnectionPointTypes.BasedOnInput);

        this.output._typeConnectionSource = this.left;
        this._linkConnectionTypes(0, 1, true);

        this.left.acceptedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Float);
        this.right.acceptedConnectionPointTypes.push(NodeMaterialBlockConnectionPointTypes.Float);

        this._connectionObservers = [
            this.left.onTypeChangedObservable.add(() => this._updateInputOutputTypes()),
            this.right.onTypeChangedObservable.add(() => this._updateInputOutputTypes()),
        ];
    }

    /**
     * Gets the left operand input component
     */
    public get left(): NodeMaterialConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the right operand input component
     */
    public get right(): NodeMaterialConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeMaterialConnectionPoint {
        return this._outputs[0];
    }

    private _updateInputOutputTypes() {
        // First update the output type with the initial assumption that we'll base it on the left input.
        this.output._typeConnectionSource = this.left;

        if (this.left.isConnected && this.right.isConnected) {
            // Both inputs are connected, so we need to determine the output type based on the input types.
            if (
                this.left.type === NodeMaterialBlockConnectionPointTypes.Int ||
                (this.left.type === NodeMaterialBlockConnectionPointTypes.Float && this.right.type !== NodeMaterialBlockConnectionPointTypes.Int)
            ) {
                this.output._typeConnectionSource = this.right;
            }
        } else if (this.left.isConnected !== this.right.isConnected) {
            // Only one input is connected, so we need to determine the output type based on the connected input.
            this.output._typeConnectionSource = this.left.isConnected ? this.left : this.right;
        }

        // Next update the accepted connection point types for the inputs based on the current input connection state.
        if (this.left.isConnected || this.right.isConnected) {
            for (const [first, second] of [
                [this.left, this.right],
                [this.right, this.left],
            ]) {
                // Always allow Ints and Floats.
                first.acceptedConnectionPointTypes = [NodeMaterialBlockConnectionPointTypes.Int, NodeMaterialBlockConnectionPointTypes.Float];

                if (second.isConnected) {
                    // The same types as the connected input are always allowed.
                    first.acceptedConnectionPointTypes.push(second.type);

                    // If the other input is a scalar, then we also allow Vector/Color/Matrix types.
                    if (second.type === NodeMaterialBlockConnectionPointTypes.Int || second.type === NodeMaterialBlockConnectionPointTypes.Float) {
                        first.acceptedConnectionPointTypes.push(
                            NodeMaterialBlockConnectionPointTypes.Vector2,
                            NodeMaterialBlockConnectionPointTypes.Vector3,
                            NodeMaterialBlockConnectionPointTypes.Vector4,
                            NodeMaterialBlockConnectionPointTypes.Color3,
                            NodeMaterialBlockConnectionPointTypes.Color4,
                            NodeMaterialBlockConnectionPointTypes.Matrix
                        );
                    }
                }
            }
        }
    }

    /**
     * Release resources
     */
    public override dispose(): void {
        super.dispose();
        for (const observer of this._connectionObservers) {
            observer.remove();
        }
        this._connectionObservers.length = 0;
    }
}
