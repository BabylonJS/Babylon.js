import { type FlowGraphContext } from "../../../flowGraphContext";
import { type FlowGraphDataConnection } from "../../../flowGraphDataConnection";
import { FlowGraphExecutionBlockWithOutSignal } from "../../../flowGraphExecutionBlockWithOutSignal";
import { RichTypeAny, RichTypeNumber } from "../../../flowGraphRichTypes";
import { type FlowGraphSignalConnection } from "../../../flowGraphSignalConnection";
import { RegisterClass } from "../../../../Misc/typeStore";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { type IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { type PhysicsBody } from "../../../../Physics/v2/physicsBody";
import { PhysicsMotionType } from "../../../../Physics/v2/IPhysicsEnginePlugin";

/**
 * @experimental
 * A block that sets the motion type of a physics body.
 *
 * The motion type input is a number corresponding to the PhysicsMotionType enum:
 * - 0 = STATIC (not moving, not affected by forces)
 * - 1 = ANIMATED (not affected by other bodies, but pushes them)
 * - 2 = DYNAMIC (fully simulated, affected by forces and collisions)
 */
export class FlowGraphSetPhysicsMotionTypeBlock extends FlowGraphExecutionBlockWithOutSignal {
    /**
     * Input connection: The physics body whose motion type will be set.
     */
    public readonly body: FlowGraphDataConnection<PhysicsBody>;

    /**
     * Input connection: The motion type to set (0=STATIC, 1=ANIMATED, 2=DYNAMIC).
     */
    public readonly motionType: FlowGraphDataConnection<number>;

    /**
     * Constructs a new FlowGraphSetPhysicsMotionTypeBlock.
     * @param config - optional configuration for the block
     */
    public constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);
        this.body = this.registerDataInput("body", RichTypeAny);
        this.motionType = this.registerDataInput("motionType", RichTypeNumber, PhysicsMotionType.DYNAMIC);
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
        physicsBody.setMotionType(this.motionType.getValue(context));
        this.out._activateSignal(context);
    }

    /**
     * @returns class name of the block.
     */
    public override getClassName(): string {
        return FlowGraphBlockNames.PhysicsSetMotionType;
    }
}
RegisterClass(FlowGraphBlockNames.PhysicsSetMotionType, FlowGraphSetPhysicsMotionTypeBlock);
