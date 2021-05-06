import { Scene } from "babylonjs/scene";
import { Vector2, Vector3 } from "babylonjs/Maths/math.vector";
import { TransformNode } from "babylonjs/Meshes/transformNode";
import { Nullable } from "babylonjs/types";
import { Control3D } from "./control3D";
import { VolumeBasedPanel } from "./volumeBasedPanel";
import { Mesh } from "babylonjs/Meshes/mesh";
import { BoxBuilder } from "babylonjs/Meshes/Builders/boxBuilder";
import { AbstractMesh } from "babylonjs/Meshes/index";
import { FluentMaterial } from "../materials";
import { Color3 } from "babylonjs/Maths/math.color";
import { Observer } from "babylonjs/Misc/observable";

/**
 * NearMenu that displays buttons and follows the camera
 */
export class NearMenu extends VolumeBasedPanel {
    private _backPlate: Mesh;
    private _backPlateMaterial: FluentMaterial;
    private _pickedPointObserver: Nullable<Observer<Nullable<Vector3>>>;

    protected _createNode(scene: Scene): Nullable<TransformNode> {
        // TODO : create backplate and pin button
        const node = new Mesh("nearMenu" + this.name);

        this._backPlate = BoxBuilder.CreateBox("backPlate" + this.name, { size: 1 }, scene);
        this._backPlate.parent = node;

        return node;
    }

    protected _affectMaterial(mesh: AbstractMesh) {
        // TODO share materials
        this._backPlateMaterial = new FluentMaterial(this.name + "backPlateMaterial", mesh.getScene());
        this._backPlateMaterial.albedoColor = new Color3(0.08, 0.15, 0.55);
        this._backPlateMaterial.renderBorders = true;
        this._backPlateMaterial.renderHoverLight = true;

        this._pickedPointObserver = this._host.onPickedPointChangedObservable.add((pickedPoint) => {
            if (pickedPoint) {
                this._backPlateMaterial.hoverPosition = pickedPoint;
                this._backPlateMaterial.hoverColor.a = 1.0;
            } else {
                this._backPlateMaterial.hoverColor.a = 0;
            }
        });

        this._backPlate.material = this._backPlateMaterial;
    }

    protected _mapGridNode(control: Control3D, nodePosition: Vector3) {
        // Simple plane mapping for the menu
        let mesh = control.mesh;

        if (!mesh) {
            return;
        }

        control.position = nodePosition.clone();
    }

    protected _finalProcessing() {
        this._backPlate.scaling.x = this.columns * this._cellWidth;
        this._backPlate.scaling.y = this.rows * this._cellHeight;
    }

    public dispose() {
        super.dispose();

        this._host.onPickedPointChangedObservable.remove(this._pickedPointObserver);
    }
}
