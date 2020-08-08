import { Nullable } from "../types";
import { Ray } from "../Culling/ray";
import { Vector3 } from "../Maths/math.vector";
import { Color3 } from '../Maths/math.color';
import { Scene } from "../scene";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { Mesh } from "../Meshes/mesh";
import { LinesMesh } from "../Meshes/linesMesh";

import "../Meshes/Builders/linesBuilder";
import { Observer } from '../Misc/observable';

/**
 * As raycast might be hard to debug, the RayHelper can help rendering the different rays
 * in order to better appreciate the issue one might have.
 * @see https://doc.babylonjs.com/babylon101/raycasts#debugging
 */
export class RayHelper {

    /**
     * Defines the ray we are currently tryin to visualize.
     */
    public ray: Nullable<Ray>;

    private _renderPoints: Vector3[];
    private _renderLine: Nullable<LinesMesh>;
    private _renderFunction: Nullable<() => void>;
    private _scene: Nullable<Scene>;

    private _updateToMeshFunction: Nullable<() => void>;
    private _onAfterStepObserver: Nullable<Observer<Scene>>;
    private _attachedToMesh: Nullable<AbstractMesh>;
    private _meshSpaceDirection: Vector3;
    private _meshSpaceOrigin: Vector3;

    /**
     * Helper function to create a colored helper in a scene in one line.
     * @param ray Defines the ray we are currently tryin to visualize
     * @param scene Defines the scene the ray is used in
     * @param color Defines the color we want to see the ray in
     * @returns The newly created ray helper.
     */
    public static CreateAndShow(ray: Ray, scene: Scene, color: Color3): RayHelper {
        var helper = new RayHelper(ray);

        helper.show(scene, color);

        return helper;
    }

    /**
     * Instantiate a new ray helper.
     * As raycast might be hard to debug, the RayHelper can help rendering the different rays
     * in order to better appreciate the issue one might have.
     * @see https://doc.babylonjs.com/babylon101/raycasts#debugging
     * @param ray Defines the ray we are currently tryin to visualize
     */
    constructor(ray: Ray) {
        this.ray = ray;
    }

    /**
     * Shows the ray we are willing to debug.
     * @param scene Defines the scene the ray needs to be rendered in
     * @param color Defines the color the ray needs to be rendered in
     */
    public show(scene: Scene, color?: Color3): void {

        if (!this._renderFunction && this.ray) {

            var ray = this.ray;

            this._renderFunction = this._render.bind(this);
            this._scene = scene;
            this._renderPoints = [ray.origin, ray.origin.add(ray.direction.scale(ray.length))];
            this._renderLine = Mesh.CreateLines("ray", this._renderPoints, scene, true);
            this._renderLine.isPickable = false;

            if (this._renderFunction) {
                this._scene.registerBeforeRender(this._renderFunction);
            }
        }

        if (color && this._renderLine) {
            this._renderLine.color.copyFrom(color);
        }

    }

    /**
     * Hides the ray we are debugging.
     */
    public hide(): void {

        if (this._renderFunction && this._scene) {
            this._scene.unregisterBeforeRender(this._renderFunction);
            this._scene.onAfterStepObservable.remove(this._onAfterStepObserver);
            this._scene = null;
            this._renderFunction = null;
            if (this._renderLine) {
                this._renderLine.dispose();
                this._renderLine = null;
            }

            this._renderPoints = [];
        }

    }

    private _render(): void {

        var ray = this.ray;

        if (!ray) {
            return;
        }

        var point = this._renderPoints[1];
        var len = Math.min(ray.length, 1000000);

        point.copyFrom(ray.direction);
        point.scaleInPlace(len);
        point.addInPlace(ray.origin);

        Mesh.CreateLines("ray", this._renderPoints, this._scene, true, this._renderLine);

    }

    /**
     * Attach a ray helper to a mesh so that we can easily see its orientation for instance or information like its normals.
     * @param mesh Defines the mesh we want the helper attached to
     * @param meshSpaceDirection Defines the direction of the Ray in mesh space (local space of the mesh node)
     * @param meshSpaceOrigin Defines the origin of the Ray in mesh space (local space of the mesh node)
     * @param length Defines the length of the ray
     */
    public attachToMesh(mesh: AbstractMesh, meshSpaceDirection?: Vector3, meshSpaceOrigin?: Vector3, length?: number): void {

        this._attachedToMesh = mesh;

        var ray = this.ray;

        if (!ray) {
            return;
        }

        if (!ray.direction) {
            ray.direction = Vector3.Zero();
        }

        if (!ray.origin) {
            ray.origin = Vector3.Zero();
        }

        if (length) {
            ray.length = length;
        }

        if (!meshSpaceOrigin) {
            meshSpaceOrigin = Vector3.Zero();
        }

        if (!meshSpaceDirection) {
            // -1 so that this will work with Mesh.lookAt
            meshSpaceDirection = new Vector3(0, 0, -1);
        }

        if (!this._scene) {
            this._scene = mesh.getScene();
        }

        if (!this._meshSpaceDirection) {
            this._meshSpaceDirection = meshSpaceDirection.clone();
            this._meshSpaceOrigin = meshSpaceOrigin.clone();
        } else {
            this._meshSpaceDirection.copyFrom(meshSpaceDirection);
            this._meshSpaceOrigin.copyFrom(meshSpaceOrigin);
        }

        if (!this._updateToMeshFunction) {
            this._updateToMeshFunction = (<() => void>this._updateToMesh.bind(this));
            this._scene.registerBeforeRender(this._updateToMeshFunction);
            this._onAfterStepObserver = this._scene.onAfterStepObservable.add(this._updateToMeshFunction);
        }

        // force world matrix computation before the first ray helper computation
        this._attachedToMesh.computeWorldMatrix(true);

        this._updateToMesh();
    }

    /**
     * Detach the ray helper from the mesh it has previously been attached to.
     */
    public detachFromMesh(): void {
        if (this._attachedToMesh && this._scene) {
            if (this._updateToMeshFunction) {
                this._scene.unregisterBeforeRender(this._updateToMeshFunction);
                this._scene.onAfterStepObservable.remove(this._onAfterStepObserver);
            }
            this._attachedToMesh = null;
            this._updateToMeshFunction = null;
            this._scene = null;
        }
    }

    private _updateToMesh(): void {
        var ray = this.ray;

        if (!this._attachedToMesh || !ray) {
            return;
        }

        if (this._attachedToMesh._isDisposed) {
            this.detachFromMesh();
            return;
        }

        this._attachedToMesh.getDirectionToRef(this._meshSpaceDirection, ray.direction);
        Vector3.TransformCoordinatesToRef(this._meshSpaceOrigin, this._attachedToMesh.getWorldMatrix(), ray.origin);
    }

    /**
     * Dispose the helper and release its associated resources.
     */
    public dispose(): void {
        this.hide();
        this.detachFromMesh();
        this.ray = null;
    }
}
