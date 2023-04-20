import { PhysicsBody } from "./physicsBody";
import type { PhysicsMaterial } from "./physicsMaterial";
import { PhysicsShape } from "./physicsShape";
import { Logger } from "../../Misc/logger";
import type { Scene } from "../../scene";
import type { TransformNode } from "../../Meshes/transformNode";
import { TmpVectors, Vector3 } from "../../Maths/math.vector";
import { Scalar } from "../../Maths/math.scalar";
import { PhysicsMotionType, PhysicsShapeType } from "./IPhysicsEnginePlugin";
import type { Mesh } from "../../Meshes/mesh";
import type { Observer } from "../../Misc/observable";
import type { Nullable } from "../../types";
import type { Node } from "../../node";
import type { AbstractMesh } from "../../Meshes/abstractMesh";
import { BoundingBox } from "../../Culling/boundingBox";

/**
 * The interface for the physics aggregate parameters
 */
export interface PhysicsAggregateParameters {
    /**
     * The mass of the physics aggregate
     */
    mass: number;
    /**
     * The friction of the physics aggregate
     */
    friction?: number;
    /**
     * The coefficient of restitution of the physics aggregate
     */
    restitution?: number;
    /**
     * The native options of the physics aggregate
     */
    nativeOptions?: any;
    /**
     * Specifies if the parent should be ignored
     */
    ignoreParent?: boolean;
    /**
     * Specifies if bi-directional transformations should be disabled
     */
    disableBidirectionalTransformation?: boolean;
    /**
     * The pressure inside the physics aggregate, soft object only
     */
    pressure?: number;
    /**
     * The stiffness the physics aggregate, soft object only
     */
    stiffness?: number;
    /**
     * The number of iterations used in maintaining consistent vertex velocities, soft object only
     */
    velocityIterations?: number;
    /**
     * The number of iterations used in maintaining consistent vertex positions, soft object only
     */
    positionIterations?: number;
    /**
     * The number used to fix points on a cloth (0, 1, 2, 4, 8) or rope (0, 1, 2) only
     * 0 None, 1, back left or top, 2, back right or bottom, 4, front left, 8, front right
     * Add to fix multiple points
     */
    fixedPoints?: number;
    /**
     * The collision margin around a soft object
     */
    margin?: number;
    /**
     * The collision margin around a soft object
     */
    damping?: number;
    /**
     * The path for a rope based on an extrusion
     */
    path?: any;
    /**
     * The shape of an extrusion used for a rope based on an extrusion
     */
    shape?: any;

    /**
     * Radius for sphere, cylinder and capsule
     */
    radius?: number;

    /**
     * Starting point for cylinder/capsule
     */
    pointA?: Vector3;

    /**
     * Ending point for cylinder/capsule
     */
    pointB?: Vector3;

    /**
     * Extents for box
     */
    extents?: Vector3;

    /**
     * mesh local center
     */
    center?: Vector3;

    /**
     * mesh object. Used for mesh and convex hull aggregates.
     */
    mesh?: Mesh;

    /**
     * Physics engine will try to make this body sleeping and not active
     */
    startAsleep?: boolean;
}
/**
 * Helper class to create and interact with a PhysicsAggregate.
 * This is a transition object that works like Physics Plugin V1 Impostors.
 * This helper instanciate all mandatory physics objects to get a body/shape and material.
 * It's less efficient that handling body and shapes independently but for prototyping or
 * a small numbers of physics objects, it's good enough.
 */
export class PhysicsAggregate {
    /**
     * The body that is associated with this aggregate
     */
    public body: PhysicsBody;

    /**
     * The shape that is associated with this aggregate
     */
    public shape: PhysicsShape;

    /**
     * The material that is associated with this aggregate
     */
    public material: PhysicsMaterial;

    private _disposeShapeWhenDisposed = true;

    private _nodeDisposeObserver: Nullable<Observer<Node>>;

    constructor(
        /**
         * The physics-enabled object used as the physics aggregate
         */
        public transformNode: TransformNode,
        /**
         * The type of the physics aggregate
         */
        public type: PhysicsShapeType | PhysicsShape,
        private _options: PhysicsAggregateParameters = { mass: 0 },
        private _scene?: Scene
    ) {
        //sanity check!
        if (!this.transformNode) {
            Logger.Error("No object was provided. A physics object is obligatory");
            return;
        }
        if (this.transformNode.parent && this._options.mass !== 0) {
            Logger.Warn("A physics impostor has been created for an object which has a parent. Babylon physics currently works in local space so unexpected issues may occur.");
        }

        // Legacy support for old syntax.
        if (!this._scene && transformNode.getScene) {
            this._scene = transformNode.getScene();
        }

        if (!this._scene) {
            return;
        }

        //default options params
        this._options.mass = _options.mass === void 0 ? 0 : _options.mass;
        this._options.friction = _options.friction === void 0 ? 0.2 : _options.friction;
        this._options.restitution = _options.restitution === void 0 ? 0.2 : _options.restitution;

        const motionType = this._options.mass === 0 ? PhysicsMotionType.STATIC : PhysicsMotionType.DYNAMIC;
        const startAsleep = this._options.startAsleep ?? false;
        this.body = new PhysicsBody(transformNode, motionType, startAsleep, this._scene);
        this._addSizeOptions();
        if ((type as any).getClassName && (type as any).getClassName() === "PhysicsShape") {
            this.shape = type as PhysicsShape;
            this._disposeShapeWhenDisposed = false;
        } else {
            this.shape = new PhysicsShape({ type: type as PhysicsShapeType, parameters: this._options as any }, this._scene);
        }

        this.material = { friction: this._options.friction, restitution: this._options.restitution };
        this.body.shape = this.shape;
        this.shape.material = this.material;

        this.body.setMassProperties({ mass: this._options.mass });

        this._nodeDisposeObserver = this.transformNode.onDisposeObservable.add(() => {
            this.dispose();
        });
    }

    private _getObjectBoundingBox() {
        if ((this.transformNode as AbstractMesh).getRawBoundingInfo) {
            return (this.transformNode as AbstractMesh).getRawBoundingInfo().boundingBox;
        } else {
            return new BoundingBox(new Vector3(-0.5, -0.5, -0.5), new Vector3(0.5, 0.5, 0.5));
        }
    }

    private _addSizeOptions(): void {
        this.transformNode.computeWorldMatrix(true);
        const bb = this._getObjectBoundingBox();
        const extents = TmpVectors.Vector3[0];
        extents.copyFrom(bb.extendSizeWorld);
        extents.scaleInPlace(2);
        extents.multiplyInPlace(this.transformNode.scaling);

        const min = TmpVectors.Vector3[1];
        min.copyFrom(bb.minimum);
        min.scaleInPlace(2);
        min.multiplyInPlace(this.transformNode.scaling);

        if (!this._options.center) {
            const center = new Vector3();
            center.copyFrom(bb.center);
            center.multiplyInPlace(this.transformNode.scaling);
            this._options.center = center;
        }

        switch (this.type) {
            case PhysicsShapeType.SPHERE:
                if (!this._options.radius && Scalar.WithinEpsilon(extents.x, extents.y, 0.0001) && Scalar.WithinEpsilon(extents.x, extents.z, 0.0001)) {
                    this._options.radius = extents.x / 2;
                } else if (!this._options.radius) {
                    Logger.Warn("Non uniform scaling is unsupported for sphere shapes. Setting the radius to the biggest bounding box extent.");
                    this._options.radius = Math.max(extents.x, extents.y, extents.z) / 2;
                }
                break;
            case PhysicsShapeType.CAPSULE:
                {
                    const capRadius = extents.x / 2;
                    this._options.radius = this._options.radius ?? capRadius;
                    this._options.pointA = this._options.pointA ?? new Vector3(0, min.y + capRadius, 0);
                    this._options.pointB = this._options.pointB ?? new Vector3(0, min.y + extents.y - capRadius, 0);
                }
                break;
            case PhysicsShapeType.CYLINDER:
                {
                    const capRadius = extents.x / 2;
                    this._options.radius = this._options.radius ?? capRadius;
                    this._options.pointA = this._options.pointA ?? new Vector3(0, min.y, 0);
                    this._options.pointB = this._options.pointB ?? new Vector3(0, min.y + extents.y, 0);
                }
                break;
            case PhysicsShapeType.MESH:
            case PhysicsShapeType.CONVEX_HULL:
                if (!this._options.mesh && (this.transformNode.getClassName() === "Mesh" || this.transformNode.getClassName() === "InstancedMesh")) {
                    this._options.mesh = this.transformNode as Mesh;
                } else if (
                    !(
                        this._options.mesh &&
                        this._options.mesh.getClassName &&
                        (this._options.mesh.getClassName() === "Mesh" || this._options.mesh.getClassName() === "InstancedMesh")
                    )
                ) {
                    throw new Error("No valid mesh was provided for mesh or convex hull shape parameter.");
                }
                break;
            case PhysicsShapeType.BOX:
                this._options.extents = this._options.extents ?? new Vector3(extents.x, extents.y, extents.z);
                break;
        }
    }

    /**
     * Releases the body, shape and material
     */
    public dispose(): void {
        if (this._nodeDisposeObserver) {
            this.body.transformNode.onDisposeObservable.remove(this._nodeDisposeObserver);
            this._nodeDisposeObserver = null;
        }
        this.body.dispose();
        if (this._disposeShapeWhenDisposed) {
            this.shape.dispose();
        }
    }
}
