import { Scene } from "babylonjs/scene";
import { TransformNode } from "babylonjs/Meshes/transformNode";
import { Nullable } from "babylonjs/types";
import { Mesh } from "babylonjs/Meshes/mesh";
import { TouchHolographicButton } from "./touchHolographicButton";
import { DefaultBehavior } from "../behaviors/defaultBehavior";
import { TouchHolographicMenu } from "./touchHolographicMenu";
import { Observer } from "babylonjs/Misc/observable";
import { Vector3 } from "babylonjs/Maths/math.vector";
import { PickingInfo } from "babylonjs/Collisions/pickingInfo";

/**
 * NearMenu that displays buttons and follows the camera
 * @since 5.0.0
 */
export class NearMenu extends TouchHolographicMenu {
    /**
     * Base Url for the assets.
     */
    private static ASSETS_BASE_URL: string = "https://assets.babylonjs.com/meshes/MRTK/";
    /**
     * File name for the close icon.
     */
    private static PIN_ICON_FILENAME: string = "IconPin.png";

    private _pinButton: TouchHolographicButton;
    private _dragObserver: Nullable<
        Observer<{
            delta: Vector3;
            position: Vector3;
            pickInfo: PickingInfo;
        }>
    >;

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
        // Tell the pin button to toggle if this was called manually, for clean state control
        if (this._pinButton.isToggled !== value) {
            this._pinButton.isToggled = value;
            return;
        }

        this._isPinned = value;

        if (value) {
            this._defaultBehavior.followBehaviorEnabled = false;
        } else {
            this._defaultBehavior.followBehaviorEnabled = true;
        }
    }

    private _createPinButton(parent: TransformNode) {
        const control = new TouchHolographicButton("pin" + this.name, false);
        control.imageUrl = NearMenu.ASSETS_BASE_URL + NearMenu.PIN_ICON_FILENAME;
        control.parent = this;
        control._host = this._host;
        control.isToggleButton = true;
        control.onToggleObservable.add((newState) => { this.isPinned = newState; });

        if (this._host.utilityLayer) {
            control._prepareNode(this._host.utilityLayer.utilityLayerScene);
            control.scaling.scaleInPlace(TouchHolographicMenu.MENU_BUTTON_SCALE);

            if (control.node) {
                control.node.parent = parent;
            }
        }

        return control;
    }

    protected _createNode(scene: Scene): Nullable<TransformNode> {
        const node = super._createNode(scene)! as Mesh;

        this._pinButton = this._createPinButton(node);
        this.isPinned = false;

        this._defaultBehavior.attach(node, [this._backPlate]);
        this._defaultBehavior.followBehavior.ignoreCameraPitchAndRoll = true;
        this._defaultBehavior.followBehavior.pitchOffset = -15;
        this._defaultBehavior.followBehavior.minimumDistance = 0.3;
        this._defaultBehavior.followBehavior.defaultDistance = 0.4;
        this._defaultBehavior.followBehavior.maximumDistance = 0.6;

        this._backPlate.isNearGrabbable = true;
        node.isVisible = false;

        return node;
    }

    protected _finalProcessing() {
        super._finalProcessing();

        this._pinButton.position.copyFromFloats((this._backPlate.scaling.x + TouchHolographicMenu.MENU_BUTTON_SCALE) / 2, this._backPlate.scaling.y / 2, 0);
    }

    /**
     * Creates a near menu GUI 3D control
     * @param name name of the near menu
     */
    constructor(name?: string) {
        super(name);

        this._defaultBehavior = new DefaultBehavior();
        this._dragObserver = this._defaultBehavior.sixDofDragBehavior.onDragObservable.add(() => {
            this.isPinned = true;
        });

        this.backPlateMargin = 1;
    }

    /**
     * Disposes the near menu
     */
    public dispose() {
        super.dispose();

        this._defaultBehavior.sixDofDragBehavior.onDragObservable.remove(this._dragObserver);
        this._defaultBehavior.detach();
    }
}
