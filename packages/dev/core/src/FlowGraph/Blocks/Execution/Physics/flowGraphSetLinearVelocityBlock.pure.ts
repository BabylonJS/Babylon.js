/** This file must only contain pure code and pure imports */

import { type FlowGraphContext } from "../../../flowGraphContext";
import { type FlowGraphDataConnection } from "../../../flowGraphDataConnection.pure";
import { FlowGraphExecutionBlockWithOutSignal } from "../../../flowGraphExecutionBlockWithOutSignal";
import { RichTypeAny, RichTypeVector3 } from "../../../flowGraphRichTypes.pure";
import { type FlowGraphSignalConnection } from "../../../flowGraphSignalConnection.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { type IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { type PhysicsBody } from "../../../../Physics/v2/physicsBody";
import { type Vector3 } from "../../../../Maths/math.vector.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

/**
 * @experimental
 * A block that sets the linear velocity of a physics body.
 */
export class FlowGraphSetLinearVelocityBlock extends FlowGraphExecutionBlockWithOutSignal {
    /**
     * Input connection: The physics body whose velocity will be set.
     */
    public readonly body: FlowGraphDataConnection<PhysicsBody>;

    /**
     * Input connection: The linear velocity to set.
     */
    public readonly velocity: FlowGraphDataConnection<Vector3>;

    /**
     * Constructs a new FlowGraphSetLinearVelocityBlock.
     * @param config - optional configuration for the block
     */
    public constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);
        this.body = this.registerDataInput("body", RichTypeAny);
        this.velocity = this.registerDataInput("velocity", RichTypeVector3);
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
        physicsBody.setLinearVelocity(this.velocity.getValue(context));
        this.out._activateSignal(context);
    }

    /**
     * @returns class name of the block.
     */
    public override getClassName(): string {
        return FlowGraphBlockNames.PhysicsSetLinearVelocity;
    }
}

let _Registered = false;
/**
 * Register side effects for flowGraphSetLinearVelocityBlock.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterFlowGraphSetLinearVelocityBlock(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    RegisterClass(FlowGraphBlockNames.PhysicsSetLinearVelocity, FlowGraphSetLinearVelocityBlock);
}
