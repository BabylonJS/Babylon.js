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
import { DefaultBehavior } from "../behaviors/defaultBehavior";
import { StandardMaterial } from "babylonjs/Materials/standardMaterial";

/**
 * NearMenu that displays buttons and follows the camera
 */
export class NearMenu extends VolumeBasedPanel {
    /**
     * Base Url for the assets.
     */
    private static ASSETS_BASE_URL: string = "https://assets.babylonjs.com/meshes/MRTK/";
    /**
     * File name for the close icon.
     */
    private static PIN_ICON_FILENAME: string = "IconPin.png";

    private _pinButton: TouchHolographicButton;
    private _backPlate: Mesh;
    private _backPlateMaterial: FluentMaterial;
    private _pinMaterial: StandardMaterial;
    private _pickedPointObserver: Nullable<Observer<Nullable<Vector3>>>;

    private _currentMin: Nullable<Vector3>;
    private _currentMax: Nullable<Vector3>;

    private _defaultBehavior: DefaultBehavior;
    /** 
     * Regroups all mesh behaviors for the near menu
     */
    public get defaultBehavior(): DefaultBehavior {
        return this._defaultBehavior;
    }

    private _isPinned: boolean = false;
    /**
     * Indicates if the near menu is world-pinned
     */
    public get isPinned(): boolean {
        return this._isPinned;
    }

    public set isPinned(value: boolean) {
        this._isPinned = value;

        if (this._isPinned) {
            this._pinMaterial.emissiveColor.copyFromFloats(0.25, 0.4, 0.95);
            this._defaultBehavior.followBehaviorEnabled = false;
        } else {
            this._pinMaterial.emissiveColor.copyFromFloats(0.08, 0.15, 0.55);
            this._defaultBehavior.followBehaviorEnabled = true;
        }
    }

    private _createPinButton(parent: TransformNode) {
        const control = new TouchHolographicButton("pin" + this.name, false);
        control.imageUrl = NearMenu.ASSETS_BASE_URL + NearMenu.PIN_ICON_FILENAME;
        control.parent = this;
        control._host = this._host;
        control.onPointerClickObservable.add(() => (this.isPinned = !this.isPinned));

        if (this._host.utilityLayer) {
            control._prepareNode(this._host.utilityLayer.utilityLayerScene);
            this._pinMaterial = control.backMaterial;
            this._pinMaterial.diffuseColor.copyFromFloats(0, 0, 0);

            if (control.node) {
                control.node.parent = parent;
            }
        }

        return control;
    }

    protected _createNode(scene: Scene): Nullable<TransformNode> {
        const node = new Mesh("nearMenu" + this.name, scene);

        this._backPlate = BoxBuilder.CreateBox("backPlate" + this.name, { size: 1 }, scene);
        this._backPlate.parent = node;

        this._pinButton = this._createPinButton(node);
        this.isPinned = false;

        this._defaultBehavior.attach(node, [this._backPlate]);
        node.isVisible = false;

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
        this._backPlate.scaling.x = extendSize.x + this._cellWidth * 1.25;
        this._backPlate.scaling.y = extendSize.y + this._cellHeight * 1.25;
        this._backPlate.scaling.z = 0.001;

        for (let i = 0; i < this._children.length; i++) {
            this._children[i].position.subtractInPlace(this._currentMin!).subtractInPlace(extendSize.scale(0.5));
            this._children[i].position.z -= 0.01;
        }

        this._currentMin = null;
        this._currentMax = null;

        this._pinButton.position.copyFromFloats(this._backPlate.scaling.x / 2 + 0.02, this._backPlate.scaling.y / 2, -0.01);

        this._defaultBehavior.followBehavior.minimumDistance = extendSize.length() * 3 * this.scaling.length();
        this._defaultBehavior.followBehavior.maximumDistance = extendSize.length() * 5 * this.scaling.length();
        this._defaultBehavior.followBehavior.defaultDistance = extendSize.length() * this.scaling.length();
    }

    /**
     * Creates a near menu GUI 3D control
     * @param name name of the near menu
     */
    constructor(name: string) {
        super();

        this.name = name;
        this._defaultBehavior = new DefaultBehavior();
        this._defaultBehavior.sixDofDragBehavior.onDragObservable.add(() => {
            this.isPinned = true;
        });
    }

    /**
     * Adds a button to the near menu.
     * Please note that the back material of the button will be set to transparent as it is attached to the near menu.
     *
     * @param button Button to add
     * @returns This near menu
     */
    public addButton(button: TouchHolographicButton): NearMenu {
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
        Logger.Warn("Near menu can only contain buttons. Please use the method `addButton` instead.");

        return this;
    }

    /**
     * Disposes the near menu
     */
    public dispose() {
        super.dispose();

        this._defaultBehavior.detach();
        this._host.onPickedPointChangedObservable.remove(this._pickedPointObserver);
    }
}
