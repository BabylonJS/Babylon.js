import { type FlowGraphContext } from "../../../flowGraphContext";
import { type FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import { FlowGraphExecutionBlockWithOutSignal } from "../../../flowGraphExecutionBlockWithOutSignal";
import { RichTypeAny, RichTypeVector3 } from "../../../flowGraphRichTypes";
import { type FlowGraphSignalConnection } from "../../../flowGraphSignalConnection";
import { RegisterClass } from "../../../../Misc/typeStore";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { type IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { type PhysicsBody } from "../../../../Physics/v2/physicsBody";
import { type Vector3 } from "../../../../Maths/math.vector";

/**
 * @experimental
 * A block that applies an impulse to a physics body at a given location.
 * Unlike a force (which is applied over time), an impulse is an instantaneous
 * change in momentum.
 */
export class FlowGraphApplyImpulseBlock extends FlowGraphExecutionBlockWithOutSignal {
    /**
     * Input connection: The physics body to apply the impulse to.
     */
    public readonly body: FlowGraphDataConnection<PhysicsBody>;

    /**
     * Input connection: The impulse vector to apply.
     */
    public readonly impulse: FlowGraphDataConnection<Vector3>;

    /**
     * Input connection: The world-space location at which to apply the impulse.
     */
    public readonly location: FlowGraphDataConnection<Vector3>;

    /**
     * Constructs a new FlowGraphApplyImpulseBlock.
     * @param config - optional configuration for the block
     */
    public constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);
        this.body = this.registerDataInput("body", RichTypeAny);
        this.impulse = this.registerDataInput("impulse", RichTypeVector3);
        this.location = this.registerDataInput("location", RichTypeVector3);
    }

    /**
     * @internal
     */
    public override _execute(context: FlowGraphContext, _callingSignal: FlowGraphSignalConnection): void {
        const physicsBody = this.body.getValue(context);
        if (!physicsBody) {
            this._reportError(context, "No physics body provided");
            this.out._activateSignal(context);
            return;
        }
        const impulseVec = this.impulse.getValue(context);
        const locationVec = this.location.getValue(context);
        physicsBody.applyImpulse(impulseVec, locationVec);
        this.out._activateSignal(context);
    }

    /**
     * @returns class name of the block.
     */
    public override getClassName(): string {
        return FlowGraphBlockNames.PhysicsApplyImpulse;
    }
}
RegisterClass(FlowGraphBlockNames.PhysicsApplyImpulse, FlowGraphApplyImpulseBlock);
