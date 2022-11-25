import type { TransformNode } from "../../Meshes/transformNode";
import { BoundingBox } from "../../Culling/boundingBox";
import { ShapeType } from "./IPhysicsEngineV2";
import type { IPhysicsEnginePluginV2, PhysicsShapeParameters } from "./IPhysicsEngineV2";
import type { PhysicsMaterial } from "./physicsMaterial";
import { Vector3 } from "../../Maths/math.vector";
import type { Quaternion } from "../../Maths/math.vector";
import type { AbstractMesh } from "../../Meshes/abstractMesh";
import type { Scene } from "../../scene";

/**
 *
 */
export class PhysicsShape {
    /** @internal */
    public _pluginData: any = undefined;

    private _physicsPlugin: IPhysicsEnginePluginV2;

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

        this._physicsPlugin = scene.getPhysicsEngine()?.getPhysicsPlugin() as any;
        if (!this._physicsPlugin) {
            return;
        }
        this._physicsPlugin?.initShape(this, type, options);
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
        this._physicsPlugin?.setFilterLayer(this, layer);
    }

    /**
     *
     * @returns
     */
    public getFilterLayer(): number {
        return this._physicsPlugin ? this._physicsPlugin.getFilterLayer(this) : 0;
    }

    /**
     *
     * @param materialId
     */
    public setMaterial(materialId: PhysicsMaterial): void {
        this._physicsPlugin?.setMaterial(this, materialId);
    }

    /**
     *
     * @returns
     */
    public getMaterial(): PhysicsMaterial | undefined {
        return this._physicsPlugin ? this._physicsPlugin.getMaterial(this) : undefined;
    }

    /**
     *
     * @param density
     */
    public setDensity(density: number): void {
        this._physicsPlugin?.setDensity(this, density);
    }

    /**
     *
     */
    public getDensity(): number {
        return this._physicsPlugin ? this._physicsPlugin.getDensity(this) : 0;
    }

    /**
     *
     * @param newChild
     * @param childTransform
     */
    public addChild(newChild: PhysicsShape, childTransform: TransformNode): void {
        this._physicsPlugin?.addChild(this, newChild, childTransform);
    }

    /**
     *
     * @param childIndex
     */
    public removeChild(childIndex: number): void {
        this._physicsPlugin?.removeChild(this, childIndex);
    }

    /**
     *
     * @returns
     */
    public getNumChildren(): number {
        return this._physicsPlugin ? this._physicsPlugin.getNumChildren(this) : 0;
    }

    /**
     *
     */
    public getBoundingBox(): BoundingBox {
        return this._physicsPlugin ? this._physicsPlugin.getBoundingBox(this) : new BoundingBox(Vector3.Zero(), Vector3.Zero());
    }

    /**
     *
     */
    public dispose() {
        this._physicsPlugin?.disposeShape(this);
    }
}

/**
 *
 */
export class PhysicsShapeSphere extends PhysicsShape {
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
export class PhysicsShapeCapsule extends PhysicsShape {
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
export class PhysicsShapeCylinder extends PhysicsShape {
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
export class PhysicsShapeShapeBox extends PhysicsShape {
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
export class PhysicsShapeShapeConvexHull extends PhysicsShape {
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
export class PhysicsShapeShapeMesh extends PhysicsShape {
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
export class PhysicsShapeShapeContainer extends PhysicsShape {
    /**
     *
     * @param mesh
     * @param scene
     */
    constructor(mesh: AbstractMesh, scene: Scene) {
        super(ShapeType.CONTAINER, {}, scene);
    }
}
