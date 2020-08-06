import { Nullable } from "../types";
import { Vector3 } from "../Maths/math.vector";
import { Color3 } from '../Maths/math.color';
import { Mesh } from "../Meshes/mesh";
import { Gizmo } from "./gizmo";
import { UtilityLayerRenderer } from "../Rendering/utilityLayerRenderer";
import { StandardMaterial } from '../Materials/standardMaterial';
import { Scene } from '../scene';
import { Camera } from '../Cameras/camera';
import { BoxBuilder } from "../Meshes/Builders/boxBuilder";
import { CylinderBuilder } from '../Meshes/Builders/cylinderBuilder';
import { Matrix } from '../Maths/math';
import { LinesBuilder } from "../Meshes/Builders/linesBuilder";

/**
 * Gizmo that enables viewing a camera
 */
export class CameraGizmo extends Gizmo {
    private _cameraMesh: Mesh;
    private _cameraLinesMesh: Mesh;
    private _material: StandardMaterial;

    /**
     * Creates a CameraGizmo
     * @param gizmoLayer The utility layer the gizmo will be added to
     */
    constructor(gizmoLayer?: UtilityLayerRenderer) {
        super(gizmoLayer);

        this._material = new StandardMaterial("cameraGizmoMaterial", this.gizmoLayer.utilityLayerScene);
        this._material.diffuseColor = new Color3(0.5, 0.5, 0.5);
        this._material.specularColor = new Color3(0.1, 0.1, 0.1);
    }
    private _camera: Nullable<Camera> = null;

    public get displayFrustum() {
        return this._cameraLinesMesh.isEnabled();
    }
    public set displayFrustum(value) {
        this._cameraLinesMesh.setEnabled(value);
    }

    /**
     * The camera that the gizmo is attached to
     */
    public set camera(camera: Nullable<Camera>) {
        this._camera = camera;
        this.attachedNode = camera;
        if (camera) {
            // Create the mesh for the given camera
            if (this._cameraMesh) {
                this._cameraMesh.dispose();
            }
            if (this._cameraLinesMesh) {
                this._cameraLinesMesh.dispose();
            }
            this._cameraMesh = CameraGizmo._CreateCameraMesh(this.gizmoLayer.utilityLayerScene);
            this._cameraLinesMesh = CameraGizmo._CreateCameraFrustum(this.gizmoLayer.utilityLayerScene);

            this._cameraMesh.getChildMeshes(false).forEach((m) => {
                m.material = this._material;
            });
            this._cameraMesh.parent = this._rootMesh;

            this._cameraLinesMesh.parent = this._rootMesh;

            if (!this.attachedNode!.reservedDataStore) {
                this.attachedNode!.reservedDataStore = {};
            }
            this.attachedNode!.reservedDataStore.cameraGizmo = this;

            // Add lighting to the camera gizmo
            var gizmoLight = this.gizmoLayer._getSharedGizmoLight();
            gizmoLight.includedOnlyMeshes = gizmoLight.includedOnlyMeshes.concat(this._cameraMesh.getChildMeshes(false));

            this._update();
        }
    }

    public get camera() {
        return this._camera;
    }

    /**
     * Gets the material used to render the camera gizmo
     */
    public get material() {
        return this._material;
    }
    /**
     * @hidden
     * Updates the gizmo to match the attached mesh's position/rotation
     */

    protected _update() {
        super._update();
        if (!this._camera) {
            return;
        }

        // frustum matrix
        this._camera.getProjectionMatrix().invertToRef(this._invProjection);
        this._cameraLinesMesh.setPivotMatrix(this._invProjection, false);

        this._cameraLinesMesh.scaling.x = 1 / this._rootMesh.scaling.x;
        this._cameraLinesMesh.scaling.y = 1 / this._rootMesh.scaling.y;
        this._cameraLinesMesh.scaling.z = 1 / this._rootMesh.scaling.z;
    }

    // Static helper methods
    private static _Scale = 0.05;
    private _invProjection = new Matrix();
    /**
     * Disposes of the camera gizmo
     */
    public dispose() {
        this._material.dispose();
        super.dispose();
    }

    private static _CreateCameraMesh(scene: Scene) {
        var root = new Mesh("rootCameraGizmo", scene);

        var mesh = new Mesh(root.name, scene);
        mesh.parent = root;

        var box = BoxBuilder.CreateBox(root.name, {width: 1.0, height: 0.8, depth: 0.5 }, scene);
        box.parent = mesh;

        var cyl1 = CylinderBuilder.CreateCylinder(root.name, {height: 0.5, diameterTop: 0.8, diameterBottom: 0.8}, scene);
        cyl1.parent = mesh;
        cyl1.position.y = 0.3;
        cyl1.position.x = -0.6;
        cyl1.rotation.x = Math.PI * 0.5;

        var cyl2 = CylinderBuilder.CreateCylinder(root.name, {height: 0.5, diameterTop: 0.6, diameterBottom: 0.6}, scene);
        cyl2.parent = mesh;
        cyl2.position.y = 0.5;
        cyl2.position.x = 0.4;
        cyl2.rotation.x = Math.PI * 0.5;

        var cyl3 = CylinderBuilder.CreateCylinder(root.name, {height: 0.5, diameterTop: 0.5, diameterBottom: 0.5}, scene);
        cyl3.parent = mesh;
        cyl3.position.y = 0.0;
        cyl3.position.x = 0.6;
        cyl3.rotation.z = Math.PI * 0.5;

        root.scaling.scaleInPlace(CameraGizmo._Scale);
        root.rotation.y = -Math.PI * 0.5;
        mesh.position.x = -0.9;

        return root;
    }

    private static _CreateCameraFrustum(scene: Scene) {
        var root = new Mesh("rootCameraGizmo", scene);
        var mesh = new Mesh(root.name, scene);
        mesh.parent = root;

        for (var y = 0; y < 4; y += 2)
        {
            for (var x = 0; x < 4; x += 2)
            {
                var line = LinesBuilder.CreateLines("lines", { points: [new Vector3(-1 + x, -1 + y, -1), new Vector3(-1 + x, -1 + y, 1)] }, scene);
                line.parent = mesh;
                var line = LinesBuilder.CreateLines("lines", { points: [new Vector3(-1, -1 + x, -1 + y), new Vector3(1, -1 + x, -1 + y)] }, scene);
                line.parent = mesh;
                var line = LinesBuilder.CreateLines("lines", { points: [new Vector3(-1 + x, -1, -1 + y), new Vector3(-1 + x,  1, -1 + y)] }, scene);
                line.parent = mesh;
            }
        }

        return root;
    }
}