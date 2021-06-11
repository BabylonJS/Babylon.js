import { Scene } from "babylonjs/scene";
import { Vector3 } from "babylonjs/Maths/math.vector";
import { TransformNode } from "babylonjs/Meshes/transformNode";
import { Nullable } from "babylonjs/types";
import { Control3D } from "./control3D";
import { VolumeBasedPanel } from "./volumeBasedPanel";
import { Mesh } from "babylonjs/Meshes/mesh";
import { BoxBuilder } from "babylonjs/Meshes/Builders/boxBuilder";
import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
import { FluentMaterial } from "../materials/fluent/fluentMaterial";
import { Color3 } from "babylonjs/Maths/math.color";
import { Observer } from "babylonjs/Misc/observable";
import { Logger } from "babylonjs/Misc/logger";
import { Container3D } from "./container3D";
import { TouchHolographicButton } from "./touchHolographicButton";

/**
 * Simple menu that can contain holographic buttons
 */
export class TouchHolographicMenu extends VolumeBasedPanel {
    protected _backPlate: Mesh;
    private _backPlateMaterial: FluentMaterial;
    private _pickedPointObserver: Nullable<Observer<Nullable<Vector3>>>;

    private _currentMin: Nullable<Vector3>;
    private _currentMax: Nullable<Vector3>;

    /**
     * Margin size of the backplate in button size units (setting this to 1, will make the backPlate margin the size of 1 button)
     */
    public backPlateMargin = 1.25;

    protected _createNode(scene: Scene): Nullable<TransformNode> {
        const node = new Mesh(`menu_${this.name}`, scene);

        this._backPlate = BoxBuilder.CreateBox("backPlate" + this.name, { size: 1 }, scene);
        this._backPlate.parent = node;

        return node;
    }

    protected _affectMaterial(mesh: AbstractMesh) {
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
        const mesh = control.mesh;

        if (!mesh) {
            return;
        }

        control.position = nodePosition.clone();

        if (!this._currentMin) {
            this._currentMin = nodePosition.clone();
            this._currentMax = nodePosition.clone();
        }

        this._currentMin.minimizeInPlace(nodePosition);
        this._currentMax!.maximizeInPlace(nodePosition);
    }

    protected _finalProcessing() {
        this._currentMin!.addInPlaceFromFloats(-this._cellWidth / 2, -this._cellHeight / 2, 0);
        this._currentMax!.addInPlaceFromFloats(this._cellWidth / 2, this._cellHeight / 2, 0);
        const extendSize = this._currentMax!.subtract(this._currentMin!);

        // Also add a % margin
        this._backPlate.scaling.x = extendSize.x + this._cellWidth * this.backPlateMargin;
        this._backPlate.scaling.y = extendSize.y + this._cellHeight * this.backPlateMargin;
        this._backPlate.scaling.z = 0.001;

        for (let i = 0; i < this._children.length; i++) {
            this._children[i].position.subtractInPlace(this._currentMin!).subtractInPlace(extendSize.scale(0.5));
            this._children[i].position.z -= 0.01;
        }

        this._currentMin = null;
        this._currentMax = null;
    }

    /**
     * Creates a holographic menu GUI 3D control
     * @param name name of the menu
     */
    constructor(name: string) {
        super();

        this.name = name;
    }

    /**
     * Adds a button to the menu.
     * Please note that the back material of the button will be set to transparent as it is attached to the menu.
     *
     * @param button Button to add
     * @returns This menu
     */
    public addButton(button: TouchHolographicButton): TouchHolographicMenu {
        super.addControl(button);

        if (button.backMaterial) {
            button.backMaterial.alpha = 0;
        }

        return this;
    }

    /**
     * This method should not be used directly. It is inherited from `Container3D`.
     * Please use `addButton` instead.
     * @param _control
     * @returns
     */
    public addControl(_control: Control3D): Container3D {
        Logger.Warn("TouchHolographicMenu can only contain buttons. Please use the method `addButton` instead.");

        return this;
    }

    /**
     * Disposes the menu
     */
    public dispose() {
        super.dispose();

        this._host.onPickedPointChangedObservable.remove(this._pickedPointObserver);
    }
}
