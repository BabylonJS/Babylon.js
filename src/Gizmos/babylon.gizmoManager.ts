module BABYLON {
    /**
     * Helps setup gizmo's in the scene to rotate/scale/position meshes
     */
    export class GizmoManager implements IDisposable{
        private _gizmoSet:{positionGizmo: Nullable<PositionGizmo>, rotationGizmo: Nullable<RotationGizmo>, scaleGizmo: Nullable<ScaleGizmo>, boundingBoxGizmo: Nullable<BoundingBoxGizmo>};
        private _gizmoLayer:UtilityLayerRenderer;
        private _pointerObserver:Nullable<Observer<PointerInfo>> = null;
        private _attachedMesh:Nullable<AbstractMesh> = null;
        private _boundingBoxColor = BABYLON.Color3.FromHexString("#0984e3");
        private _boundingBoxUtilLayer:Nullable<UtilityLayerRenderer> = null;
        private _dragBehavior = new BABYLON.SixDofDragBehavior();
        /**
         * Array of meshes which will have the gizmo attached when a pointer selected them. If null, all meshes are attachable. (Default: null)
         */
        public attachableMeshes:Nullable<Array<AbstractMesh>> = null;
        /**
         * If pointer events should perform attaching/detaching a gizmo, if false this can be done manually via attachToMesh. (Default: true)
         */
        public usePointerToAttachGizmos = true;

        /**
         * Instatiates a gizmo manager
         * @param scene the scene to overlay the gizmos on top of
         */
        constructor(private scene:Scene){
            this._gizmoSet = {positionGizmo: null, rotationGizmo: null, scaleGizmo: null, boundingBoxGizmo: null};

            // Instatiate/dispose gizmos based on pointer actions
            this._pointerObserver = scene.onPointerObservable.add((pointerInfo, state)=>{
                if(!this.usePointerToAttachGizmos){
                    return;
                }
                if(pointerInfo.type == BABYLON.PointerEventTypes.POINTERDOWN){
                    if(pointerInfo.pickInfo && pointerInfo.pickInfo.pickedMesh){
                        var node:Nullable<Node> = pointerInfo.pickInfo.pickedMesh;
                        if(this.attachableMeshes == null){
                            // Attach to the most parent node
                            while(node && node.parent != null){
                                node = node.parent;
                            }
                        }else{
                            // Attach to the parent node that is an attachableMesh
                            var found = false;
                            this.attachableMeshes.forEach((mesh)=>{
                                if(node && (node == mesh || node.isDescendantOf(mesh))){
                                    node = mesh;
                                    found = true;
                                }
                            })
                            if(!found){
                                node = null;
                            }
                        }
                        if(node instanceof AbstractMesh){
                            this.attachToMesh(node);
                        }
                    }else{
                        this.attachToMesh(null);
                    }
                }
            })
        }

        /**
         * Attaches a set of gizmos to the specified mesh
         * @param mesh The mesh the gizmo's should be attached to
         */
        public attachToMesh(mesh:Nullable<AbstractMesh>){
            if(this._attachedMesh){
                this._attachedMesh.removeBehavior(this._dragBehavior);
            }
            this._attachedMesh = mesh;
            for(var key in this._gizmoSet){
                var gizmo = <Nullable<Gizmo>>((<any>this._gizmoSet)[key]);
                if(gizmo){
                    gizmo.attachedMesh = mesh;
                }
            }
            if(this.boundingBoxGizmoEnabled && this._attachedMesh){
                this._attachedMesh.addBehavior(this._dragBehavior);
            }
        }

        /**
         * If the position gizmo is enabled
         */
        public set positionGizmoEnabled(value:boolean){
            if(value){
                this._gizmoSet.positionGizmo = this._gizmoSet.positionGizmo || new PositionGizmo();
                this._gizmoSet.positionGizmo.updateGizmoRotationToMatchAttachedMesh = false;
                this._gizmoSet.positionGizmo.attachedMesh = this._attachedMesh;
            }else if(this._gizmoSet.positionGizmo){
                this._gizmoSet.positionGizmo.dispose();
                this._gizmoSet.positionGizmo = null;
            }
        }
        public get positionGizmoEnabled():boolean{
            return this._gizmoSet.positionGizmo != null;
        }
        /**
         * If the rotation gizmo is enabled
         */
        public set rotationGizmoEnabled(value:boolean){
            if(value){
                this._gizmoSet.rotationGizmo = this._gizmoSet.rotationGizmo || new RotationGizmo();
                this._gizmoSet.rotationGizmo.updateGizmoRotationToMatchAttachedMesh = false;
                this._gizmoSet.rotationGizmo.attachedMesh = this._attachedMesh;
            }else if(this._gizmoSet.rotationGizmo){
                this._gizmoSet.rotationGizmo.dispose();
                this._gizmoSet.rotationGizmo = null;
            }
        }
        public get rotationGizmoEnabled():boolean{
            return this._gizmoSet.rotationGizmo != null;
        }
        /**
         * If the scale gizmo is enabled
         */
        public set scaleGizmoEnabled(value:boolean){
            if(value){
                this._gizmoSet.scaleGizmo = this._gizmoSet.scaleGizmo || new ScaleGizmo();
                this._gizmoSet.scaleGizmo.attachedMesh = this._attachedMesh;
            }else if(this._gizmoSet.scaleGizmo){
                this._gizmoSet.scaleGizmo.dispose();
                this._gizmoSet.scaleGizmo = null;
            }
        }
        public get scaleGizmoEnabled():boolean{
            return this._gizmoSet.scaleGizmo != null;
        }
        /**
         * If the boundingBox gizmo is enabled
         */
        public set boundingBoxGizmoEnabled(value:boolean){
            if(value){
                if(!this._boundingBoxUtilLayer){
                    this._boundingBoxUtilLayer = new BABYLON.UtilityLayerRenderer(this.scene);
                    this._boundingBoxUtilLayer.utilityLayerScene.autoClearDepthAndStencil = false;
                }
                this._gizmoSet.boundingBoxGizmo = this._gizmoSet.boundingBoxGizmo || new BoundingBoxGizmo(this._boundingBoxColor, this._boundingBoxUtilLayer);
                this._gizmoSet.boundingBoxGizmo.attachedMesh = this._attachedMesh;
                if(this._attachedMesh){
                    this._attachedMesh.removeBehavior(this._dragBehavior);
                    this._attachedMesh.addBehavior(this._dragBehavior);
                }
            }else if(this._gizmoSet.boundingBoxGizmo){
                this._gizmoSet.boundingBoxGizmo.dispose();
                this._gizmoSet.boundingBoxGizmo = null;
            }
        }
        public get boundingBoxGizmoEnabled():boolean{
            return this._gizmoSet.boundingBoxGizmo != null;
        }

        /**
         * Disposes of the gizmo manager
         */
        public dispose(){
            this.scene.onPointerObservable.remove(this._pointerObserver);
            for(var key in this._gizmoSet){
                var gizmo = <Nullable<Gizmo>>((<any>this._gizmoSet)[key]);
                if(gizmo){
                    gizmo.dispose();
                }
            }
            this._gizmoLayer.dispose();
        }
    }
}