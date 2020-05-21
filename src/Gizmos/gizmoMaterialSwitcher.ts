import { PointerDragBehavior } from "../Behaviors/Meshes/pointerDragBehavior";
import { PointerInfo } from "../Events/pointerEvents";
import { HemisphericLight } from "../Lights/hemisphericLight";
import { StandardMaterial } from "../Materials/standardMaterial";
import { Color3 } from "../Maths/math.color";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { Scene } from "../scene";

/**
 * Tracks interactivity state of a Gizmo and switches materials of it's meshes
 */
export class GizmoMaterialSwitcher {
    /** @hidden */
    /**
     * Tracks Scenes that have an active Gizmo drag interaction.
     * Assumes only one Gizmo can be dragged at a time per Scene
     */
    public static _ScenesWithActiveDrag: Scene[] = [];

    private _dragBehavior: PointerDragBehavior;
    private _sharedGizmoLight: HemisphericLight;
    private _scene: Scene;

    private _defaultMaterial: StandardMaterial;
    private _hoverMaterial: StandardMaterial;
    private _dragMaterial: StandardMaterial;

    private _isHover: boolean = false;
    private _isDrag: boolean = false;
    private _material: StandardMaterial;

    private _meshes: AbstractMesh[];

    /**
     * Creates a GizmoMaterialSwitcher
     * @param color The color of the gizmo
     * @param dragBehavior PointerDragBehavior of the Gizmo
     * @param sharedGizmoLight The Light from gizmoLayer._getSharedGizmoLight()
     * @param scene Scene from gizmoLayer.utilityLayerScene
     */
    constructor(
        color: Color3,
        dragBehavior: PointerDragBehavior,
        sharedGizmoLight: HemisphericLight,
        scene: Scene
    ) {
        this._dragBehavior = dragBehavior;
        this._sharedGizmoLight = sharedGizmoLight;
        this._scene = scene;

        // Create Materials
        this._defaultMaterial = new StandardMaterial("_defaultMaterial", scene);
        this._defaultMaterial.diffuseColor = color;
        this._defaultMaterial.specularColor = color.subtract(
            new Color3(0.1, 0.1, 0.1)
        );

        this._hoverMaterial = new StandardMaterial("_hoverMaterial", scene);
        this._hoverMaterial.diffuseColor = color.add(new Color3(0.3, 0.3, 0.3));

        this._dragMaterial = new StandardMaterial("_dragMaterial", scene);
        this._dragMaterial.diffuseColor = color.add(
            new Color3(0.2, 0.2, 0.2)
        );

        // Add interactivity
        this._dragBehavior.onDragStartObservable.add(this._onDragStart);
        this._dragBehavior.onDragEndObservable.add(this._onDragEnd);
        this._scene.onPointerObservable.add(this._onPointer);

        // Update state
        this._meshes = [];
        this._updateMaterial();
    }

    // ========================================================================
    // PRIVATE
    // ========================================================================
    private _applyMaterial() {
        this._meshes.forEach((m) => {
            m.material = this._material;
        });
    }

    private _updateMaterial() {
        const material = this._isDrag
            ? this._dragMaterial
            : this._isHover
                ? this._hoverMaterial
                : this._defaultMaterial;
        if (this._material === material) {
            return;
        }
        this._material = material;
        this._applyMaterial();
    }

    private _onDragStart = () => {
        this._isDrag = true;
        this._updateMaterial();
        GizmoMaterialSwitcher._ScenesWithActiveDrag = [...GizmoMaterialSwitcher._ScenesWithActiveDrag, this._scene];
    }

    private _onDragEnd = () => {
        this._isDrag = false;
        this._updateMaterial();
        GizmoMaterialSwitcher._ScenesWithActiveDrag = GizmoMaterialSwitcher._ScenesWithActiveDrag.filter((scene) => scene !== this._scene);
    }

    private _onPointer = (pointerInfo: PointerInfo) => {
        const isDragActive = GizmoMaterialSwitcher._ScenesWithActiveDrag.indexOf(this._scene) != -1;
        if (isDragActive) {
            return;
        }
        this._isHover = pointerInfo.pickInfo
            ? this._meshes.indexOf(
                <AbstractMesh>pointerInfo.pickInfo.pickedMesh
            ) != -1
            : false;
        this._updateMaterial();
    }

    // ========================================================================
    // PUBLIC
    // ========================================================================
    /**
     * Start tracking and updating materials for meshes
     * @param newMeshes The meshes to add to internal list
     */
    public registerMeshes(newMeshes: AbstractMesh[]) {
        this._meshes = this._meshes.concat(newMeshes);
        this._sharedGizmoLight.includedOnlyMeshes = this._sharedGizmoLight.includedOnlyMeshes.concat(
            newMeshes
        );
        this._applyMaterial();
    }

    /**
     * Stop tracking and updating materials for meshes
     * @param oldMeshes The meshes to remove from internal list
     */
    public unregisterMeshes(oldMeshes: AbstractMesh[]) {
        const notOldMesh = (mesh: AbstractMesh) =>
            oldMeshes.indexOf(mesh) === -1;
        this._meshes = this._meshes.filter(notOldMesh);
        this._sharedGizmoLight.includedOnlyMeshes = this._sharedGizmoLight.includedOnlyMeshes.filter(
            notOldMesh
        );
    }

    /**
     * Disposes of the gizmo
     */
    public dispose() {
        this._dragBehavior.onDragStartObservable.removeCallback(
            this._onDragStart
        );
        this._dragBehavior.onDragEndObservable.removeCallback(this._onDragEnd);
        this._scene.onPointerObservable.removeCallback(this._onPointer);

        [
            this._defaultMaterial,
            this._hoverMaterial,
            this._dragMaterial,
        ].forEach((material) => {
            material.dispose();
        });
    }

    public get defaultMaterial() {
        return this._defaultMaterial;
    }
    public get hoverMaterial() {
        return this._hoverMaterial;
    }
    public get dragMaterial() {
        return this._dragMaterial;
    }
    public get material() {
        return this._material;
    }
}
