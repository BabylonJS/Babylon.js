module BABYLON {
    /**
     * Helps setup gizmo's in the scene to rotate/scale/position meshes
     */
    export class GizmoManager implements IDisposable{
        /**
         * Gizmo's created by the gizmo manager, gizmo will be null until gizmo has been enabled for the first time
         */
        public gizmos: {positionGizmo: Nullable<PositionGizmo>, rotationGizmo: Nullable<RotationGizmo>, scaleGizmo: Nullable<ScaleGizmo>, boundingBoxGizmo: Nullable<BoundingBoxGizmo>};
        private _gizmosEnabled = {positionGizmo: false, rotationGizmo: false, scaleGizmo: false, boundingBoxGizmo: false};
        private _pointerObserver: Nullable<Observer<PointerInfo>> = null;
        private _attachedMesh: Nullable<AbstractMesh> = null;
        private _boundingBoxColor = BABYLON.Color3.FromHexString("#0984e3");
        private _defaultUtilityLayer: UtilityLayerRenderer;
        private _defaultKeepDepthUtilityLayer: UtilityLayerRenderer;
        /**
         * When bounding box gizmo is enabled, this can be used to track drag/end events
         */
        public boundingBoxDragBehavior = new BABYLON.SixDofDragBehavior();
        /**
         * Array of meshes which will have the gizmo attached when a pointer selected them. If null, all meshes are attachable. (Default: null)
         */
        public attachableMeshes: Nullable<Array<AbstractMesh>> = null;
        /**
         * If pointer events should perform attaching/detaching a gizmo, if false this can be done manually via attachToMesh. (Default: true)
         */
        public usePointerToAttachGizmos = true;

        /**
         * Instatiates a gizmo manager
         * @param scene the scene to overlay the gizmos on top of
         */
        constructor(private scene: Scene) {
            this._defaultKeepDepthUtilityLayer = new UtilityLayerRenderer(scene);
            this._defaultKeepDepthUtilityLayer.utilityLayerScene.autoClearDepthAndStencil = false;
            this._defaultUtilityLayer = new UtilityLayerRenderer(scene);

            this.gizmos = {positionGizmo: null, rotationGizmo: null, scaleGizmo: null, boundingBoxGizmo: null};

            // Instatiate/dispose gizmos based on pointer actions
            this._pointerObserver = scene.onPointerObservable.add((pointerInfo, state) => {
                if (!this.usePointerToAttachGizmos) {
                    return;
                }
                if (pointerInfo.type == BABYLON.PointerEventTypes.POINTERDOWN) {
                    if (pointerInfo.pickInfo && pointerInfo.pickInfo.pickedMesh) {
                        var node: Nullable<Node> = pointerInfo.pickInfo.pickedMesh;
                        if (this.attachableMeshes == null) {
                            // Attach to the most parent node
                            while (node && node.parent != null) {
                                node = node.parent;
                            }
                        }else {
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
                            this.attachToMesh(null);
                        }
                    }else {
                        this.attachToMesh(null);
                    }
                }
            });
        }

        /**
         * Attaches a set of gizmos to the specified mesh
         * @param mesh The mesh the gizmo's should be attached to
         */
        public attachToMesh(mesh: Nullable<AbstractMesh>) {
            if (this._attachedMesh) {
                this._attachedMesh.removeBehavior(this.boundingBoxDragBehavior);
            }
            this._attachedMesh = mesh;
            for (var key in this.gizmos) {
                var gizmo = <Nullable<Gizmo>>((<any>this.gizmos)[key]);
                if (gizmo && (<any>this._gizmosEnabled)[key]) {
                    gizmo.attachedMesh = mesh;
                }
            }
            if (this.boundingBoxGizmoEnabled && this._attachedMesh) {
                this._attachedMesh.addBehavior(this.boundingBoxDragBehavior);
            }
        }

        /**
         * If the position gizmo is enabled
         */
        public set positionGizmoEnabled(value: boolean) {
            if (value) {
                if (!this.gizmos.positionGizmo) {
                    this.gizmos.positionGizmo = new PositionGizmo(this._defaultUtilityLayer);
                }
                this.gizmos.positionGizmo.attachedMesh = this._attachedMesh;
            }else if (this.gizmos.positionGizmo) {
                this.gizmos.positionGizmo.attachedMesh = null;
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
                    this.gizmos.rotationGizmo = new RotationGizmo(this._defaultUtilityLayer);
                }
                this.gizmos.rotationGizmo.attachedMesh = this._attachedMesh;
            }else if (this.gizmos.rotationGizmo) {
                this.gizmos.rotationGizmo.attachedMesh = null;
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
                this.gizmos.scaleGizmo = this.gizmos.scaleGizmo || new ScaleGizmo(this._defaultUtilityLayer);
                this.gizmos.scaleGizmo.attachedMesh = this._attachedMesh;
            }else if (this.gizmos.scaleGizmo) {
                this.gizmos.scaleGizmo.attachedMesh = null;
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
                this.gizmos.boundingBoxGizmo.attachedMesh = this._attachedMesh;
                if (this._attachedMesh) {
                    this._attachedMesh.removeBehavior(this.boundingBoxDragBehavior);
                    this._attachedMesh.addBehavior(this.boundingBoxDragBehavior);
                }
            }else if (this.gizmos.boundingBoxGizmo) {
                this.gizmos.boundingBoxGizmo.attachedMesh = null;
            }
            this._gizmosEnabled.boundingBoxGizmo = value;
        }
        public get boundingBoxGizmoEnabled(): boolean {
            return this._gizmosEnabled.boundingBoxGizmo;
        }

        /**
         * Disposes of the gizmo manager
         */
        public dispose() {
            this.scene.onPointerObservable.remove(this._pointerObserver);
            for (var key in this.gizmos) {
                var gizmo = <Nullable<Gizmo>>((<any>this.gizmos)[key]);
                if (gizmo) {
                    gizmo.dispose();
                }
            }
            this._defaultKeepDepthUtilityLayer.dispose();
            this._defaultUtilityLayer.dispose();
            this.boundingBoxDragBehavior.detach();
        }
    }
}