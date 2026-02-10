import { NodeGeometryBlock } from "../../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../../nodeGeometryBlockConnectionPoint";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes";
import type { NodeGeometryBuildState } from "../../nodeGeometryBuildState";
import { GeometryInputBlock } from "../geometryInputBlock";
import { Matrix, Vector3 } from "../../../../Maths/math.vector";

/**
 * Block used to get a translation matrix
 */
export class TranslationBlock extends NodeGeometryBlock {
    /**
     * Create a new TranslationBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("translation", NodeGeometryBlockConnectionPointTypes.Vector3, false, Vector3.Zero());
        this.registerOutput("matrix", NodeGeometryBlockConnectionPointTypes.Matrix);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "TranslationBlock";
    }

    /**
     * Gets the translation input component
     */
    public get translation(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the matrix output component
     */
    public get matrix(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }

    /** @internal */
    public override autoConfigure() {
        if (!this.translation.isConnected) {
            const translationInput = new GeometryInputBlock("Translation");
            translationInput.value = new Vector3(0, 0, 0);
            translationInput.output.connectTo(this.translation);
        }
    }

    protected override _buildBlock(state: NodeGeometryBuildState) {
        super._buildBlock(state);

        this.matrix._storedFunction = (state) => {
            const value = this.translation.getConnectedValue(state) as Vector3;
            return Matrix.Translation(value.x, value.y, value.z);
        };
    }
}

RegisterClass("BABYLON.TranslationBlock", TranslationBlock);
