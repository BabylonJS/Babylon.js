module BABYLON {
    /**
     * Renders gizmos on top of an existing scene which provide controls for position, rotation, etc.
     */
    export class Gizmo implements IDisposable {
        /**
         * The root mesh of the gizmo
         */
        protected _rootMesh:Mesh;
        /**
         * Mesh that the gizmo will be attached to. (eg. on a drag gizmo the mesh that will be dragged)
         */
        public attachedMesh:Nullable<Mesh>;
        private _beforeRenderObserver:Nullable<Observer<Scene>>;
        /**
         * Creates a gizmo
         * @param gizmoLayer The utility layer the gizmo will be added to
         */
        constructor(/** The utility layer the gizmo will be added to */ public gizmoLayer:UtilityLayerRenderer){
            this._rootMesh = new BABYLON.Mesh("gizmoRootNode",gizmoLayer.utilityLayerScene);
            this._beforeRenderObserver = this.gizmoLayer.utilityLayerScene.onBeforeRenderObservable.add(()=>{
                if(this.gizmoLayer.utilityLayerScene.activeCamera && this.attachedMesh){
                    var dist = this.attachedMesh.position.subtract(this.gizmoLayer.utilityLayerScene.activeCamera.position).length()/5;
                    this._rootMesh.scaling.set(dist, dist, dist);
                }
                if(this.attachedMesh){
                    this._rootMesh.position.copyFrom(this.attachedMesh.position);
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