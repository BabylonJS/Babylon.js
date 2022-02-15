import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
import { Scene } from "babylonjs/scene";
import { TransformNode } from "babylonjs/Meshes/transformNode";
import { CreateBox } from "babylonjs/Meshes/Builders/boxBuilder";
import { Mesh } from "babylonjs/Meshes/mesh";
import { FluentMaterial } from "../materials/fluent/fluentMaterial";
import { TouchHolographicButton } from "./touchHolographicButton";
import { Nullable } from "babylonjs/types";
import { Observer } from "babylonjs/Misc/observable";
import { Matrix, Quaternion, Vector2, Vector3 } from "babylonjs/Maths/math.vector";
import { Control3D } from "./control3D";
import { ContentDisplay3D } from "./contentDisplay3D";
import { AdvancedDynamicTexture } from "../../2D/advancedDynamicTexture";
import { SlateGizmo } from "../gizmos/slateGizmo";
import { DefaultBehavior } from "../behaviors/defaultBehavior";
import { Viewport } from "babylonjs/Maths/math.viewport";
import { PointerDragBehavior } from "babylonjs/Behaviors/Meshes/pointerDragBehavior";
import { Scalar } from "babylonjs/Maths/math.scalar";
import { Texture } from "babylonjs/Materials/Textures/texture";
import { FluentBackplateMaterial } from "../materials/fluentBackplate/fluentBackplateMaterial";
import { Vector4 } from "babylonjs/Maths/math";

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

    private static SLATE_DEPTH: number = 0.001;

    /**
     * 2D dimensions of the slate
     */
    public dimensions = new Vector2(21.875, 12.5);

    /**
     * Minimum dimensions of the slate
     */
    public minDimensions = new Vector2(15.625, 6.25);

    /**
     * Default dimensions of the slate
     */
    public readonly defaultDimensions = this.dimensions.clone();

    /**
     * Height of the title bar component
     */
    public titleBarHeight = 0.625;

    /**
     * Margin between title bar and contentplate
     */
    public titleBarMargin = 0.005;

    /**
     * Origin in local coordinates (top left corner)
     */
    public origin = new Vector3(0, 0, 0);

    private _titleBarMaterial: FluentBackplateMaterial;
    private _contentMaterial: FluentMaterial;
    private _pickedPointObserver: Nullable<Observer<Nullable<Vector3>>>;
    private _positionChangedObserver: Nullable<Observer<{ position: Vector3 }>>;

    private _contentViewport: Viewport;
    private _contentDragBehavior: PointerDragBehavior;

    private _defaultBehavior: DefaultBehavior;
    /**
     * Regroups all mesh behaviors for the slate
     */
    public get defaultBehavior(): DefaultBehavior {
        return this._defaultBehavior;
    }

    /** @hidden */
    public _gizmo: SlateGizmo;

    protected _titleBar: Mesh;
    protected _contentPlate: Mesh;
    protected _followButton: TouchHolographicButton;
    protected _closeButton: TouchHolographicButton;
    protected _contentScaleRatio = 1;

    /**
     * Rendering ground id of all the mesh in the button
     */
    public set renderingGroupId(id: number) {
        this._titleBar.renderingGroupId = id;
        this._contentPlate.renderingGroupId = id;
    }
    public get renderingGroupId(): number {
        return this._titleBar.renderingGroupId;
    }

    /**
     * Creates a new slate
     * @param name defines the control name
     */
    constructor(name?: string) {
        super(name);

        this._followButton = new TouchHolographicButton("followButton" + this.name);
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
     * @hidden
     */
    public _positionElements() {
        const followButtonMesh = this._followButton.mesh;
        const closeButtonMesh = this._closeButton.mesh;
        const titleBar = this._titleBar;
        const contentPlate = this._contentPlate;

        if (followButtonMesh && closeButtonMesh && titleBar) {
            // World size of a button with 1 scaling
            const buttonBaseSize = 1;

            // Buttons take full titleBar on Y axis
            const titleBarYScale = this.titleBarHeight / buttonBaseSize;

            closeButtonMesh.scaling.setAll(titleBarYScale);
            followButtonMesh.scaling.setAll(titleBarYScale);
            closeButtonMesh.position
                .copyFromFloats(
                    this.dimensions.x - titleBarYScale / 2,
                    -this.titleBarHeight / 2,
                    (-HolographicSlate.SLATE_DEPTH / 2) * (this._host.scene.useRightHandedSystem ? -1 : 1)
                )
                .addInPlace(this.origin);
            followButtonMesh.position
                .copyFromFloats(
                    this.dimensions.x - (3 * titleBarYScale) / 2,
                    -this.titleBarHeight / 2,
                    (-HolographicSlate.SLATE_DEPTH / 2) * (this._host.scene.useRightHandedSystem ? -1 : 1)
                )
                .addInPlace(this.origin);

            const contentPlateHeight = this.dimensions.y - this.titleBarHeight - this.titleBarMargin;
            titleBar.scaling.set(this.dimensions.x, this.titleBarHeight, HolographicSlate.SLATE_DEPTH);
            contentPlate.scaling.copyFromFloats(this.dimensions.x, contentPlateHeight, HolographicSlate.SLATE_DEPTH);
            titleBar.position.copyFromFloats(this.dimensions.x / 2, -(this.titleBarHeight / 2), 0).addInPlace(this.origin);
            contentPlate.position.copyFromFloats(this.dimensions.x / 2, -(this.titleBarHeight + this.titleBarMargin + contentPlateHeight / 2), 0).addInPlace(this.origin);

            const aspectRatio = this.dimensions.x / contentPlateHeight;
            this._contentViewport.width = this._contentScaleRatio;
            this._contentViewport.height = this._contentScaleRatio / aspectRatio;

            this._applyContentViewport();
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
     * @hidden
     */
    public _updatePivot() {
        if (!this.mesh) {
            return;
        }

        // Update pivot point so it is at the center of geometry
        // As origin is topleft corner in 2D, dimensions are calculated towards bottom right corner, thus y axis is downwards
        const center = new Vector3(this.dimensions.x * 0.5, -this.dimensions.y * 0.5, HolographicSlate.SLATE_DEPTH);
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
        const faceUV = new Array(6).fill(new Vector4(0, 0, 1, 1));
        if (scene.useRightHandedSystem) {
            faceUV[0].copyFromFloats(0, 1, 1, 0);
        }
        this._contentPlate = CreateBox("contentPlate_" + this.name, { size: 1, faceUV }, scene);

        this._titleBar.parent = node;
        this._titleBar.isNearGrabbable = true;
        this._contentPlate.parent = node;
        this._attachContentPlateBehavior();

        this._addControl(this._followButton);
        this._addControl(this._closeButton);

        const followButtonMesh = this._followButton.mesh!;
        const closeButtonMesh = this._closeButton.mesh!;
        followButtonMesh.parent = node;
        closeButtonMesh.parent = node;

        this._positionElements();

        this._followButton.imageUrl = HolographicSlate.ASSETS_BASE_URL + HolographicSlate.FOLLOW_ICON_FILENAME;
        this._closeButton.imageUrl = HolographicSlate.ASSETS_BASE_URL + HolographicSlate.CLOSE_ICON_FILENAME;

        this._followButton.isBackplateVisible = false;
        this._closeButton.isBackplateVisible = false;

        this._followButton.onPointerClickObservable.add(() => {
            this._defaultBehavior.followBehaviorEnabled = !this._defaultBehavior.followBehaviorEnabled;
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
            worldDimensions.set(this.dimensions.x, this.dimensions.y, HolographicSlate.SLATE_DEPTH);
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

        this._pickedPointObserver = this._host.onPickedPointChangedObservable.add((pickedPoint) => {
            // if (pickedPoint) {
            //     this._titleBarMaterial.globalLeftIndexTipPosition = pickedPoint;
            //     this._titleBarMaterial.hoverColor.a = 1.0;
            // } else {
            //     this._titleBarMaterial.hoverColor.a = 0;
            // }
        });

        this._contentMaterial = new FluentMaterial(this.name + "contentMaterial", mesh.getScene());
        this._contentMaterial.renderBorders = true;

        this._titleBar.material = this._titleBarMaterial;
        this._contentPlate.material = this._contentMaterial;

        this._resetContent();
        this._applyContentViewport();
    }

    /** @hidden **/
    public _prepareNode(scene: Scene): void {
        super._prepareNode(scene);
        this._gizmo = new SlateGizmo(this._host.utilityLayer!);
        this._gizmo.attachedSlate = this;
        this._defaultBehavior = new DefaultBehavior();
        this._defaultBehavior.attach(this.node as Mesh, [this._titleBar]);

        this._positionChangedObserver = this._defaultBehavior.sixDofDragBehavior.onPositionChangedObservable.add(() => {
            this._gizmo.updateBoundingBox();
        });

        this._updatePivot();
        this.resetDefaultAspectAndPose();
    }

    /**
     * Resets the aspect and pose of the slate so it is right in front of the active camera, facing towards it.
     */
    public resetDefaultAspectAndPose() {
        if (!this._host || !this._host.utilityLayer || !this.node) {
            return;
        }
        const scene = this._host.utilityLayer.utilityLayerScene;
        const camera = scene.activeCamera;
        if (camera) {
            const worldMatrix = camera.getWorldMatrix();
            const backward = Vector3.TransformNormal(Vector3.Backward(scene.useRightHandedSystem), worldMatrix);
            this.dimensions.copyFrom(this.defaultDimensions);
            this.origin.setAll(0);
            this._gizmo.updateBoundingBox();
            const pivot = this.node.getAbsolutePivotPoint();
            this.node.position.copyFrom(camera.position).subtractInPlace(backward).subtractInPlace(pivot);
            this.node.rotationQuaternion = Quaternion.FromLookDirectionLH(backward, new Vector3(0, 1, 0));
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
        this._contentPlate.dispose();

        this._followButton.dispose();
        this._closeButton.dispose();

        this._host.onPickedPointChangedObservable.remove(this._pickedPointObserver);
        this._defaultBehavior.sixDofDragBehavior.onPositionChangedObservable.remove(this._positionChangedObserver);

        this._defaultBehavior.detach();
        this._gizmo.dispose();
        this._contentDragBehavior.detach();
    }
}
