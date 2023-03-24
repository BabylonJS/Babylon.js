import type { TransformNode } from "../../Meshes/transformNode";
import type { AbstractMesh } from "../../Meshes/abstractMesh";
import type { BoundingBox } from "../../Culling/boundingBox";
import { ShapeType } from "./IPhysicsEnginePlugin";
import type { IPhysicsEnginePluginV2, PhysicsShapeParameters } from "./IPhysicsEnginePlugin";
import type { PhysicsMaterial } from "./physicsMaterial";
import { Vector3, Quaternion } from "../../Maths/math.vector";

import type { Mesh } from "../../Meshes/mesh";
import type { Scene } from "../../scene";

/**
 * Options for creating a physics shape
 */
export interface PhysicShapeOptions {
    /**
     * The type of the shape. This can be one of the following: SPHERE, BOX, CAPSULE, CYLINDER, CONVEX_HULL, MESH, HEIGHTFIELD, CONTAINER
     */
    type?: ShapeType;
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

    private _type: ShapeType;

    private _material: PhysicsMaterial;

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
     *
     */
    public get type(): ShapeType {
        return this._type;
    }

    /**
     *
     * @param layer
     */
    public set filterLayer(layer: number) {
        this._physicsPlugin.setFilterLayer(this, layer);
    }

    /**
     *
     * @returns
     */
    public get filterLayer(): number {
        return this._physicsPlugin.getFilterLayer(this);
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
     *
     * @returns
     */
    public get material(): PhysicsMaterial {
        return this._material;
    }

    /**
     *
     * @param density
     */
    public set density(density: number) {
        this._physicsPlugin.setDensity(this, density);
    }

    /**
     *
     */
    public get density(): number {
        return this._physicsPlugin.getDensity(this);
    }

    /**
     *
     * @param newChild
     * @param childTransform
     */
    public addChild(newChild: PhysicsShape, childTransform: TransformNode): void {
        this._physicsPlugin.addChild(this, newChild, childTransform);
    }

    /**
     *
     * @param childIndex
     */
    public removeChild(childIndex: number): void {
        this._physicsPlugin.removeChild(this, childIndex);
    }

    /**
     *
     * @returns
     */
    public getNumChildren(): number {
        return this._physicsPlugin.getNumChildren(this);
    }

    /**
     *
     */
    public getBoundingBox(): BoundingBox {
        return this._physicsPlugin.getBoundingBox(this);
    }

    /**
     *
     */
    public dispose() {
        this._physicsPlugin.disposeShape(this);
    }
}

/**
 * Helper object to create a sphere shape
 */
export class PhysicsShapeSphere extends PhysicsShape {
    /** @internal */
    /**
     * Constructor for the Sphere Shape
     * @param center local center of the sphere
     * @param radius radius
     * @param scene scene to attach to
     */
    constructor(center: Vector3, radius: number, scene: Scene) {
        super({ type: ShapeType.SPHERE, parameters: { center: center, radius: radius } }, scene);
    }

    /**
     *
     * @param mesh
     * @returns PhysicsShapeSphere
     */
    static FromMesh(mesh: AbstractMesh) {
        const bounds = mesh.getBoundingInfo();
        //<todo.eoin We don't use bounding sphere because the results seem to be wrong
        const centerLocal = bounds.boundingBox.center;
        const radius = bounds.boundingBox.extendSize.x;
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
        super({ type: ShapeType.CAPSULE, parameters: { pointA: pointA, pointB: pointB, radius: radius } }, scene);
    }

    /**
     * Derive an approximate capsule from the transform node. Note, this is
     * not the optimal bounding capsule.
     * @param TransformNode node Node from which to derive a cylinder shape
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
        super({ type: ShapeType.CYLINDER, parameters: { pointA: pointA, pointB: pointB, radius: radius } }, scene);
    }

    /**
     * Derive an approximate cylinder from the transform node. Note, this is
     * not the optimal bounding cylinder.
     * @param TransformNode node Node from which to derive a cylinder shape
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
     * @param center local center of the sphere
     * @param rotation local orientation
     * @param extents size of the box in each direction
     * @param scene scene to attach to
     */
    constructor(center: Vector3, rotation: Quaternion, extents: Vector3, scene: Scene) {
        super({ type: ShapeType.BOX, parameters: { center: center, rotation: rotation, extents: extents } }, scene);
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
        super({ type: ShapeType.CONVEX_HULL, parameters: { mesh: mesh } }, scene);
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
        super({ type: ShapeType.MESH, parameters: { mesh: mesh } }, scene);
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
        super({ type: ShapeType.CONTAINER, parameters: {} }, scene);
    }
}
