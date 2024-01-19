import type { TransformNode } from "../../Meshes/transformNode";
import type { AbstractMesh } from "../../Meshes/abstractMesh";
import type { BoundingBox } from "../../Culling/boundingBox";
import { PhysicsShapeType } from "./IPhysicsEnginePlugin";
import type { IPhysicsEnginePluginV2, PhysicsShapeParameters } from "./IPhysicsEnginePlugin";
import type { PhysicsMaterial } from "./physicsMaterial";
import { Matrix, Vector3, Quaternion, TmpVectors } from "../../Maths/math.vector";

import type { Mesh } from "../../Meshes/mesh";
import type { Scene } from "../../scene";

/**
 * Options for creating a physics shape
 */
export interface PhysicShapeOptions {
    /**
     * The type of the shape. This can be one of the following: SPHERE, BOX, CAPSULE, CYLINDER, CONVEX_HULL, MESH, HEIGHTFIELD, CONTAINER
     */
    type?: PhysicsShapeType;
    /**
     * The parameters of the shape. Varies depending of the shape type.
     */
    parameters?: PhysicsShapeParameters;
    /**
     * Reference to an already existing physics shape in the plugin.
     */
    pluginData?: any;
}

/**
 * PhysicsShape class.
 * This class is useful for creating a physics shape that can be used in a physics engine.
 * A Physic Shape determine how collision are computed. It must be attached to a body.
 */
export class PhysicsShape {
    /**
     * V2 Physics plugin private data for single shape
     */
    public _pluginData: any = undefined;
    /**
     * The V2 plugin used to create and manage this Physics Body
     */
    private _physicsPlugin: IPhysicsEnginePluginV2;

    private _type: PhysicsShapeType;

    private _material: PhysicsMaterial;

    private _isTrigger: boolean = false;

    private _isDisposed = false;

    /**
     * Constructs a new physics shape.
     * @param options The options for the physics shape. These are:
     *  * type: The type of the shape. This can be one of the following: SPHERE, BOX, CAPSULE, CYLINDER, CONVEX_HULL, MESH, HEIGHTFIELD, CONTAINER
     *  * parameters: The parameters of the shape.
     *  * pluginData: The plugin data of the shape. This is used if you already have a reference to the object on the plugin side.
     * You need to specify either type or pluginData.
     * @param scene The scene the shape belongs to.
     *
     * This code is useful for creating a new physics shape with the given type, options, and scene.
     * It also checks that the physics engine and plugin version are correct.
     * If not, it throws an error. This ensures that the shape is created with the correct parameters and is compatible with the physics engine.
     */
    constructor(options: PhysicShapeOptions, scene: Scene) {
        if (!scene) {
            return;
        }
        const physicsEngine = scene.getPhysicsEngine();
        if (!physicsEngine) {
            throw new Error("No Physics Engine available.");
        }
        if (physicsEngine.getPluginVersion() != 2) {
            throw new Error("Plugin version is incorrect. Expected version 2.");
        }
        const physicsPlugin = physicsEngine.getPhysicsPlugin();
        if (!physicsPlugin) {
            throw new Error("No Physics Plugin available.");
        }
        this._physicsPlugin = physicsPlugin as IPhysicsEnginePluginV2;

        if (options.pluginData !== undefined && options.pluginData !== null) {
            this._pluginData = options.pluginData;
            this._type = this._physicsPlugin.getShapeType(this);
        } else if (options.type !== undefined && options.type !== null) {
            this._type = options.type;
            const parameters = options.parameters ?? {};
            this._physicsPlugin.initShape(this, options.type, parameters);
        }
    }

    /**
     * Returns the string "PhysicsShape".
     * @returns "PhysicsShape"
     */
    public getClassName() {
        return "PhysicsShape";
    }

    /**
     * Returns the type of the physics shape.
     * @returns The type of the physics shape.
     */
    public get type(): PhysicsShapeType {
        return this._type;
    }

    /**
     * Set the membership mask of a shape. This is a bitfield of arbitrary
     * "categories" to which the shape is a member. This is used in combination
     * with the collide mask to determine if this shape should collide with
     * another.
     *
     * @param membershipMask Bitfield of categories of this shape.
     */
    public set filterMembershipMask(membershipMask: number) {
        this._physicsPlugin.setShapeFilterMembershipMask(this, membershipMask);
    }

    /**
     * Get the membership mask of a shape.
     * @returns Bitmask of categories which this shape is a member of.
     */
    public get filterMembershipMask(): number {
        return this._physicsPlugin.getShapeFilterMembershipMask(this);
    }

    /**
     * Sets the collide mask of a shape. This is a bitfield of arbitrary
     * "categories" to which this shape collides with. Given two shapes,
     * the engine will check if the collide mask and membership overlap:
     * shapeA.filterMembershipMask & shapeB.filterCollideMask
     *
     * If this value is zero (i.e. shapeB only collides with categories
     * which shapeA is _not_ a member of) then the shapes will not collide.
     *
     * Note, the engine will also perform the same test with shapeA and
     * shapeB swapped; the shapes will not collide if either shape has
     * a collideMask which prevents collision with the other shape.
     *
     * @param collideMask Bitmask of categories this shape should collide with
     */
    public set filterCollideMask(collideMask: number) {
        this._physicsPlugin.setShapeFilterCollideMask(this, collideMask);
    }

    /**
     *
     * @returns Bitmask of categories that this shape should collide with
     */
    public get filterCollideMask(): number {
        return this._physicsPlugin.getShapeFilterCollideMask(this);
    }
    /**
     *
     * @param material
     */
    public set material(material: PhysicsMaterial) {
        this._physicsPlugin.setMaterial(this, material);
        this._material = material;
    }

    /**
     * Returns the material of the physics shape.
     * @returns The material of the physics shape.
     */
    public get material(): PhysicsMaterial {
        if (!this._material) {
            this._material = this._physicsPlugin.getMaterial(this);
        }
        return this._material;
    }

    /**
     * Sets the density of the physics shape.
     * @param density The density of the physics shape.
     */
    public set density(density: number) {
        this._physicsPlugin.setDensity(this, density);
    }

    /**
     * Returns the density of the physics shape.
     * @returns The density of the physics shape.
     */
    public get density(): number {
        return this._physicsPlugin.getDensity(this);
    }

    /**
     * Utility to add a child shape to this container,
     * automatically computing the relative transform between
     * the container shape and the child instance.
     *
     * @param parentTransform The transform node associated with this shape
     * @param newChild The new PhysicsShape to add
     * @param childTransform The transform node associated with the child shape
     */
    public addChildFromParent(parentTransform: TransformNode, newChild: PhysicsShape, childTransform: TransformNode): void {
        const childToWorld = childTransform.computeWorldMatrix(true);
        const parentToWorld = parentTransform.computeWorldMatrix(true);
        const childToParent = TmpVectors.Matrix[0];
        childToWorld.multiplyToRef(Matrix.Invert(parentToWorld), childToParent);
        const translation = TmpVectors.Vector3[0];
        const rotation = TmpVectors.Quaternion[0];
        const scale = TmpVectors.Vector3[1];
        childToParent.decompose(scale, rotation, translation);
        this._physicsPlugin.addChild(this, newChild, translation, rotation, scale);
    }

    /**
     * Adds a child shape to a container with an optional transform
     * @param newChild The new PhysicsShape to add
     * @param translation Optional position of the child shape relative to this shape
     * @param rotation Optional rotation of the child shape relative to this shape
     * @param scale Optional scale of the child shape relative to this shape
     */
    public addChild(newChild: PhysicsShape, translation?: Vector3, rotation?: Quaternion, scale?: Vector3): void {
        this._physicsPlugin.addChild(this, newChild, translation, rotation, scale);
    }

    /**
     * Removes a child shape from this shape.
     * @param childIndex The index of the child shape to remove
     */
    public removeChild(childIndex: number): void {
        this._physicsPlugin.removeChild(this, childIndex);
    }

    /**
     * Returns the number of children of a physics shape.
     * @returns The number of children of a physics shape.
     */
    public getNumChildren(): number {
        return this._physicsPlugin.getNumChildren(this);
    }

    /**
     * Returns the bounding box of the physics shape.
     * @returns The bounding box of the physics shape.
     */
    public getBoundingBox(): BoundingBox {
        return this._physicsPlugin.getBoundingBox(this);
    }

    public set isTrigger(isTrigger: boolean) {
        if (this._isTrigger === isTrigger) {
            return;
        }
        this._isTrigger = isTrigger;
        this._physicsPlugin.setTrigger(this, isTrigger);
    }

    public get isTrigger(): boolean {
        return this._isTrigger;
    }

    /**
     * Dispose the shape and release its associated resources.
     */
    public dispose() {
        if (this._isDisposed) {
            return;
        }
        this._physicsPlugin.disposeShape(this);
        this._isDisposed = true;
    }
}

/**
 * Helper object to create a sphere shape
 */
export class PhysicsShapeSphere extends PhysicsShape {
    /**
     * Constructor for the Sphere Shape
     * @param center local center of the sphere
     * @param radius radius
     * @param scene scene to attach to
     */
    constructor(center: Vector3, radius: number, scene: Scene) {
        super({ type: PhysicsShapeType.SPHERE, parameters: { center: center, radius: radius } }, scene);
    }

    /**
     * Derive an approximate sphere from the mesh.
     * @param mesh node from which to derive the sphere shape
     * @returns PhysicsShapeSphere
     */
    static FromMesh(mesh: AbstractMesh) {
        const bounds = mesh.getBoundingInfo();
        const centerLocal = bounds.boundingSphere.center;
        const he = bounds.boundingBox.extendSize;
        const radius = Math.max(he.x, he.y, he.z);
        return new PhysicsShapeSphere(centerLocal, radius, mesh.getScene());
    }
}

/**
 * Helper object to create a capsule shape
 */
export class PhysicsShapeCapsule extends PhysicsShape {
    /**
     *
     * @param pointA Starting point that defines the capsule segment
     * @param pointB ending point of that same segment
     * @param radius radius
     * @param scene scene to attach to
     */
    constructor(pointA: Vector3, pointB: Vector3, radius: number, scene: Scene) {
        super({ type: PhysicsShapeType.CAPSULE, parameters: { pointA: pointA, pointB: pointB, radius: radius } }, scene);
    }

    /**
     * Derive an approximate capsule from the mesh. Note, this is
     * not the optimal bounding capsule.
     * @param mesh Node from which to derive a cylinder shape
     * @returns Physics Shape Capsule
     */
    static FromMesh(mesh: AbstractMesh): PhysicsShapeCapsule {
        const boundsLocal = mesh.getBoundingInfo();
        const radius = boundsLocal.boundingBox.extendSize.x;
        const pointFromCenter = new Vector3(0, boundsLocal.boundingBox.extendSize.y - radius, 0);
        const pointA = boundsLocal.boundingBox.center.add(pointFromCenter);
        const pointB = boundsLocal.boundingBox.center.subtract(pointFromCenter);
        return new PhysicsShapeCapsule(pointA, pointB, radius, mesh.getScene());
    }
}

/**
 * Helper object to create a cylinder shape
 */
export class PhysicsShapeCylinder extends PhysicsShape {
    /**
     *
     * @param pointA Starting point that defines the cylinder segment
     * @param pointB ending point of that same segment
     * @param radius radius
     * @param scene scene to attach to
     */
    constructor(pointA: Vector3, pointB: Vector3, radius: number, scene: Scene) {
        super({ type: PhysicsShapeType.CYLINDER, parameters: { pointA: pointA, pointB: pointB, radius: radius } }, scene);
    }

    /**
     * Derive an approximate cylinder from the mesh. Note, this is
     * not the optimal bounding cylinder.
     * @param mesh Node from which to derive a cylinder shape
     * @returns Physics Shape Cylinder
     */
    static FromMesh(mesh: AbstractMesh): PhysicsShapeCylinder {
        const boundsLocal = mesh.getBoundingInfo();
        const radius = boundsLocal.boundingBox.extendSize.x;
        const pointFromCenter = new Vector3(0, boundsLocal.boundingBox.extendSize.y, 0);
        const pointA = boundsLocal.boundingBox.center.add(pointFromCenter);
        const pointB = boundsLocal.boundingBox.center.subtract(pointFromCenter);
        return new PhysicsShapeCylinder(pointA, pointB, radius, mesh.getScene());
    }
}

/**
 * Helper object to create a box shape
 */
export class PhysicsShapeBox extends PhysicsShape {
    /**
     *
     * @param center local center of the box
     * @param rotation local orientation
     * @param extents size of the box in each direction
     * @param scene scene to attach to
     */
    constructor(center: Vector3, rotation: Quaternion, extents: Vector3, scene: Scene) {
        super({ type: PhysicsShapeType.BOX, parameters: { center: center, rotation: rotation, extents: extents } }, scene);
    }

    /**
     *
     * @param mesh
     * @returns PhysicsShapeBox
     */
    static FromMesh(mesh: AbstractMesh): PhysicsShapeBox {
        const bounds = mesh.getBoundingInfo();
        const centerLocal = bounds.boundingBox.center;
        const extents = bounds.boundingBox.extendSize.scale(2.0); //<todo.eoin extendSize seems to really be half-extents?
        return new PhysicsShapeBox(centerLocal, Quaternion.Identity(), extents, mesh.getScene());
    }
}

/**
 * Helper object to create a convex hull shape
 */
export class PhysicsShapeConvexHull extends PhysicsShape {
    /**
     *
     * @param mesh the mesh to be used as topology infos for the convex hull
     * @param scene scene to attach to
     */
    constructor(mesh: Mesh, scene: Scene) {
        super({ type: PhysicsShapeType.CONVEX_HULL, parameters: { mesh: mesh } }, scene);
    }
}

/**
 * Helper object to create a mesh shape
 */
export class PhysicsShapeMesh extends PhysicsShape {
    /**
     *
     * @param mesh the mesh topology that will be used to create the shape
     * @param scene scene to attach to
     */
    constructor(mesh: Mesh, scene: Scene) {
        super({ type: PhysicsShapeType.MESH, parameters: { mesh: mesh } }, scene);
    }
}

/**
 * A shape container holds a variable number of shapes. Use AddChild to append to newly created parent container.
 */
export class PhysicsShapeContainer extends PhysicsShape {
    /**
     * Constructor of the Shape container
     * @param scene scene to attach to
     */
    constructor(scene: Scene) {
        super({ type: PhysicsShapeType.CONTAINER, parameters: {} }, scene);
    }
}
