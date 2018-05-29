module BABYLON {
    /**
     * Helps setup gizmo's in the scene to rotate/scale/position meshes
     */
    export class GizmoManager implements IDisposable{

        private _gizmoLayer:UtilityLayerRenderer;
        // Set of gizmos that are currently in the scene for each mesh
        private _gizmoSet:{[meshID: string]: {positionGizmo: PositionGizmo, rotationGizmo: RotationGizmo}} = {}
        private _pointerObserver:Nullable<Observer<PointerInfo>> = null;

        /**
         * Instatiates a gizmo manager
         * @param scene the scene to overlay the gizmos on top of
         * @param options If only a single gizmo should exist at one time
         */
        constructor(private scene:Scene, options?:{singleGizmo?:boolean}){
            this._gizmoLayer = new UtilityLayerRenderer(scene);

            // Options parsing
            if(!options){
                options = {}
            }
            if(options.singleGizmo === undefined){
                options.singleGizmo = true;
            }

            // Instatiate/dispose gizmos based on pointer actions
            this._pointerObserver = scene.onPointerObservable.add((pointerInfo, state)=>{
                if(pointerInfo.type == BABYLON.PointerEventTypes.POINTERDOWN){
                    if(pointerInfo.pickInfo && pointerInfo.pickInfo.pickedMesh){
                        if(!this._gizmoSet[pointerInfo.pickInfo.pickedMesh.uniqueId]){
                            if(options!.singleGizmo){
                                this._clearGizmos();
                            }                            
                            // Enable gizmo when mesh is selected
                            this._gizmoSet[pointerInfo.pickInfo.pickedMesh.uniqueId] = {positionGizmo: new PositionGizmo(this._gizmoLayer), rotationGizmo: new RotationGizmo(this._gizmoLayer)}
                            this._gizmoSet[pointerInfo.pickInfo.pickedMesh.uniqueId].positionGizmo.attachedMesh = pointerInfo.pickInfo.pickedMesh;
                            this._gizmoSet[pointerInfo.pickInfo.pickedMesh.uniqueId].rotationGizmo.attachedMesh = pointerInfo.pickInfo.pickedMesh;
                        }else{
                            if(!options!.singleGizmo){
                                // Disable gizmo when clicked again
                                this._gizmoSet[pointerInfo.pickInfo.pickedMesh.uniqueId].positionGizmo.dispose();
                                this._gizmoSet[pointerInfo.pickInfo.pickedMesh.uniqueId].rotationGizmo.dispose();
                                delete this._gizmoSet[pointerInfo.pickInfo.pickedMesh.uniqueId];
                            }
                        }
                    }else {
                        if(options!.singleGizmo){
                            // Disable gizmo when clicked away
                            if(pointerInfo.pickInfo && pointerInfo.pickInfo.ray){
                                var gizmoPick = this._gizmoLayer.utilityLayerScene.pickWithRay(pointerInfo.pickInfo.ray);
                                if(gizmoPick && !gizmoPick.hit){
                                    this._clearGizmos();
                                }
                            }
                        }
                    }
                }
            })
        }

        /**
         * Disposes of the gizmo manager
         */
        public dispose(){
            this.scene.onPointerObservable.remove(this._pointerObserver);
            this._clearGizmos();
            this._gizmoLayer.dispose();
        }

        private _clearGizmos(){
            for(var key in this._gizmoSet){
                this._gizmoSet[key].positionGizmo.dispose();
                this._gizmoSet[key].rotationGizmo.dispose();
                delete this._gizmoSet[key];
            }
        }
    }
}