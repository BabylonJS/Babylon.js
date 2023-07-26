import { NodeGeometryBlock } from "../../nodeGeometryBlock";
import type { NodeGeometryConnectionPoint } from "../../nodeGeometryBlockConnectionPoint";
import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeGeometryBlockConnectionPointTypes } from "../../Enums/nodeGeometryConnectionPointTypes";
import type { NodeGeometryBuildState } from "../../nodeGeometryBuildState";
import { GeometryInputBlock } from "../geometryInputBlock";
import { Matrix } from "../../../../Maths";

/**
 * Block used to get a rotation matrix on X Axis
 */
export class RotationXBlock extends NodeGeometryBlock {
    /**
     * Create a new RotationXBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("angle", NodeGeometryBlockConnectionPointTypes.Float);
        this.registerOutput("matrix", NodeGeometryBlockConnectionPointTypes.Matrix);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public getClassName() {
        return "RotationXBlock";
    }    

    /**
     * Gets the angle input component
     */
    public get angle(): NodeGeometryConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the matrix output component
     */
    public get matrix(): NodeGeometryConnectionPoint {
        return this._outputs[0];
    }    

    public autoConfigure() {
        if (!this.angle.isConnected) {
            const angleInput = new GeometryInputBlock("Angle");
            angleInput.value = 0;
            angleInput.output.connectTo(this.angle);
        }     
    }        

    protected _buildBlock(state: NodeGeometryBuildState) {    
        super._buildBlock(state);

        this.matrix._storedFunction = (state) => {
            return Matrix.RotationX(this.angle.getConnectedValue(state));
        }
    }

}

RegisterClass("BABYLON.RotationXBlock", RotationXBlock);
