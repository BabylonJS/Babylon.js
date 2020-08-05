import { Nullable } from "../types";
import { Vector3 } from "../Maths/math.vector";
import { Color3 } from '../Maths/math.color';
import { AbstractMesh } from "../Meshes/abstractMesh";
import { Mesh } from "../Meshes/mesh";
import { Gizmo } from "./gizmo";
import { UtilityLayerRenderer } from "../Rendering/utilityLayerRenderer";
import { StandardMaterial } from '../Materials/standardMaterial';
import { Scene } from '../scene';
import { TransformNode } from '../Meshes/transformNode';
import { Camera } from '../Cameras';
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
    private _attachedMeshParent: TransformNode;

    /**
     * Creates a CameraGizmo
     * @param gizmoLayer The utility layer the gizmo will be added to
     */
    constructor(gizmoLayer?: UtilityLayerRenderer) {
        super(gizmoLayer);
        this.attachedMesh = new AbstractMesh("", this.gizmoLayer.utilityLayerScene);
        this._attachedMeshParent = new TransformNode("parent", this.gizmoLayer.utilityLayerScene);

        this.attachedMesh.parent = this._attachedMeshParent;
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
        if (camera) {
            // Create the mesh for the given camera
            if (this._cameraMesh) {
                this._cameraMesh.dispose();
            }
            if (this._cameraLinesMesh) {
                this._cameraLinesMesh.dispose();
            }
            this._cameraMesh = CameraGizmo._CreateCameraMesh(this.gizmoLayer.utilityLayerScene);
            var invProjection = new Matrix;
            camera.getProjectionMatrix().invertToRef(invProjection);
            this._cameraLinesMesh = CameraGizmo._CreateCameraLines(this.gizmoLayer.utilityLayerScene, invProjection);

            this._cameraMesh.getChildMeshes(false).forEach((m) => {
                m.material = this._material;
            });
            this._cameraMesh.parent = this._rootMesh;

            this._cameraLinesMesh.parent = this._rootMesh;

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

        if (this._camera.parent) {
            this._attachedMeshParent.freezeWorldMatrix(this._camera.parent.getWorldMatrix());
        }

        this._cameraLinesMesh.scaling.x = 1/this._rootMesh.scaling.x;
        this._cameraLinesMesh.scaling.y = 1/this._rootMesh.scaling.y;
        this._cameraLinesMesh.scaling.z = 1/this._rootMesh.scaling.z;
    }

    // Static helper methods
    private static _Scale = 0.007;

    /**
     * Disposes of the camera gizmo
     */
    public dispose() {
        this._material.dispose();
        super.dispose();
        this._attachedMeshParent.dispose();
    }

    private static _CreateCameraMesh(scene: Scene) {
        var root = new Mesh("rootCameraGizmo", scene);

        var mesh = new Mesh(root.name, scene);
        mesh.parent = root;

        var box = BoxBuilder.CreateBox(root.name, {width: 1.0, height: 0.8, depth: 0.5 }, scene);
        box.parent = mesh;

        var cyl1 = CylinderBuilder.CreateCylinder(root.name, {height: 0.5, diameterTop:0.8, diameterBottom:0.8}, scene);
        cyl1.parent = mesh;
        cyl1.position.y = 0.3;
        cyl1.position.x = -0.6;
        cyl1.rotation.x = Math.PI * 0.5;

        var cyl2 = CylinderBuilder.CreateCylinder(root.name, {height: 0.5, diameterTop:0.6, diameterBottom:0.6}, scene);
        cyl2.parent = mesh;
        cyl2.position.y = 0.5;
        cyl2.position.x = 0.4;
        cyl2.rotation.x = Math.PI * 0.5;

        var cyl3 = CylinderBuilder.CreateCylinder(root.name, {height: 0.5, diameterTop:0.5, diameterBottom:0.5}, scene);
        cyl3.parent = mesh;
        cyl3.position.y = 0.0;
        cyl3.position.x = 0.6;
        cyl3.rotation.z = Math.PI * 0.5;

        root.scaling.scaleInPlace(CameraGizmo._Scale);
        root.rotation.y = -Math.PI * 0.5;
        mesh.position.x = -0.9;

        return root;
    }

    private static _CreateCameraLines(scene: Scene, invProjection:Matrix) {
        var root = new Mesh("rootCameraGizmo", scene);
        var mesh = new Mesh(root.name, scene);
        mesh.parent = root;

        var v0Res = new Vector3(0,0,0);
        var v1Res = new Vector3(0,0,0);

        for (var y = 0; y < 4; y += 2)
        {
            for (var x = 0; x < 4; x += 2)
            {
                Vector3.TransformCoordinatesToRef(new Vector3(-1 + x, -1 + y, -1), invProjection, v0Res);
                Vector3.TransformCoordinatesToRef(new Vector3(-1 + x, -1 + y, 1), invProjection, v1Res);
                var line = LinesBuilder.CreateLines("lines", { points: [v0Res, v1Res] }, scene);
                line.parent = mesh;
            }
        }

        for (var y = 0; y < 4; y += 2)
        {
            for (var x = 0; x < 4; x += 2)
            {
                Vector3.TransformCoordinatesToRef(new Vector3(-1, -1 + x, -1 + y), invProjection, v0Res);
                Vector3.TransformCoordinatesToRef(new Vector3( 1, -1 + x, -1 + y), invProjection, v1Res);
                var line = LinesBuilder.CreateLines("lines", { points: [v0Res, v1Res] }, scene);
                line.parent = mesh;
            }
        }

        for (var y = 0; y < 4; y += 2)
        {
            for (var x = 0; x < 4; x += 2)
            {
                Vector3.TransformCoordinatesToRef(new Vector3(-1 + x, -1, -1 + y), invProjection, v0Res);
                Vector3.TransformCoordinatesToRef(new Vector3(-1 + x,  1, -1 + y), invProjection, v1Res);
                var line = LinesBuilder.CreateLines("lines", { points: [v0Res, v1Res] }, scene);
                line.parent = mesh;
            }
        }
        return root;
    }
}