import { type IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { type FlowGraphContext } from "../../../flowGraphContext";
import { type FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import { RichTypeAny, RichTypeVector3 } from "../../../flowGraphRichTypes";
import { RegisterClass } from "../../../../Misc/typeStore";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { FlowGraphCachedOperationBlock } from "../flowGraphCachedOperationBlock";
import { type PhysicsBody } from "../../../../Physics/v2/physicsBody";
import { Vector3 } from "../../../../Maths/math.vector";

/**
 * @experimental
 * A data block that reads the linear velocity of a physics body.
 */
export class FlowGraphGetLinearVelocityBlock extends FlowGraphCachedOperationBlock<Vector3> {
    /**
     * Input connection: The physics body to read the velocity from.
     */
    public readonly body: FlowGraphDataConnection<PhysicsBody>;

    /**
     * Constructs a new FlowGraphGetLinearVelocityBlock.
     * @param config - optional configuration for the block
     */
    public constructor(config?: IFlowGraphBlockConfiguration) {
        super(RichTypeVector3, config);
        this.body = this.registerDataInput("body", RichTypeAny);
    }

    /**
     * @internal
     */
    public override _doOperation(context: FlowGraphContext): Vector3 | undefined {
        const physicsBody = this.body.getValue(context);
        if (!physicsBody) {
            return undefined;
        }
        let result = context._getExecutionVariable<Vector3 | null>(this, "_cachedVelocity", null);
        if (!result) {
            result = new Vector3();
            context._setExecutionVariable(this, "_cachedVelocity", result);
        }
        physicsBody.getLinearVelocityToRef(result);
        return result;
    }

    /**
     * @returns class name of the block.
     */
    public override getClassName(): string {
        return FlowGraphBlockNames.PhysicsGetLinearVelocity;
    }
}
RegisterClass(FlowGraphBlockNames.PhysicsGetLinearVelocity, FlowGraphGetLinearVelocityBlock);
