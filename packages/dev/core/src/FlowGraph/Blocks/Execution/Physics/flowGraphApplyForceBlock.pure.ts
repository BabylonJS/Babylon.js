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
 * A block that applies a force to a physics body at a given location.
 */
export class FlowGraphApplyForceBlock extends FlowGraphExecutionBlockWithOutSignal {
    /**
     * Input connection: The physics body to apply the force to.
     */
    public readonly body: FlowGraphDataConnection<PhysicsBody>;

    /**
     * Input connection: The force vector to apply.
     */
    public readonly force: FlowGraphDataConnection<Vector3>;

    /**
     * Input connection: The world-space location at which to apply the force.
     */
    public readonly location: FlowGraphDataConnection<Vector3>;

    /**
     * Constructs a new FlowGraphApplyForceBlock.
     * @param config - optional configuration for the block
     */
    public constructor(config?: IFlowGraphBlockConfiguration) {
        super(config);
        this.body = this.registerDataInput("body", RichTypeAny);
        this.force = this.registerDataInput("force", RichTypeVector3);
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
        const forceVec = this.force.getValue(context);
        const locationVec = this.location.getValue(context);
        physicsBody.applyForce(forceVec, locationVec);
        this.out._activateSignal(context);
    }

    /**
     * @returns class name of the block.
     */
    public override getClassName(): string {
        return FlowGraphBlockNames.PhysicsApplyForce;
    }
}

let _Registered = false;
/**
 * Register side effects for flowGraphApplyForceBlock.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterFlowGraphApplyForceBlock(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    RegisterClass(FlowGraphBlockNames.PhysicsApplyForce, FlowGraphApplyForceBlock);
}
