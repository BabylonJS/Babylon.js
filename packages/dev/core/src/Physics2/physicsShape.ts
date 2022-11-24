import type { TransformNode } from "../Meshes/transformNode";
import type { BoundingBox } from "../Culling/boundingBox";
import { IPhysicsEnginePlugin, ShapeType, PhysicsShapeParameters } from "./IPhysicsEngine";
import type { PhysicsMaterial } from "./physicsMaterial";
import { Quaternion, Vector3 } from "../Maths/math.vector";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { Nullable, Scene } from "..";


/**
 *
 */
export class PhysicsShape {
    /** @internal */
    public _pluginData: any = {};

    protected _physicsPlugin: Nullable<IPhysicsEnginePlugin>;

    private _type: ShapeType;

    constructor(type: number,
        options: PhysicsShapeParameters = { },
        scene: Scene) {
            this._type = type;
            if (!scene) {
                return;
            }
            const physicsEngine = scene.getPhysicsEngine();
            this._physicsPlugin = physicsEngine?.getPhysicsPlugin();
            this._physicsPlugin?.createShape(type, options);

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
    public getMaterial(): PhysicsMaterial {
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

export class PhysicsShapeSphere extends PhysicsShape {
    constructor(center: Vector3, radius: number) {
        super(ShapeType.BOX, {center:center, radius:radius});
    }
}

export class PhysicsShapeCapsule extends PhysicsShape {
    constructor(pointA: Vector3, pointB: Vector3, radius: number) {
        super(ShapeType.CAPSULE, {pointA:pointA, pointB:pointB, radius:radius});
    }
}

export class PhysicsShapeCylinder extends PhysicsShape {
    constructor(pointA: Vector3, pointB: Vector3, radius: number) {
        super(ShapeType.CYLINDER, {pointA:pointA, pointB:pointB, radius:radius});
    }
}

export class PhysicsShapeShapeBox extends PhysicsShape {
    constructor(center: Vector3, rotation: Quaternion, extents: Vector3) {
        super(ShapeType.BOX, {center:center, rotation:rotation, extents:extents});
    }
}

export class PhysicsShapeShapeConvexHull extends PhysicsShape {
    constructor(mesh: AbstractMesh) {
        super(ShapeType.CONVEX_HULL, {mesh:mesh});
    }
}

export class PhysicsShapeShapeMesh extends PhysicsShape {
    constructor(mesh: AbstractMesh) {
        super(ShapeType.MESH, {mesh:mesh});
    }
}

export class PhysicsShapeShapeContainer extends PhysicsShape {
    constructor(mesh: AbstractMesh) {
        super(ShapeType.CONTAINER, {});
    }
}
