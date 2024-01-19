import { FlowGraphBlock } from "../../flowGraphBlock";
import type { FlowGraphContext } from "../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { RichTypeAny, RichTypeVector3 } from "../../flowGraphRichTypes";
import { TmpVectors, Vector3 } from "../../../Maths/math.vector";
import type { TransformNode } from "../../../Meshes/transformNode";
import type { IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
import { RegisterClass } from "../../../Misc/typeStore";
/**
 * @experimental
 * This blocks transforms a vector from one coordinate system to another.
 */
export class FlowGraphCoordinateTransformBlock extends FlowGraphBlock {
    /**
     * Input connection: The source coordinate system.
     */
    public readonly sourceSystem: FlowGraphDataConnection<TransformNode>;
    /**
     * Input connection: The destination coordinate system.
     */
    public readonly destinationSystem: FlowGraphDataConnection<TransformNode>;
    /**
     * Input connection: The coordinates to transform.
     */
    public readonly inputCoordinates: FlowGraphDataConnection<Vector3>;
    /**
     * Output connection: The transformed coordinates.
     */
    public readonly outputCoordinates: FlowGraphDataConnection<Vector3>;

    /**
     * Creates a new FlowGraphCoordinateTransformBlock
     * @param config optional configuration for this block
     */
    constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);

        this.sourceSystem = this.registerDataInput("sourceSystem", RichTypeAny);
        this.destinationSystem = this.registerDataInput("destinationSystem", RichTypeAny);
        this.inputCoordinates = this.registerDataInput("inputCoordinates", RichTypeVector3);
        this.outputCoordinates = this.registerDataOutput("outputCoordinates", RichTypeVector3);
    }

    public _updateOutputs(_context: FlowGraphContext): void {
        const sourceSystemValue = this.sourceSystem.getValue(_context);
        const destinationSystemValue = this.destinationSystem.getValue(_context);
        const inputCoordinatesValue = this.inputCoordinates.getValue(_context);

        // takes coordinates from source space to world space
        const sourceWorld = sourceSystemValue.getWorldMatrix();
        // takes coordinates from destination space to world space
        const destinationWorld = destinationSystemValue.getWorldMatrix();
        const destinationWorldInverse = TmpVectors.Matrix[0].copyFrom(destinationWorld);
        // takes coordinates from world space to destination space
        destinationWorldInverse.invert();

        const sourceToDestination = TmpVectors.Matrix[1];
        // takes coordinates from source space to world space to destination space
        destinationWorldInverse.multiplyToRef(sourceWorld, sourceToDestination);
        const outputCoordinatesValue = this.outputCoordinates.getValue(_context);

        Vector3.TransformCoordinatesToRef(inputCoordinatesValue, sourceToDestination, outputCoordinatesValue);
    }

    /**
     * Gets the class name of this block
     * @returns the class name
     */
    public getClassName(): string {
        return "FGCoordinateTransformBlock";
    }
}
RegisterClass("FGCoordinateTransformBlock", FlowGraphCoordinateTransformBlock);
