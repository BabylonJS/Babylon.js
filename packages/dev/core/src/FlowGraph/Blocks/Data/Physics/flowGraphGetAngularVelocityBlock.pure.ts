/** This file must only contain pure code and pure imports */

import { type IFlowGraphBlockConfiguration } from "../../../flowGraphBlock";
import { type FlowGraphContext } from "../../../flowGraphContext";
import { type FlowGraphDataConnection } from "../../../flowGraphDataConnection.pure";
import { RichTypeAny, RichTypeVector3 } from "../../../flowGraphRichTypes.pure";
import { FlowGraphBlockNames } from "../../flowGraphBlockNames";
import { FlowGraphCachedOperationBlock } from "../flowGraphCachedOperationBlock";
import { type PhysicsBody } from "../../../../Physics/v2/physicsBody";
import { Vector3 } from "../../../../Maths/math.vector.pure";
import { RegisterClass } from "../../../../Misc/typeStore";

/**
 * @experimental
 * A data block that reads the angular velocity of a physics body.
 */
export class FlowGraphGetAngularVelocityBlock extends FlowGraphCachedOperationBlock<Vector3> {
    /**
     * Input connection: The physics body to read the angular velocity from.
     */
    public readonly body: FlowGraphDataConnection<PhysicsBody>;

    /**
     * Constructs a new FlowGraphGetAngularVelocityBlock.
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
        physicsBody.getAngularVelocityToRef(result);
        return result;
    }

    /**
     * @returns class name of the block.
     */
    public override getClassName(): string {
        return FlowGraphBlockNames.PhysicsGetAngularVelocity;
    }
}

let _Registered = false;
/**
 * Register side effects for flowGraphGetAngularVelocityBlock.
 * Safe to call multiple times; only the first call has an effect.
 */
export function RegisterFlowGraphGetAngularVelocityBlock(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    RegisterClass(FlowGraphBlockNames.PhysicsGetAngularVelocity, FlowGraphGetAngularVelocityBlock);
}
