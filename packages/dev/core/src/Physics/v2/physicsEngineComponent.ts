import type { Nullable } from "../../types";
import type { Observer } from "../../Misc/observable";
import type { Vector3 } from "../../Maths/math.vector";
import { AbstractMesh } from "../../Meshes/abstractMesh";
import type { Node } from "../../node";
import type { PhysicsBody } from "./physicsBody";

declare module "../../Meshes/abstractMesh" {
    /**
     *
     */
    /** @internal */
    export interface AbstractMesh {
        /** @internal */
        _physicsBody: Nullable<PhysicsBody>;

        /**
         * @see
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
        applyImpulse(force: Vector3, contactPoint: Vector3): AbstractMesh;

        /** @internal */
        _disposePhysicsObserver: Nullable<Observer<Node>>;
    }
}

Object.defineProperty(AbstractMesh.prototype, "physicsBody", {
    get: function (this: AbstractMesh) {
        return this._physicsBody;
    },
    set: function (this: AbstractMesh, value: Nullable<PhysicsBody>) {
        if (this._physicsBody === value) {
            return;
        }
        if (this._disposePhysicsObserver) {
            this.onDisposeObservable.remove(this._disposePhysicsObserver);
        }

        this._physicsBody = value;

        if (value) {
            this._disposePhysicsObserver = this.onDisposeObservable.add(() => {
                // Physics
                if (this.physicsBody) {
                    this.physicsBody.dispose(/*!doNotRecurse*/);
                    this.physicsBody = null;
                }
            });
        }
    },
    enumerable: true,
    configurable: true,
});

/**
 * Gets the current physics body
 * @returns a physics body or null
 */
/** @internal */
AbstractMesh.prototype.getPhysicsBody = function (): Nullable<PhysicsBody> {
    return this.physicsBody;
};

/**
 * Apply a physic impulse to the mesh
 * @param force defines the force to apply
 * @param contactPoint defines where to apply the force
 * @returns the current mesh
 * @see https://doc.babylonjs.com/features/featuresDeepDive/physics/usingPhysicsEngine
 */
/** @internal */
AbstractMesh.prototype.applyImpulse = function (force: Vector3, contactPoint: Vector3): AbstractMesh {
    if (!this.physicsBody) {
        throw new Error("No Physics Body for AbstractMesh");
    }
    this.physicsBody.applyImpulse(force, contactPoint);
    return this;
};
