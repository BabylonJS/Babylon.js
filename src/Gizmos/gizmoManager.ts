import { Observer, Observable } from "../Misc/observable";
import { Nullable } from "../types";
import { PointerInfo, PointerEventTypes } from "../Events/pointerEvents";
import { Scene, IDisposable } from "../scene";
import { Node } from "../node";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { Mesh } from '../Meshes/mesh';
import { UtilityLayerRenderer } from "../Rendering/utilityLayerRenderer";
import { Color3 } from '../Maths/math.color';
import { SixDofDragBehavior } from "../Behaviors/Meshes/sixDofDragBehavior";
import { Gizmo, GizmoAxisCache } from "./gizmo";
import { RotationGizmo } from "./rotationGizmo";
import { PositionGizmo } from "./positionGizmo";
import { ScaleGizmo } from "./scaleGizmo";
import { BoundingBoxGizmo } from "./boundingBoxGizmo";

/**
 * Helps setup gizmo's in the scene to rotate/scale/position nodes
 */
export class GizmoManager implements IDisposable {
    /**
     * Gizmo's created by the gizmo manager, gizmo will be null until gizmo has been enabled for the first time
     */
    public gizmos: { positionGizmo: Nullable<PositionGizmo>, rotationGizmo: Nullable<RotationGizmo>, scaleGizmo: Nullable<ScaleGizmo>, boundingBoxGizmo: Nullable<BoundingBoxGizmo> };

    /** When true, the gizmo will be detached from the current object when a pointer down occurs with an empty picked mesh */
    public clearGizmoOnEmptyPointerEvent = false;

    /** Fires an event when the manager is attached to a mesh */
    public onAttachedToMeshObservable = new Observable<Nullable<AbstractMesh>>();

    /** Fires an event when the manager is attached to a node */
    public onAttachedToNodeObservable = new Observable<Nullable<Node>>();

    private _gizmosEnabled = { positionGizmo: false, rotationGizmo: false, scaleGizmo: false, boundingBoxGizmo: false };
    private _pointerObservers: Observer<PointerInfo>[] = [];
    private _attachedMesh: Nullable<AbstractMesh> = null;
    private _attachedNode: Nullable<Node> = null;
    private _boundingBoxColor = Color3.FromHexString("#0984e3");
    private _defaultUtilityLayer: UtilityLayerRenderer;
    private _defaultKeepDepthUtilityLayer: UtilityLayerRenderer;
    private _thickness: number = 1;
    /** Node Caching for quick lookup */
    private _gizmoAxisCache: Map<Mesh, GizmoAxisCache> = new Map();
    /**
     * When bounding box gizmo is enabled, this can be used to track drag/end events
     */
    public boundingBoxDragBehavior = new SixDofDragBehavior();
    /**
     * Array of meshes which will have the gizmo attached when a pointer selected them. If null, all meshes are attachable. (Default: null)
     */
    public attachableMeshes: Nullable<Array<AbstractMesh>> = null;
    /**
     * Array of nodes which will have the gizmo attached when a pointer selected them. If null, all nodes are attachable. (Default: null)
     */
    public attachableNodes: Nullable<Array<Node>> = null;
    /**
     * If pointer events should perform attaching/detaching a gizmo, if false this can be done manually via attachToMesh/attachToNode. (Default: true)
     */
    public usePointerToAttachGizmos = true;

    /**
     * Utility layer that the bounding box gizmo belongs to
     */
    public get keepDepthUtilityLayer() {
        return this._defaultKeepDepthUtilityLayer;
    }

    /**
     * Utility layer that all gizmos besides bounding box belong to
     */
    public get utilityLayer() {
        return this._defaultUtilityLayer;
    }

    /**
     * True when the mouse pointer is hovering a gizmo mesh
     */
    public get isHovered() {
        var hovered = false;
        for (var key in this.gizmos) {
            var gizmo = <Nullable<Gizmo>>((<any>this.gizmos)[key]);
            if (gizmo && gizmo.isHovered) {
                hovered = true;
                break;
            }
        }
        return hovered;
    }

    /**
     * Instatiates a gizmo manager
     * @param scene the scene to overlay the gizmos on top of
     * @param thickness display gizmo axis thickness
     * @param utilityLayer the layer where gizmos are rendered
     * @param keepDepthUtilityLayer the layer where occluded gizmos are rendered
     */
    constructor(private scene: Scene, thickness: number = 1, utilityLayer: UtilityLayerRenderer = UtilityLayerRenderer.DefaultUtilityLayer, keepDepthUtilityLayer: UtilityLayerRenderer = UtilityLayerRenderer.DefaultKeepDepthUtilityLayer) {
        this._defaultUtilityLayer = utilityLayer;
        this._defaultKeepDepthUtilityLayer = keepDepthUtilityLayer;
        this._defaultKeepDepthUtilityLayer.utilityLayerScene.autoClearDepthAndStencil = false;
        this._thickness = thickness;
        this.gizmos = { positionGizmo: null, rotationGizmo: null, scaleGizmo: null, boundingBoxGizmo: null };

        const attachToMeshPointerObserver = this._attachToMeshPointerObserver(scene);
        const gizmoAxisPointerObserver = Gizmo.GizmoAxisPointerObserver(this._defaultUtilityLayer, this._gizmoAxisCache);
        this._pointerObservers = [attachToMeshPointerObserver, gizmoAxisPointerObserver];
    }

    /**
     * Subscribes to pointer down events, for attaching and detaching mesh
     * @param scene The sceme layer the observer will be added to
     */
    private _attachToMeshPointerObserver(scene: Scene): Observer<PointerInfo> {
        // Instatiate/dispose gizmos based on pointer actions
        const pointerObserver = scene.onPointerObservable.add((pointerInfo) => {
            if (!this.usePointerToAttachGizmos) {
                return;
            }
            if (pointerInfo.type == PointerEventTypes.POINTERDOWN) {
                if (pointerInfo.pickInfo && pointerInfo.pickInfo.pickedMesh) {
                    var node: Nullable<Node> = pointerInfo.pickInfo.pickedMesh;
                    if (this.attachableMeshes == null) {
                        // Attach to the most parent node
                        while (node && node.parent != null) {
                            node = node.parent;
                        }
                    } else {
                        // Attach to the parent node that is an attachableMesh
                        var found = false;
                        this.attachableMeshes.forEach((mesh) => {
                            if (node && (node == mesh || node.isDescendantOf(mesh))) {
                                node = mesh;
                                found = true;
                            }
                        });
                        if (!found) {
                            node = null;
                        }
                    }
                    if (node instanceof AbstractMesh) {
                        if (this._attachedMesh != node) {
                            this.attachToMesh(node);
                        }
                    } else {
                        if (this.clearGizmoOnEmptyPointerEvent) {
                            this.attachToMesh(null);
                        }
                    }
                } else {
                    if (this.clearGizmoOnEmptyPointerEvent) {
                        this.attachToMesh(null);
                    }
                }
            }
        });
        return pointerObserver!;
    }

    /**
     * Attaches a set of gizmos to the specified mesh
     * @param mesh The mesh the gizmo's should be attached to
     */
    public attachToMesh(mesh: Nullable<AbstractMesh>) {
        if (this._attachedMesh) {
            this._attachedMesh.removeBehavior(this.boundingBoxDragBehavior);
        }
        if (this._attachedNode) {
            this._attachedNode.removeBehavior(this.boundingBoxDragBehavior);
        }
        this._attachedMesh = mesh;
        this._attachedNode = null;
        for (var key in this.gizmos) {
            var gizmo = <Nullable<Gizmo>>((<any>this.gizmos)[key]);
            if (gizmo && (<any>this._gizmosEnabled)[key]) {
                gizmo.attachedMesh = mesh;
            }
        }
        if (this.boundingBoxGizmoEnabled && this._attachedMesh) {
            this._attachedMesh.addBehavior(this.boundingBoxDragBehavior);
        }
        this.onAttachedToMeshObservable.notifyObservers(mesh);
    }

    /**
     * Attaches a set of gizmos to the specified node
     * @param node The node the gizmo's should be attached to
     */
    public attachToNode(node: Nullable<Node>) {
        if (this._attachedMesh) {
            this._attachedMesh.removeBehavior(this.boundingBoxDragBehavior);
        }
        if (this._attachedNode) {
            this._attachedNode.removeBehavior(this.boundingBoxDragBehavior);
        }
        this._attachedMesh = null;
        this._attachedNode = node;
        for (var key in this.gizmos) {
            var gizmo = <Nullable<Gizmo>>((<any>this.gizmos)[key]);
            if (gizmo && (<any>this._gizmosEnabled)[key]) {
                gizmo.attachedNode = node;
            }
        }
        if (this.boundingBoxGizmoEnabled && this._attachedNode) {
            this._attachedNode.addBehavior(this.boundingBoxDragBehavior);
        }
        this.onAttachedToNodeObservable.notifyObservers(node);
    }

    /**
     * If the position gizmo is enabled
     */
    public set positionGizmoEnabled(value: boolean) {
        if (value) {
            if (!this.gizmos.positionGizmo) {
                this.gizmos.positionGizmo = new PositionGizmo(this._defaultUtilityLayer, this._thickness, this);
            }
            if (this._attachedNode) {
                this.gizmos.positionGizmo.attachedNode = this._attachedNode;
            } else {
                this.gizmos.positionGizmo.attachedMesh = this._attachedMesh;
            }
        } else if (this.gizmos.positionGizmo) {
            this.gizmos.positionGizmo.attachedNode = null;
        }
        this._gizmosEnabled.positionGizmo = value;
    }
    public get positionGizmoEnabled(): boolean {
        return this._gizmosEnabled.positionGizmo;
    }
    /**
     * If the rotation gizmo is enabled
     */
    public set rotationGizmoEnabled(value: boolean) {
        if (value) {
            if (!this.gizmos.rotationGizmo) {
                this.gizmos.rotationGizmo = new RotationGizmo(this._defaultUtilityLayer, 32, false, this._thickness, this);
            }
            if (this._attachedNode) {
                this.gizmos.rotationGizmo.attachedNode = this._attachedNode;
            } else {
                this.gizmos.rotationGizmo.attachedMesh = this._attachedMesh;
            }
        } else if (this.gizmos.rotationGizmo) {
            this.gizmos.rotationGizmo.attachedNode = null;
        }
        this._gizmosEnabled.rotationGizmo = value;
    }
    public get rotationGizmoEnabled(): boolean {
        return this._gizmosEnabled.rotationGizmo;
    }
    /**
     * If the scale gizmo is enabled
     */
    public set scaleGizmoEnabled(value: boolean) {
        if (value) {
            this.gizmos.scaleGizmo = this.gizmos.scaleGizmo || new ScaleGizmo(this._defaultUtilityLayer, this._thickness, this);
            if (this._attachedNode) {
                this.gizmos.scaleGizmo.attachedNode = this._attachedNode;
            } else {
                this.gizmos.scaleGizmo.attachedMesh = this._attachedMesh;
            }
        } else if (this.gizmos.scaleGizmo) {
            this.gizmos.scaleGizmo.attachedNode = null;
        }
        this._gizmosEnabled.scaleGizmo = value;
    }
    public get scaleGizmoEnabled(): boolean {
        return this._gizmosEnabled.scaleGizmo;
    }
    /**
     * If the boundingBox gizmo is enabled
     */
    public set boundingBoxGizmoEnabled(value: boolean) {
        if (value) {
            this.gizmos.boundingBoxGizmo = this.gizmos.boundingBoxGizmo || new BoundingBoxGizmo(this._boundingBoxColor, this._defaultKeepDepthUtilityLayer);
            if (this._attachedMesh) {
                this.gizmos.boundingBoxGizmo.attachedMesh = this._attachedMesh;
            } else {
                this.gizmos.boundingBoxGizmo.attachedNode = this._attachedNode;
            }

            if (this._attachedMesh) {
                this._attachedMesh.removeBehavior(this.boundingBoxDragBehavior);
                this._attachedMesh.addBehavior(this.boundingBoxDragBehavior);
            } else if (this._attachedNode) {
                this._attachedNode.removeBehavior(this.boundingBoxDragBehavior);
                this._attachedNode.addBehavior(this.boundingBoxDragBehavior);
            }
        } else if (this.gizmos.boundingBoxGizmo) {
            if (this._attachedMesh) {
                this._attachedMesh.removeBehavior(this.boundingBoxDragBehavior);
            } else if (this._attachedNode) {
                this._attachedNode.removeBehavior(this.boundingBoxDragBehavior);
            }
            this.gizmos.boundingBoxGizmo.attachedNode = null;
        }
        this._gizmosEnabled.boundingBoxGizmo = value;
    }
    public get boundingBoxGizmoEnabled(): boolean {
        return this._gizmosEnabled.boundingBoxGizmo;
    }

    /**
     * Builds Gizmo Axis Cache to enable features such as hover state preservation and graying out other axis during manipulation
     * @param gizmoAxisCache Gizmo axis definition used for reactive gizmo UI
     */
    public addToAxisCache(gizmoAxisCache: Map<Mesh, GizmoAxisCache>) {
        if (gizmoAxisCache.size > 0) {
            gizmoAxisCache.forEach((v, k) => {
                this._gizmoAxisCache.set(k, v);
            });
        }
    }

    /**
     * Disposes of the gizmo manager
     */
    public dispose() {

        this._pointerObservers.forEach((observer) => {
            this.scene.onPointerObservable.remove(observer);
        });
        for (var key in this.gizmos) {
            var gizmo = <Nullable<Gizmo>>((<any>this.gizmos)[key]);
            if (gizmo) {
                gizmo.dispose();
            }
        }
        this._defaultKeepDepthUtilityLayer.dispose();
        this._defaultUtilityLayer.dispose();
        this.boundingBoxDragBehavior.detach();
        this.onAttachedToMeshObservable.clear();
    }
}