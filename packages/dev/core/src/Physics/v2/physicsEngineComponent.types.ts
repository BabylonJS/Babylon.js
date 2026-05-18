import { type Observer } from "../../Misc/observable";
import { type Node } from "../../node";
import { type Nullable } from "../../types";
import { type Vector3 } from "../../Maths/math.vector";
import { type PhysicsBody } from "./physicsBody";
declare module "../../Meshes/transformNode.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface TransformNode {
        /** @internal */
        _physicsBody: Nullable<PhysicsBody>;

        /**
         * Gets or sets the physics body associated with this node.
         */
        physicsBody: Nullable<PhysicsBody>;

        /**
         *
         */
        getPhysicsBody(): Nullable<PhysicsBody>;

        /** Apply a physic impulse to the mesh
         * @param force defines the force to apply
         * @param contactPoint defines where to apply the force
         * @returns the current mesh
         */
        applyImpulse(force: Vector3, contactPoint: Vector3): TransformNode;

        /** Apply a physic angular impulse to the mesh
         * @param angularImpulse defines the torque to apply
         * @returns the current mesh
         */
        applyAngularImpulse(angularImpulse: Vector3): TransformNode;

        /** Apply a physic torque to the mesh
         * @param torque defines the torque to apply
         * @returns the current mesh
         */
        applyTorque(torque: Vector3): TransformNode;

        /** @internal */
        _disposePhysicsObserver: Nullable<Observer<Node>>;
    }
}
