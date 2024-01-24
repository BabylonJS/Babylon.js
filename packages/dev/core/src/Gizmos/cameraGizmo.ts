import type { Nullable } from "../types";
import { Vector3 } from "../Maths/math.vector";
import { Color3, Color4 } from "../Maths/math.color";
import { Mesh } from "../Meshes/mesh";
import type { IGizmo } from "./gizmo";
import { Gizmo } from "./gizmo";
import { UtilityLayerRenderer } from "../Rendering/utilityLayerRenderer";
import { StandardMaterial } from "../Materials/standardMaterial";
import type { Scene } from "../scene";
import type { Camera } from "../Cameras/camera";
import { CreateBox } from "../Meshes/Builders/boxBuilder";
import { CreateCylinder } from "../Meshes/Builders/cylinderBuilder";
import { Matrix } from "../Maths/math";
import { CreateLines } from "../Meshes/Builders/linesBuilder";
import type { PointerInfo } from "../Events/pointerEvents";
import { PointerEventTypes } from "../Events/pointerEvents";
import type { Observer } from "../Misc/observable";
import { Observable } from "../Misc/observable";

/**
 * Interface for camera gizmo
 */
export interface ICameraGizmo extends IGizmo {
    /** Event that fires each time the gizmo is clicked */
    onClickedObservable: Observable<Camera>;
    /** A boolean indicating if frustum lines must be rendered */
    displayFrustum: boolean;
    /** The camera that the gizmo is attached to */
    camera: Nullable<Camera>;
    /** The material used to render the camera gizmo */
    readonly material: StandardMaterial;
}

/**
 * Gizmo that enables viewing a camera
 */
export class CameraGizmo extends Gizmo implements ICameraGizmo {
    protected _cameraMesh: Mesh;
    protected _cameraLinesMesh: Mesh;
    protected _material: StandardMaterial;
    protected _pointerObserver: Nullable<Observer<PointerInfo>> = null;
    private _frustumLinesColor?: Color3;

    /**
     * Event that fires each time the gizmo is clicked
     */
    public onClickedObservable = new Observable<Camera>();

    /**
     * Creates a CameraGizmo
     * @param gizmoLayer The utility layer the gizmo will be added to
     * @param gizmoColor Camera mesh color. Default is Gray
     * @param frustumLinesColor Frustum lines color. Default is White
     */
    constructor(gizmoLayer: UtilityLayerRenderer = UtilityLayerRenderer.DefaultUtilityLayer, gizmoColor?: Color3, frustumLinesColor?: Color3) {
        super(gizmoLayer);

        this._material = new StandardMaterial("cameraGizmoMaterial", this.gizmoLayer.utilityLayerScene);
        this._frustumLinesColor = frustumLinesColor;

        this._material.diffuseColor = gizmoColor ?? new Color3(0.5, 0.5, 0.5);
        this._material.specularColor = new Color3(0.1, 0.1, 0.1);

        this._pointerObserver = gizmoLayer.utilityLayerScene.onPointerObservable.add((pointerInfo) => {
            if (!this._camera) {
                return;
            }

            this._isHovered = !!(pointerInfo.pickInfo && this._rootMesh.getChildMeshes().indexOf(<Mesh>pointerInfo.pickInfo.pickedMesh) != -1);
            if (this._isHovered && pointerInfo.event.button === 0) {
                this.onClickedObservable.notifyObservers(this._camera);
            }
        }, PointerEventTypes.POINTERDOWN);
    }
    protected _camera: Nullable<Camera> = null;

    /** Gets or sets a boolean indicating if frustum lines must be rendered (true by default)) */
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
            if (!this._customMeshSet) {
                if (this._cameraMesh) {
                    this._cameraMesh.dispose();
                }
                this._cameraMesh = CameraGizmo._CreateCameraMesh(this.gizmoLayer.utilityLayerScene);

                this._cameraMesh.getChildMeshes(false).forEach((m) => {
                    m.material = this._material;
                });
                this._cameraMesh.parent = this._rootMesh;
            }

            if (this._cameraLinesMesh) {
                this._cameraLinesMesh.dispose();
            }
            const linesColor = this._frustumLinesColor?.toColor4(1) ?? new Color4(1, 1, 1, 1);
            this._cameraLinesMesh = CameraGizmo._CreateCameraFrustum(this.gizmoLayer.utilityLayerScene, linesColor);
            this._cameraLinesMesh.parent = this._rootMesh;

            if (this.gizmoLayer.utilityLayerScene.activeCamera && this.gizmoLayer.utilityLayerScene.activeCamera.maxZ < camera.maxZ * 1.5) {
                this.gizmoLayer.utilityLayerScene.activeCamera.maxZ = camera.maxZ * 1.5;
            }

            if (!this.attachedNode!.reservedDataStore) {
                this.attachedNode!.reservedDataStore = {};
            }
            this.attachedNode!.reservedDataStore.cameraGizmo = this;

            // Add lighting to the camera gizmo
            const gizmoLight = this.gizmoLayer._getSharedGizmoLight();
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
     * @internal
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

        // take care of coordinate system in camera scene to properly display the mesh with the good Y axis orientation in this scene
        this._cameraMesh.parent = null;
        this._cameraMesh.rotation.y = Math.PI * 0.5 * (this._camera.getScene().useRightHandedSystem ? 1 : -1);
        this._cameraMesh.parent = this._rootMesh;
    }

    // Static helper methods
    private static _Scale = 0.05;
    private _invProjection = new Matrix();

    /**
     * Disposes and replaces the current camera mesh in the gizmo with the specified mesh
     * @param mesh The mesh to replace the default mesh of the camera gizmo
     */
    public setCustomMesh(mesh: Mesh) {
        if (mesh.getScene() != this.gizmoLayer.utilityLayerScene) {
            // eslint-disable-next-line no-throw-literal
            throw "When setting a custom mesh on a gizmo, the custom meshes scene must be the same as the gizmos (eg. gizmo.gizmoLayer.utilityLayerScene)";
        }
        if (this._cameraMesh) {
            this._cameraMesh.dispose();
        }
        this._cameraMesh = mesh;
        this._cameraMesh.parent = this._rootMesh;
        this._customMeshSet = true;
    }

    /**
     * Disposes of the camera gizmo
     */
    public dispose() {
        this.onClickedObservable.clear();
        this.gizmoLayer.utilityLayerScene.onPointerObservable.remove(this._pointerObserver);
        if (this._cameraMesh) {
            this._cameraMesh.dispose();
        }
        if (this._cameraLinesMesh) {
            this._cameraLinesMesh.dispose();
        }
        this._material.dispose();
        super.dispose();
    }

    private static _CreateCameraMesh(scene: Scene) {
        const root = new Mesh("rootCameraGizmo", scene);

        const mesh = new Mesh(root.name, scene);
        mesh.parent = root;

        const box = CreateBox(root.name, { width: 1.0, height: 0.8, depth: 0.5 }, scene);
        box.parent = mesh;

        const cyl1 = CreateCylinder(root.name, { height: 0.5, diameterTop: 0.8, diameterBottom: 0.8 }, scene);
        cyl1.parent = mesh;
        cyl1.position.y = 0.3;
        cyl1.position.x = -0.6;
        cyl1.rotation.x = Math.PI * 0.5;

        const cyl2 = CreateCylinder(root.name, { height: 0.5, diameterTop: 0.6, diameterBottom: 0.6 }, scene);
        cyl2.parent = mesh;
        cyl2.position.y = 0.5;
        cyl2.position.x = 0.4;
        cyl2.rotation.x = Math.PI * 0.5;

        const cyl3 = CreateCylinder(root.name, { height: 0.5, diameterTop: 0.5, diameterBottom: 0.5 }, scene);
        cyl3.parent = mesh;
        cyl3.position.y = 0.0;
        cyl3.position.x = 0.6;
        cyl3.rotation.z = Math.PI * 0.5;

        root.scaling.scaleInPlace(CameraGizmo._Scale);
        mesh.position.x = -0.9;

        return root;
    }

    private static _CreateCameraFrustum(scene: Scene, linesColor: Color4) {
        const root = new Mesh("rootCameraGizmo", scene);
        const mesh = new Mesh(root.name, scene);
        mesh.parent = root;

        for (let y = 0; y < 4; y += 2) {
            for (let x = 0; x < 4; x += 2) {
                let line = CreateLines("lines", { points: [new Vector3(-1 + x, -1 + y, -1), new Vector3(-1 + x, -1 + y, 1)], colors: [linesColor, linesColor] }, scene);
                line.parent = mesh;
                line.alwaysSelectAsActiveMesh = true;
                line.isPickable = false;
                line = CreateLines("lines", { points: [new Vector3(-1, -1 + x, -1 + y), new Vector3(1, -1 + x, -1 + y)], colors: [linesColor, linesColor] }, scene);
                line.parent = mesh;
                line.alwaysSelectAsActiveMesh = true;
                line.isPickable = false;
                line = CreateLines("lines", { points: [new Vector3(-1 + x, -1, -1 + y), new Vector3(-1 + x, 1, -1 + y)], colors: [linesColor, linesColor] }, scene);
                line.parent = mesh;
                line.alwaysSelectAsActiveMesh = true;
                line.isPickable = false;
            }
        }

        return root;
    }
}
