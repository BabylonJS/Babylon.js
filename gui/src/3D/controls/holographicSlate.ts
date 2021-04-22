import { AbstractMesh, Scene, TransformNode } from "babylonjs/index";
import { Color3 } from "babylonjs/Maths/math.color";
import { BoxBuilder } from "babylonjs/Meshes/Builders/boxBuilder";
import { Mesh } from "babylonjs/Meshes/index";
import { FluentMaterial } from "../materials";
import { HolographicButton } from "./holographicButton";
import { Nullable } from "babylonjs/types";
import { Observer } from "babylonjs/Misc/observable";
import { Vector3 } from "babylonjs/Maths/math.vector";
import { Control3D } from "./control3D";
import { ContentDisplay3D } from "./contentDisplay3D";
import { AdvancedDynamicTexture, Image } from "../../2D";

/**
 * Class used to create a holographic slate
 */
export class HolographicSlate extends ContentDisplay3D {
    private _backPlateMaterial: FluentMaterial;
    private _contentMaterial: FluentMaterial;
    private _pickedPointObserver: Nullable<Observer<Nullable<Vector3>>>;
    private _imageUrl: string;

    protected _backPlate: Mesh;
    protected _contentPlate: Mesh;
    protected _followButton: HolographicButton;
    protected _closeButton: HolographicButton;
    protected _contentScaleRatio = 1;

    /**
     * Rendering ground id of all the mesh in the button
     */
    public set renderingGroupId(id: number) {
        this._backPlate.renderingGroupId = id;
        this._contentPlate.renderingGroupId = id;
    }
    public get renderingGroupId(): number {
        return this._backPlate.renderingGroupId;
    }

    /**
     * Gets or sets the image url for the button
     */
    public get imageUrl(): string {
        return this._imageUrl;
    }

    public set imageUrl(value: string) {
        if (this._imageUrl === value) {
            return;
        }

        this._imageUrl = value;
        this._rebuildContent();
    }

    // TODO : temporary to resize the slate and verify everything follows responsively
    private _relativeWidth: number = 1;
    public get relativeWidth() {
        return this._relativeWidth;
    }

    public set relativeWidth(value: number) {
        this._relativeWidth = value;
        this._positionElements();
    }

    private _relativeHeight: number = 1;
    public get relativeHeight() {
        return this._relativeHeight;
    }

    public set relativeHeight(value: number) {
        this._relativeHeight = value;
        this._positionElements();
    }
    /**
     * Creates a new slate
     * @param name defines the control name
     */
    constructor(name?: string) {
        super(name);

        this._followButton = new HolographicButton("followButton" + this.name);
        this._closeButton = new HolographicButton("closeButton" + this.name);
    }

    /**
     * Apply the facade texture (created from the content property).
     * This function can be overloaded by child classes
     * @param facadeTexture defines the AdvancedDynamicTexture to use
     */
    protected _applyFacade(facadeTexture: AdvancedDynamicTexture) {
        this._contentMaterial.albedoTexture = facadeTexture;
    }

    private _rebuildContent(): void {
        this._disposeFacadeTexture();
        if (this._imageUrl) {
            let image = new Image();
            image.source = this._imageUrl;

            if (this._contentPlate) {
                this.content = image;
            }
        }
    }

    private _addControl(control: Control3D): void {
        control._host = this._host;
        if (this._host.utilityLayer) {
            control._prepareNode(this._host.utilityLayer.utilityLayerScene);
        }
    }

    protected _getTypeName(): string {
        return "HolographicSlate";
    }

    private _positionElements() {
        const followButtonMesh = this._followButton.mesh;
        const closeButtonMesh = this._closeButton.mesh;
        const backPlate = this._backPlate;
        const contentPlate = this._contentPlate;

        if (followButtonMesh && closeButtonMesh && backPlate) {
            followButtonMesh.scaling.copyFromFloats(0.37, 0.37, 0.37);
            closeButtonMesh.scaling.copyFromFloats(0.37, 0.37, 0.37);
            followButtonMesh.position.copyFromFloats(2.8 * this.relativeWidth - 0.55, (this._relativeHeight - 1) / 0.82, -0.05);
            closeButtonMesh.position.copyFromFloats(2.8 * this.relativeWidth - 0.15, (this._relativeHeight - 1) / 0.82, -0.05);
            backPlate.position.y = (this._relativeHeight - 1) / 0.82;
            backPlate.scaling.x = this.relativeWidth;
            contentPlate.scaling.x = this.relativeWidth;
            contentPlate.scaling.y = this.relativeHeight;
        }
    }

    // Mesh association
    protected _createNode(scene: Scene): TransformNode {
        const node = new Mesh("slate" + this.name);
        this._backPlate = BoxBuilder.CreateBox("backPlate" + this.name, { width: 5.7, height: 0.4, depth: 0.04 }, scene);
        this._contentPlate = BoxBuilder.CreateBox("backPlate" + this.name, { width: 5.7, height: 2.4, depth: 0.04 });

        this._backPlate.parent = node;
        this._contentPlate.parent = node;
        this._contentPlate.position.y = -1.45;

        this._addControl(this._followButton);
        this._addControl(this._closeButton);

        const followButtonMesh = this._followButton.mesh!;
        const closeButtonMesh = this._closeButton.mesh!;
        followButtonMesh.parent = node;
        closeButtonMesh.parent = node;

        this._positionElements();

        this._followButton.imageUrl = "./textures/IconFollowMe.png";
        this._closeButton.imageUrl = "./textures/IconClose.png";

        // this._followButton.showBackPlate = false;
        // this._closeButton.showBackPlate = false;

        this._followButton.backMaterial.alpha = 0;
        this._closeButton.backMaterial.alpha = 0;

        node.isVisible = false;
        return node;
    }

    protected _affectMaterial(mesh: AbstractMesh) {
        // TODO share materials
        this._backPlateMaterial = new FluentMaterial(this.name + "plateMaterial", mesh.getScene());
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

        this._contentMaterial = new FluentMaterial(this.name + "contentMaterial", mesh.getScene());
        this._contentMaterial.renderBorders = true;

        this._backPlate.material = this._backPlateMaterial;
        this._contentPlate.material = this._contentMaterial;

        this._rebuildContent();
    }

    /**
     * Releases all associated resources
     */
    public dispose() {
        super.dispose();
        this._backPlateMaterial.dispose();
        this._contentMaterial.dispose();

        this._backPlate.dispose();
        this._contentPlate.dispose();

        this._followButton.dispose();
        this._closeButton.dispose();

        if (this._pickedPointObserver) {
            this._host.onPickedPointChangedObservable.remove(this._pickedPointObserver);
            this._pickedPointObserver = null;
        }
    }
}
