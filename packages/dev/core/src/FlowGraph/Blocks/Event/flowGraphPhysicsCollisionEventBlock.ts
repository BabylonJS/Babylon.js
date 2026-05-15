import { FlowGraphEventBlock } from "../../flowGraphEventBlock";
import { type FlowGraphContext } from "../../flowGraphContext";
import { type IFlowGraphBlockConfiguration } from "../../flowGraphBlock";
import { RegisterClass } from "../../../Misc/typeStore";
import { FlowGraphBlockNames } from "../flowGraphBlockNames";
import { type FlowGraphDataConnection } from "../../flowGraphDataConnection";
import { RichTypeAny, RichTypeNumber, RichTypeVector3 } from "../../flowGraphRichTypes";
import { type Vector3 } from "../../../Maths/math.vector";
import { type PhysicsBody } from "../../../Physics/v2/physicsBody";
import { type IPhysicsCollisionEvent } from "../../../Physics/v2/IPhysicsEnginePlugin";
import { type Observer } from "../../../Misc/observable";
import { type Nullable } from "../../../types";

/**
 * Configuration for the physics collision event block.
 */
export interface IFlowGraphPhysicsCollisionEventBlockConfiguration extends IFlowGraphBlockConfiguration {}

/**
 * @experimental
 * An event block that fires when a physics collision occurs on the specified body.
 * Subscribes to the body's collision observable and exposes collision details
 * (the other body, contact point, normal, impulse, and distance) as data outputs.
 */
export class FlowGraphPhysicsCollisionEventBlock extends FlowGraphEventBlock {
    /**
     * Input connection: The physics body to monitor for collisions.
     */
    public readonly body: FlowGraphDataConnection<PhysicsBody>;

    /**
     * Output connection: The other physics body involved in the collision.
     */
    public readonly otherBody: FlowGraphDataConnection<PhysicsBody>;

    /**
     * Output connection: The world-space contact point of the collision.
     */
    public readonly point: FlowGraphDataConnection<Vector3>;

    /**
     * Output connection: The world-space collision normal direction.
     */
    public readonly normal: FlowGraphDataConnection<Vector3>;

    /**
     * Output connection: The impulse magnitude computed by the physics solver.
     */
    public readonly impulse: FlowGraphDataConnection<number>;

    /**
     * Output connection: The penetration distance of the collision.
     */
    public readonly distance: FlowGraphDataConnection<number>;

    /**
     * Constructs a new FlowGraphPhysicsCollisionEventBlock.
     * @param config - optional configuration for the block
     */
    public constructor(
        /**
         * the configuration of the block
         */
        public override config?: IFlowGraphPhysicsCollisionEventBlockConfiguration
    ) {
        super(config);
        this.body = this.registerDataInput("body", RichTypeAny);
        this.otherBody = this.registerDataOutput("otherBody", RichTypeAny);
        this.point = this.registerDataOutput("point", RichTypeVector3);
        this.normal = this.registerDataOutput("normal", RichTypeVector3);
        this.impulse = this.registerDataOutput("impulse", RichTypeNumber);
        this.distance = this.registerDataOutput("distance", RichTypeNumber);
    }

    /**
     * @internal
     */
    public override _preparePendingTasks(context: FlowGraphContext): void {
        const physicsBody = this.body.getValue(context);
        if (!physicsBody) {
            this._reportError(context, "No physics body provided for collision event");
            return;
        }
        // Enable collision callbacks on the body
        physicsBody.setCollisionCallbackEnabled(true);
        const observer = physicsBody.getCollisionObservable().add((event) => {
            this._onCollision(context, event);
        });
        // Store observer and subscribed body per-context so multi-context usage is safe
        // and cleanup can target the original body even if the input changes.
        context._setExecutionVariable(this, "_collisionObserver", observer);
        context._setExecutionVariable(this, "_subscribedBody", physicsBody);
    }

    private _onCollision(context: FlowGraphContext, event: IPhysicsCollisionEvent): void {
        const physicsBody = this.body.getValue(context);
        // Determine the "other" body from the collision pair
        const other = event.collider === physicsBody ? event.collidedAgainst : event.collider;
        this.otherBody.setValue(other, context);
        if (event.point) {
            this.point.setValue(event.point, context);
        }
        if (event.normal) {
            this.normal.setValue(event.normal, context);
        }
        this.impulse.setValue(event.impulse, context);
        this.distance.setValue(event.distance, context);
        this._execute(context);
    }

    /**
     * @internal
     */
    public override _executeEvent(_context: FlowGraphContext, _payload: any): boolean {
        // This block manages its own observable subscription, so the
        // central event coordinator does not dispatch to it.
        return true;
    }

    /**
     * @internal
     */
    public override _cancelPendingTasks(context: FlowGraphContext): void {
        const observer = context._getExecutionVariable<Nullable<Observer<IPhysicsCollisionEvent>>>(this, "_collisionObserver", null);
        const subscribedBody = context._getExecutionVariable<Nullable<PhysicsBody>>(this, "_subscribedBody", null);
        if (observer && subscribedBody) {
            const observable = subscribedBody.getCollisionObservable();
            observable.remove(observer);
            // Disable collision callbacks if no other observers remain
            if (!observable.hasObservers()) {
                subscribedBody.setCollisionCallbackEnabled(false);
            }
        }
        context._setExecutionVariable(this, "_collisionObserver", null);
        context._setExecutionVariable(this, "_subscribedBody", null);
    }

    /**
     * @returns class name of the block.
     */
    public override getClassName(): string {
        return FlowGraphBlockNames.PhysicsCollisionEvent;
    }
}
RegisterClass(FlowGraphBlockNames.PhysicsCollisionEvent, FlowGraphPhysicsCollisionEventBlock);
