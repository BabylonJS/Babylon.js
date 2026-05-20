import { type Observer } from "../../Misc/observable";
import { type Node } from "../../node";
import { type Nullable } from "../../types";
import { type Vector3 } from "../../Maths/math.vector";
import { type Mesh } from "../../Meshes/mesh";
import { type PhysicsImpostor } from "./physicsImpostor";
declare module "../../Meshes/abstractMesh.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractMesh {
        /** @internal */
        _physicsImpostor: Nullable<PhysicsImpostor>;

        /**
         * Gets or sets impostor used for physic simulation
         * @see https://doc.babylonjs.com/features/featuresDeepDive/physics
         */
        physicsImpostor: Nullable<PhysicsImpostor>;

        /**
         * Gets the current physics impostor
         * @see https://doc.babylonjs.com/features/featuresDeepDive/physics
         * @returns a physics impostor or null
         */
        getPhysicsImpostor(): Nullable<PhysicsImpostor>;

        /** Apply a physic impulse to the mesh
         * @param force defines the force to apply
         * @param contactPoint defines where to apply the force
         * @returns the current mesh
         * @see https://doc.babylonjs.com/features/featuresDeepDive/physics/usingPhysicsEngine
         */
        applyImpulse(force: Vector3, contactPoint: Vector3): AbstractMesh;

        /**
         * Creates a physic joint between two meshes
         * @param otherMesh defines the other mesh to use
         * @param pivot1 defines the pivot to use on this mesh
         * @param pivot2 defines the pivot to use on the other mesh
         * @param options defines additional options (can be plugin dependent)
         * @returns the current mesh
         * @see https://www.babylonjs-playground.com/#0BS5U0#0
         */
        setPhysicsLinkWith(otherMesh: Mesh, pivot1: Vector3, pivot2: Vector3, options?: any): AbstractMesh;

        /** @internal */
        _disposePhysicsObserver: Nullable<Observer<Node>>;
    }
}
