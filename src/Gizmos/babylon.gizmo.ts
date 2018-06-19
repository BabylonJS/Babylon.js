module BABYLON {
    /**
     * Renders gizmos on top of an existing scene which provide controls for position, rotation, etc.
     */
    export class Gizmo implements IDisposable {
        /**
         * The root mesh of the gizmo
         */
        protected _rootMesh:Mesh;
        private _attachedMesh:Nullable<AbstractMesh>;
        /**
         * Mesh that the gizmo will be attached to. (eg. on a drag gizmo the mesh that will be dragged)
         * * When set, interactions will be enabled
         */
        public get attachedMesh(){
            return this._attachedMesh;
        }
        public set attachedMesh(value){
            this._attachedMesh = value;
            if(this._attachedMesh){
                this.interactionsEnabled = true;
            }else{
                this.interactionsEnabled = false;
            }
        }
        /**
         * If set the gizmo's rotation will be updated to match the attached mesh each frame (Default: true)
         */
        public updateGizmoRotationToMatchAttachedMesh = true;
        /**
         * If set the gizmo's position will be updated to match the attached mesh each frame (Default: true)
         */
        public updateGizmoPositionToMatchAttachedMesh = true;
        /**
         * When set, the gizmo will always appear the same size no matter where the camera is (default: false)
         */
        protected _updateScale = true;
        protected _interactionsEnabled = true;
        protected _onInteractionsEnabledChanged(value:boolean){
        }

        /**
         * If interactions are enabled with this gizmo. (eg. dragging/rotation)
         */
        public set interactionsEnabled(value:boolean){
            this._interactionsEnabled = value;
            this._rootMesh.isVisible = value;
            this._rootMesh.getChildMeshes().forEach((m)=>{
                m.isVisible=value;
            })
            this._onInteractionsEnabledChanged(value);
        }
        public get interactionsEnabled(){
            return this._interactionsEnabled;
        }

        private _beforeRenderObserver:Nullable<Observer<Scene>>;
        
        /**
         * Creates a gizmo
         * @param gizmoLayer The utility layer the gizmo will be added to
         */
        constructor(/** The utility layer the gizmo will be added to */ public gizmoLayer:UtilityLayerRenderer){
            this._rootMesh = new BABYLON.Mesh("gizmoRootNode",gizmoLayer.utilityLayerScene);
            this._beforeRenderObserver = this.gizmoLayer.utilityLayerScene.onBeforeRenderObservable.add(()=>{
                if(this._updateScale && this.gizmoLayer.utilityLayerScene.activeCamera && this.attachedMesh){
                    var dist = this.attachedMesh.position.subtract(this.gizmoLayer.utilityLayerScene.activeCamera.position).length()/3;
                    this._rootMesh.scaling.set(dist, dist, dist);
                }
                if(this.attachedMesh){
                    if(this.updateGizmoRotationToMatchAttachedMesh){
                        if(!this._rootMesh.rotationQuaternion){
                            this._rootMesh.rotationQuaternion = new BABYLON.Quaternion();
                        }
                        Quaternion.FromRotationMatrixToRef(this.attachedMesh.getWorldMatrix().getRotationMatrix(), this._rootMesh.rotationQuaternion);
                    }
                    if(this.updateGizmoPositionToMatchAttachedMesh){
                        this._rootMesh.position.copyFrom(this.attachedMesh.absolutePosition);
                    }
                }
            })
        }
        /**
         * Disposes of the gizmo
         */
        public dispose(){
            this._rootMesh.dispose()
            if(this._beforeRenderObserver){
                this.gizmoLayer.utilityLayerScene.onBeforeRenderObservable.remove(this._beforeRenderObserver);
            }
        }
    }
}