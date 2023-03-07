import { PhysicsBody } from "./physicsBody";
import { PhysicsMaterial } from "./physicsMaterial";
import { PhysicsShape } from "./physicsShape";
import { Logger } from "../../Misc/logger";
import type { Scene } from "../../scene";
import type { TransformNode } from "../../Meshes/transformNode";
import { Quaternion, Vector3 } from "../../Maths/math.vector";
import { Scalar } from "../../Maths/math.scalar";
import { ShapeType } from "./IPhysicsEnginePlugin";

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

    constructor(
        /**
         * The physics-enabled object used as the physics aggregate
         */
        public transformNode: TransformNode,
        /**
         * The type of the physics aggregate
         */
        public type: number,
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

        this.body = new PhysicsBody(transformNode, this._scene);
        this._addSizeOptions();
        this._options.center = _options.center ?? this.body.getObjectCenterDelta();
        this.shape = new PhysicsShape({ type, parameters: this._options as any }, this._scene);

        this.material = new PhysicsMaterial(this._options.friction, this._options.restitution, this._scene);
        this.body.setShape(this.shape);
        this.shape.setMaterial(this.material);
        this.body.setMassProperties({ centerOfMass: new Vector3(0, 0, 0), mass: this._options.mass, inertia: new Vector3(1, 1, 1), inertiaOrientation: Quaternion.Identity() });
    }

    private _addSizeOptions(): void {
        const impostorExtents = this.body.getObjectExtents();

        switch (this.type) {
            case ShapeType.SPHERE:
                if (Scalar.WithinEpsilon(impostorExtents.x, impostorExtents.y, 0.0001) && Scalar.WithinEpsilon(impostorExtents.x, impostorExtents.z, 0.0001)) {
                    this._options.radius = this._options.radius ? this._options.radius : impostorExtents.x / 2;
                } else {
                    Logger.Warn("Non uniform scaling is unsupported for sphere shapes.");
                }
                break;
            case ShapeType.CAPSULE:
                {
                    const capRadius = impostorExtents.x / 2;
                    this._options.radius = this._options.radius ?? capRadius;
                    this._options.pointA = this._options.pointA ?? new Vector3(0, -impostorExtents.y * 0.5 + capRadius, 0);
                    this._options.pointB = this._options.pointB ?? new Vector3(0, impostorExtents.y * 0.5 - capRadius, 0);
                }
                break;
            case ShapeType.CYLINDER:
                {
                    const capRadius = impostorExtents.x / 2;
                    this._options.radius = this._options.radius ? this._options.radius : capRadius;
                    this._options.pointA = this._options.pointA ? this._options.pointA : new Vector3(0, -impostorExtents.y * 0.5, 0);
                    this._options.pointB = this._options.pointB ? this._options.pointB : new Vector3(0, impostorExtents.y * 0.5, 0);
                }
                break;
            case ShapeType.MESH:
            case ShapeType.CONVEX_HULL:
            case ShapeType.BOX:
                this._options.extents = this._options.extents ? this._options.extents : new Vector3(impostorExtents.x, impostorExtents.y, impostorExtents.z);
                break;
        }
    }

    /**
     * Releases the body, shape and material
     */
    public dispose(): void {
        this.body.dispose();
        this.material.dispose();
        this.shape.dispose();
    }
}
