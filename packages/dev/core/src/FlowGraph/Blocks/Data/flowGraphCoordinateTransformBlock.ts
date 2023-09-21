import { FlowGraphBlock } from "../../flowGraphBlock";
import type { FlowGraphContext } from "../../flowGraphContext";
import type { FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { RichTypeAny, RichTypeVector3 } from "../../flowGraphRichTypes";
import { Vector3 } from "../../../Maths/math.vector";
import type { TransformNode } from "../../../Meshes/transformNode";

/**
 * @experimental
 * This blocks transforms a vector from one coordinate system to another.
 */
export class FlowGraphCoordinateTransformBlock extends FlowGraphBlock {
    public readonly sourceSystem: FlowGraphDataConnection<TransformNode>;
    public readonly destinationSystem: FlowGraphDataConnection<TransformNode>;
    public readonly inputCoordinates: FlowGraphDataConnection<Vector3>;
    public readonly outputCoordinates: FlowGraphDataConnection<Vector3>;

    constructor() {
        super();

        this.sourceSystem = this._registerDataInput("sourceSystem", RichTypeAny);
        this.destinationSystem = this._registerDataInput("destinationSystem", RichTypeAny);
        this.inputCoordinates = this._registerDataInput("inputCoordinates", RichTypeVector3);
        this.outputCoordinates = this._registerDataOutput("outputCoordinates", RichTypeVector3);
    }

    public _updateOutputs(_context: FlowGraphContext): void {
        const sourceSystemValue = this.sourceSystem.getValue(_context);
        const destinationSystemValue = this.destinationSystem.getValue(_context);
        const inputCoordinatesValue = this.inputCoordinates.getValue(_context);

        // takes coordinates from source space to world space
        const sourceWorld = sourceSystemValue.getWorldMatrix();
        // takes coordinates from destination space to world space
        const destinationWorld = destinationSystemValue.getWorldMatrix();
        // takes coordinates from world space to destination space
        const destinationWorldInverse = destinationWorld.invert();

        // takes coordinates from source space to world space to destination space
        const sourceToDestination = destinationWorldInverse.multiply(sourceWorld);
        const outputCoordinatesValue = Vector3.TransformCoordinates(inputCoordinatesValue, sourceToDestination);

        this.outputCoordinates.value = outputCoordinatesValue;
    }
}
