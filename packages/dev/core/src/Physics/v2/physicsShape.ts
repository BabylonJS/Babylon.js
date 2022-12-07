import type { TransformNode } from "../../Meshes/transformNode";
import type { BoundingBox } from "../../Culling/boundingBox";
import { ShapeType } from "./IPhysicsEnginePlugin";
import type { IPhysicsEnginePlugin, PhysicsShapeParameters } from "./IPhysicsEnginePlugin";
import type { PhysicsMaterial } from "./physicsMaterial";
import type { Vector3 } from "../../Maths/math.vector";
import type { Quaternion } from "../../Maths/math.vector";
import type { AbstractMesh } from "../../Meshes/abstractMesh";
import type { Scene } from "../../scene";

/**
 *
 */
/** @internal */
export class PhysicsShape {
    /** @internal */
    public _pluginData: any = undefined;

    private _physicsPlugin: IPhysicsEnginePlugin;

    private _type: ShapeType;

    /**
     *
     * @param type
     * @param options
     * @param scene
     * @returns
     */
    constructor(type: number, options: PhysicsShapeParameters = {}, scene: Scene) {
        this._type = type;
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

        this._physicsPlugin = physicsPlugin as IPhysicsEnginePlugin;
        this._physicsPlugin.initShape(this, type, options);
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
    public setFilterLayer(layer: number): void {
        this._physicsPlugin.setFilterLayer(this, layer);
    }

    /**
     *
     * @returns
     */
    public getFilterLayer(): number {
        return this._physicsPlugin.getFilterLayer(this);
    }

    /**
     *
     * @param materialId
     */
    public setMaterial(materialId: PhysicsMaterial): void {
        this._physicsPlugin.setMaterial(this, materialId);
    }

    /**
     *
     * @returns
     */
    public getMaterial(): PhysicsMaterial | undefined {
        return this._physicsPlugin.getMaterial(this);
    }

    /**
     *
     * @param density
     */
    public setDensity(density: number): void {
        this._physicsPlugin.setDensity(this, density);
    }

    /**
     *
     */
    public getDensity(): number {
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
 *
 */
/** @internal */
export class PhysicsShapeSphere extends PhysicsShape {
    /** @internal */
    /**
     *
     * @param center
     * @param radius
     * @param scene
     */
    constructor(center: Vector3, radius: number, scene: Scene) {
        super(ShapeType.BOX, { center: center, radius: radius }, scene);
    }
}

/***
 *
 */
/** @internal */
export class PhysicsShapeCapsule extends PhysicsShape {
    /** @internal */
    /**
     *
     * @param pointA
     * @param pointB
     * @param radius
     * @param scene
     */
    constructor(pointA: Vector3, pointB: Vector3, radius: number, scene: Scene) {
        super(ShapeType.CAPSULE, { pointA: pointA, pointB: pointB, radius: radius }, scene);
    }
}

/**
 *
 */
/** @internal */
export class PhysicsShapeCylinder extends PhysicsShape {
    /** @internal */
    /**
     *
     * @param pointA
     * @param pointB
     * @param radius
     * @param scene
     */
    constructor(pointA: Vector3, pointB: Vector3, radius: number, scene: Scene) {
        super(ShapeType.CYLINDER, { pointA: pointA, pointB: pointB, radius: radius }, scene);
    }
}

/**
 *
 */
/** @internal */
export class PhysicsShapeShapeBox extends PhysicsShape {
    /** @internal */
    /**
     *
     * @param center
     * @param rotation
     * @param extents
     * @param scene
     */
    constructor(center: Vector3, rotation: Quaternion, extents: Vector3, scene: Scene) {
        super(ShapeType.BOX, { center: center, rotation: rotation, extents: extents }, scene);
    }
}

/**
 *
 */
/** @internal */
export class PhysicsShapeShapeConvexHull extends PhysicsShape {
    /** @internal */
    /**
     *
     * @param mesh
     * @param scene
     */
    constructor(mesh: AbstractMesh, scene: Scene) {
        super(ShapeType.CONVEX_HULL, { mesh: mesh }, scene);
    }
}

/**
 *
 */
/** @internal */
export class PhysicsShapeShapeMesh extends PhysicsShape {
    /** @internal */
    /**
     *
     * @param mesh
     * @param scene
     */
    constructor(mesh: AbstractMesh, scene: Scene) {
        super(ShapeType.MESH, { mesh: mesh }, scene);
    }
}

/**
 *
 */
/** @internal */
export class PhysicsShapeShapeContainer extends PhysicsShape {
    /** @internal */
    /**
     *
     * @param mesh
     * @param scene
     */
    constructor(mesh: AbstractMesh, scene: Scene) {
        super(ShapeType.CONTAINER, {}, scene);
    }
}
