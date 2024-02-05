import { ContentDisplay3D } from "./contentDisplay3D";
import type { Control3D } from "./control3D";
import { TouchHolographicButton } from "./touchHolographicButton";
import { AdvancedDynamicTexture } from "../../2D/advancedDynamicTexture";
import { Control } from "../../2D/controls/control";
import { TextBlock, TextWrapping } from "../../2D/controls/textBlock";
import { DefaultBehavior } from "../behaviors/defaultBehavior";
import { SlateGizmo } from "../gizmos/slateGizmo";
import { FluentMaterial } from "../materials/fluent/fluentMaterial";
import { FluentBackplateMaterial } from "../materials/fluentBackplate/fluentBackplateMaterial";
import { PointerDragBehavior } from "core/Behaviors/Meshes/pointerDragBehavior";
import type { Texture } from "core/Materials/Textures/texture";
import { Vector4 } from "core/Maths/math";
import { Epsilon } from "core/Maths/math.constants";
import { Scalar } from "core/Maths/math.scalar";
import type { Matrix } from "core/Maths/math.vector";
import { Quaternion, Vector2, Vector3 } from "core/Maths/math.vector";
import { Viewport } from "core/Maths/math.viewport";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import { CreateBox } from "core/Meshes/Builders/boxBuilder";
import { CreatePlane } from "core/Meshes/Builders/planeBuilder";
import type { TransformNode } from "core/Meshes/transformNode";
import { Mesh } from "core/Meshes/mesh";
import { VertexData } from "core/Meshes/mesh.vertexData";
import type { Observer } from "core/Misc/observable";
import type { Scene } from "core/scene";
import type { Nullable } from "core/types";

/**
 * Class used to create a holographic slate
 * @since 5.0.0
 */
export class HolographicSlate extends ContentDisplay3D {
    /**
     * Base Url for the assets.
     */
    public static ASSETS_BASE_URL: string = "https://assets.babylonjs.com/meshes/MRTK/";
    /**
     * File name for the close icon.
     */
    public static CLOSE_ICON_FILENAME: string = "IconClose.png";
    /**
     * File name for the close icon.
     */
    public static FOLLOW_ICON_FILENAME: string = "IconFollowMe.png";

    private static _DEFAULT_TEXT_RESOLUTION_Y = 102.4;

    /**
     * Margin between title bar and contentplate
     */
    public titleBarMargin = 0.005;

    /**
     * Origin in local coordinates (top left corner)
     */
    public origin = new Vector3(0, 0, 0);

    private _dimensions = new Vector2(21.875, 12.5);
    private _titleBarHeight = 0.625;

    private _titleBarMaterial: FluentBackplateMaterial;
    private _backMaterial: FluentBackplateMaterial;
    private _contentMaterial: FluentMaterial;
    private _pickedPointObserver: Nullable<Observer<Nullable<Vector3>>>;
    private _positionChangedObserver: Nullable<Observer<{ position: Vector3 }>>;

    private _titleText = "";
    private _titleTextComponent: TextBlock;

    private _contentViewport: Viewport;
    private _contentDragBehavior: PointerDragBehavior;

    private _defaultBehavior: DefaultBehavior;
    /**
     * Regroups all mesh behaviors for the slate
     */
    public get defaultBehavior(): DefaultBehavior {
        return this._defaultBehavior;
    }

    /** @internal */
    public _gizmo: SlateGizmo;

    protected _titleBar: Mesh;
    protected _titleBarTitle: Mesh;
    protected _contentPlate: Mesh;
    protected _backPlate: Mesh;
    /** @internal */
    public _followButton: TouchHolographicButton;
    protected _closeButton: TouchHolographicButton;
    protected _contentScaleRatio = 1;

    /**
     * 2D dimensions of the slate
     */
    public get dimensions() {
        return this._dimensions;
    }
    public set dimensions(value) {
        //clamp, respecting ratios
        let scale = 1.0;
        if (value.x < this.minDimensions.x || value.y < this.minDimensions.y) {
            const newRatio = value.x / value.y;
            const minRatio = this.minDimensions.x / this.minDimensions.y;
            if (minRatio > newRatio) {
                // We just need to make sure the x-val is greater than the min
                scale = this.minDimensions.x / value.x;
            } else {
                // We just need to make sure the y-val is greater than the min
                scale = this.minDimensions.y / value.y;
            }
        }

        this._dimensions.copyFrom(value).scaleInPlace(scale);
        this._updatePivot();
        this._positionElements();
    }

    /**
     * Minimum dimensions of the slate
     */
    public minDimensions = new Vector2(15.625, 6.25);

    /**
     * Default dimensions of the slate
     */
    public readonly defaultDimensions = this._dimensions.clone();

    /**
     * Height of the title bar component
     */
    public get titleBarHeight() {
        return this._titleBarHeight;
    }
    public set titleBarHeight(value) {
        this._titleBarHeight = value;
    }

    /**
     * Rendering ground id of all the meshes
     */
    public set renderingGroupId(id: number) {
        this._titleBar.renderingGroupId = id;
        this._titleBarTitle.renderingGroupId = id;
        this._contentPlate.renderingGroupId = id;
        this._backPlate.renderingGroupId = id;
    }
    public get renderingGroupId(): number {
        return this._titleBar.renderingGroupId;
    }

    /**
     * The title text displayed at the top of the slate
     */
    public set title(title: string) {
        this._titleText = title;
        if (this._titleTextComponent) {
            this._titleTextComponent.text = title;
        }
    }
    public get title() {
        return this._titleText;
    }

    /**
     * Creates a new slate
     * @param name defines the control name
     */
    constructor(name?: string) {
        super(name);

        this._followButton = new TouchHolographicButton("followButton" + this.name);
        this._followButton.isToggleButton = true;
        this._closeButton = new TouchHolographicButton("closeButton" + this.name);

        this._contentViewport = new Viewport(0, 0, 1, 1);
        this._contentDragBehavior = new PointerDragBehavior({
            dragPlaneNormal: new Vector3(0, 0, -1),
        });
    }

    /**
     * Apply the facade texture (created from the content property).
     * This function can be overloaded by child classes
     * @param facadeTexture defines the AdvancedDynamicTexture to use
     */
    protected _applyFacade(facadeTexture: AdvancedDynamicTexture) {
        this._contentMaterial.albedoTexture = facadeTexture;
        this._resetContentPositionAndZoom();
        this._applyContentViewport();

        facadeTexture.attachToMesh(this._contentPlate, true);
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

    /**
     * @internal
     */
    public _positionElements() {
        const followButton = this._followButton;
        const closeButton = this._closeButton;
        const titleBar = this._titleBar;
        const titleBarTitle = this._titleBarTitle;
        const contentPlate = this._contentPlate;
        const backPlate = this._backPlate;

        if (followButton && closeButton && titleBar) {
            closeButton.scaling.setAll(this.titleBarHeight);
            followButton.scaling.setAll(this.titleBarHeight);
            closeButton.position.copyFromFloats(this.dimensions.x - this.titleBarHeight / 2, -this.titleBarHeight / 2, 0).addInPlace(this.origin);
            followButton.position.copyFromFloats(this.dimensions.x - (3 * this.titleBarHeight) / 2, -this.titleBarHeight / 2, 0).addInPlace(this.origin);

            const contentPlateHeight = this.dimensions.y - this.titleBarHeight - this.titleBarMargin;
            const rightHandScene = contentPlate.getScene().useRightHandedSystem;

            titleBar.scaling.set(this.dimensions.x, this.titleBarHeight, Epsilon);
            titleBarTitle.scaling.set(this.dimensions.x - 2 * this.titleBarHeight, this.titleBarHeight, Epsilon);
            contentPlate.scaling.copyFromFloats(this.dimensions.x, contentPlateHeight, Epsilon);
            backPlate.scaling.copyFromFloats(this.dimensions.x, contentPlateHeight, Epsilon);

            titleBar.position.copyFromFloats(this.dimensions.x / 2, -(this.titleBarHeight / 2), 0).addInPlace(this.origin);
            titleBarTitle.position
                .copyFromFloats(this.dimensions.x / 2 - this.titleBarHeight, -(this.titleBarHeight / 2), rightHandScene ? Epsilon : -Epsilon)
                .addInPlace(this.origin);
            contentPlate.position.copyFromFloats(this.dimensions.x / 2, -(this.titleBarHeight + this.titleBarMargin + contentPlateHeight / 2), 0).addInPlace(this.origin);
            backPlate.position
                .copyFromFloats(this.dimensions.x / 2, -(this.titleBarHeight + this.titleBarMargin + contentPlateHeight / 2), rightHandScene ? -Epsilon : Epsilon)
                .addInPlace(this.origin);

            // Update the title's AdvancedDynamicTexture scale to avoid visual stretching
            this._titleTextComponent.host.scaleTo(
                (HolographicSlate._DEFAULT_TEXT_RESOLUTION_Y * titleBarTitle.scaling.x) / titleBarTitle.scaling.y,
                HolographicSlate._DEFAULT_TEXT_RESOLUTION_Y
            );

            const aspectRatio = this.dimensions.x / contentPlateHeight;
            this._contentViewport.width = this._contentScaleRatio;
            this._contentViewport.height = this._contentScaleRatio / aspectRatio;

            this._applyContentViewport();
            if (this._gizmo) {
                this._gizmo.updateBoundingBox();
            }
        }
    }

    private _applyContentViewport() {
        if (this._contentPlate?.material && (this._contentPlate.material as FluentMaterial).albedoTexture) {
            const tex = (this._contentPlate.material as FluentMaterial).albedoTexture as Texture;
            tex.uScale = this._contentScaleRatio;
            tex.vScale = (this._contentScaleRatio / this._contentViewport.width) * this._contentViewport.height;
            tex.uOffset = this._contentViewport.x;
            tex.vOffset = this._contentViewport.y;
        }
    }

    private _resetContentPositionAndZoom() {
        this._contentViewport.x = 0;
        this._contentViewport.y = 1 - this._contentViewport.height / this._contentViewport.width;
        this._contentScaleRatio = 1;
    }

    /**
     * @internal
     */
    public _updatePivot() {
        if (!this.mesh) {
            return;
        }

        // Update pivot point so it is at the center of geometry
        // As origin is topleft corner in 2D, dimensions are calculated towards bottom right corner, thus y axis is downwards
        const center = new Vector3(this.dimensions.x * 0.5, -this.dimensions.y * 0.5, Epsilon);
        center.addInPlace(this.origin);
        center.z = 0;

        const origin = new Vector3(0, 0, 0);
        Vector3.TransformCoordinatesToRef(origin, this.mesh.computeWorldMatrix(true), origin);
        this.mesh.setPivotPoint(center);
        const origin2 = new Vector3(0, 0, 0);
        Vector3.TransformCoordinatesToRef(origin2, this.mesh.computeWorldMatrix(true), origin2);
        this.mesh.position.addInPlace(origin).subtractInPlace(origin2);
    }

    // Mesh association
    protected _createNode(scene: Scene): TransformNode {
        const node = new Mesh("slate_" + this.name, scene);

        this._titleBar = CreateBox("titleBar_" + this.name, { size: 1 }, scene);
        this._titleBarTitle = CreatePlane("titleText_" + this.name, { size: 1 }, scene);
        this._titleBarTitle.parent = node;
        this._titleBarTitle.isPickable = false;

        const adt = AdvancedDynamicTexture.CreateForMesh(this._titleBarTitle);
        this._titleTextComponent = new TextBlock("titleText_" + this.name, this._titleText);
        this._titleTextComponent.textWrapping = TextWrapping.Ellipsis;
        this._titleTextComponent.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._titleTextComponent.color = "white";
        this._titleTextComponent.fontSize = HolographicSlate._DEFAULT_TEXT_RESOLUTION_Y / 2;
        this._titleTextComponent.paddingLeft = HolographicSlate._DEFAULT_TEXT_RESOLUTION_Y / 4;
        adt.addControl(this._titleTextComponent);

        if (scene.useRightHandedSystem) {
            const faceUV = new Vector4(0, 0, 1, 1);
            this._contentPlate = CreatePlane("contentPlate_" + this.name, { size: 1, sideOrientation: VertexData.BACKSIDE, frontUVs: faceUV }, scene);
            this._backPlate = CreatePlane("backPlate_" + this.name, { size: 1, sideOrientation: VertexData.FRONTSIDE }, scene);
        } else {
            const faceUV = new Vector4(0, 0, 1, 1);
            this._contentPlate = CreatePlane("contentPlate_" + this.name, { size: 1, sideOrientation: VertexData.FRONTSIDE, frontUVs: faceUV }, scene);
            this._backPlate = CreatePlane("backPlate_" + this.name, { size: 1, sideOrientation: VertexData.BACKSIDE }, scene);
        }

        this._titleBar.parent = node;
        this._titleBar.isNearGrabbable = true;
        this._contentPlate.parent = node;
        this._backPlate.parent = node;
        this._attachContentPlateBehavior();

        this._addControl(this._followButton);
        this._addControl(this._closeButton);

        const followButton = this._followButton;
        const closeButton = this._closeButton;

        followButton.node!.parent = node;
        closeButton.node!.parent = node;

        this._positionElements();

        this._followButton.imageUrl = HolographicSlate.ASSETS_BASE_URL + HolographicSlate.FOLLOW_ICON_FILENAME;
        this._closeButton.imageUrl = HolographicSlate.ASSETS_BASE_URL + HolographicSlate.CLOSE_ICON_FILENAME;

        this._followButton.isBackplateVisible = false;
        this._closeButton.isBackplateVisible = false;

        this._followButton.onToggleObservable.add((isToggled) => {
            this._defaultBehavior.followBehaviorEnabled = isToggled;
            if (this._defaultBehavior.followBehaviorEnabled) {
                this._defaultBehavior.followBehavior.recenter();
            }
        });

        this._closeButton.onPointerClickObservable.add(() => {
            this.dispose();
        });

        node.rotationQuaternion = Quaternion.Identity();
        node.isVisible = false;

        return node;
    }

    private _attachContentPlateBehavior() {
        this._contentDragBehavior.attach(this._contentPlate);
        this._contentDragBehavior.moveAttached = false;
        this._contentDragBehavior.useObjectOrientationForDragging = true;
        this._contentDragBehavior.updateDragPlane = false;

        const origin = new Vector3();
        const worldDimensions = new Vector3();
        const upWorld = new Vector3();
        const rightWorld = new Vector3();
        const projectedOffset = new Vector2();
        let startViewport: Viewport;
        let worldMatrix: Matrix;

        this._contentDragBehavior.onDragStartObservable.add((event) => {
            if (!this.node) {
                return;
            }
            startViewport = this._contentViewport.clone();
            worldMatrix = this.node.computeWorldMatrix(true);

            origin.copyFrom(event.dragPlanePoint);
            worldDimensions.set(this.dimensions.x, this.dimensions.y, Epsilon);
            worldDimensions.y -= this.titleBarHeight + this.titleBarMargin;
            Vector3.TransformNormalToRef(worldDimensions, worldMatrix, worldDimensions);
            upWorld.copyFromFloats(0, 1, 0);
            Vector3.TransformNormalToRef(upWorld, worldMatrix, upWorld);
            rightWorld.copyFromFloats(1, 0, 0);
            Vector3.TransformNormalToRef(rightWorld, worldMatrix, rightWorld);
            upWorld.normalize();
            upWorld.scaleInPlace(1 / Vector3.Dot(upWorld, worldDimensions));
            rightWorld.normalize();
            rightWorld.scaleInPlace(1 / Vector3.Dot(rightWorld, worldDimensions));
        });

        const offset = new Vector3();
        this._contentDragBehavior.onDragObservable.add((event) => {
            offset.copyFrom(event.dragPlanePoint);
            offset.subtractInPlace(origin);
            projectedOffset.copyFromFloats(Vector3.Dot(offset, rightWorld), Vector3.Dot(offset, upWorld));

            // By default, content takes full width available and height is cropped to keep aspect ratio
            this._contentViewport.x = Scalar.Clamp(startViewport.x - offset.x, 0, 1 - this._contentViewport.width * this._contentScaleRatio);
            this._contentViewport.y = Scalar.Clamp(startViewport.y - offset.y, 0, 1 - this._contentViewport.height * this._contentScaleRatio);
            this._applyContentViewport();
        });
    }

    protected _affectMaterial(mesh: AbstractMesh) {
        // TODO share materials
        this._titleBarMaterial = new FluentBackplateMaterial(`${this.name} plateMaterial`, mesh.getScene());

        this._contentMaterial = new FluentMaterial(`${this.name} contentMaterial`, mesh.getScene());
        this._contentMaterial.renderBorders = true;

        this._backMaterial = new FluentBackplateMaterial(`${this.name} backPlate`, mesh.getScene());
        this._backMaterial.lineWidth = Epsilon;
        this._backMaterial.radius = 0.005;
        this._backMaterial.backFaceCulling = true;

        this._titleBar.material = this._titleBarMaterial;
        this._contentPlate.material = this._contentMaterial;
        this._backPlate.material = this._backMaterial;

        this._resetContent();
        this._applyContentViewport();
    }

    /**
     * @internal
     */
    public _prepareNode(scene: Scene): void {
        super._prepareNode(scene);
        this._gizmo = new SlateGizmo(this._host.utilityLayer!);
        this._gizmo.attachedSlate = this;
        this._defaultBehavior = new DefaultBehavior();
        this._defaultBehavior.attach(this.node as Mesh, [this._titleBar]);
        this._defaultBehavior.sixDofDragBehavior.onDragStartObservable.add(() => {
            this._followButton.isToggled = false;
        });

        this._positionChangedObserver = this._defaultBehavior.sixDofDragBehavior.onPositionChangedObservable.add(() => {
            this._gizmo.updateBoundingBox();
        });

        this._updatePivot();
        this.resetDefaultAspectAndPose(false);
    }

    /**
     * Resets the aspect and pose of the slate so it is right in front of the active camera, facing towards it.
     * @param resetAspect Should the slate's dimensions/aspect ratio be reset as well
     */
    public resetDefaultAspectAndPose(resetAspect: boolean = true) {
        if (!this._host || !this._host.utilityLayer || !this.node) {
            return;
        }
        const scene = this._host.utilityLayer.utilityLayerScene;
        const camera = scene.activeCamera;
        if (camera) {
            const worldMatrix = camera.getWorldMatrix();
            const backward = Vector3.TransformNormal(Vector3.Backward(scene.useRightHandedSystem), worldMatrix);
            this.origin.setAll(0);
            this._gizmo.updateBoundingBox();
            const pivot = this.node.getAbsolutePivotPoint();
            this.node.position.copyFrom(camera.position).subtractInPlace(backward).subtractInPlace(pivot);
            this.node.rotationQuaternion = Quaternion.FromLookDirectionLH(backward, new Vector3(0, 1, 0));

            if (resetAspect) {
                this.dimensions = this.defaultDimensions;
            }
        }
    }

    /**
     * Releases all associated resources
     */
    public dispose() {
        super.dispose();
        this._titleBarMaterial.dispose();
        this._contentMaterial.dispose();

        this._titleBar.dispose();
        this._titleBarTitle.dispose();
        this._contentPlate.dispose();
        this._backPlate.dispose();

        this._followButton.dispose();
        this._closeButton.dispose();

        this._host.onPickedPointChangedObservable.remove(this._pickedPointObserver);
        this._defaultBehavior.sixDofDragBehavior.onPositionChangedObservable.remove(this._positionChangedObserver);

        this._defaultBehavior.detach();
        this._gizmo.dispose();
        this._contentDragBehavior.detach();
    }
}
