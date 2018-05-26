module BABYLON {
    /**
     * Helps setup gizmo's in the scene to rotate/scale/position meshes
     */
    export class GizmoManager {
        /**
         * Instatiates a gizmo manager
         * @param scene the scene to overlay the gizmos on top of
         * @param options If only a single gizmo should exist at one time
         */
        constructor(scene:Scene, options?:{singleGizmo?:boolean}){
            var gizmoLayer = new BABYLON.UtilityLayerRenderer(scene);

            // Options parsing
            if(!options){
                options = {}
            }
            if(options.singleGizmo === undefined){
                options.singleGizmo = true;
            }
            
            // Set of gizmos that are currently in the scene for each mesh
            var gizmoSet:{[meshID: string]: {positionGizmo: PositionGizmo, rotationGizmo: RotationGizmo}} = {}
            var clearGizmos = ()=>{
                for(var key in gizmoSet){
                    gizmoSet[key].positionGizmo.dispose();
                    gizmoSet[key].rotationGizmo.dispose();
                    delete gizmoSet[key];
                }
            }

            // Instatiate/dispose gizmos based on pointer actions
            scene.onPointerObservable.add((pointerInfo, state)=>{
                if(pointerInfo.type == BABYLON.PointerEventTypes.POINTERDOWN){
                    if(pointerInfo.pickInfo && pointerInfo.pickInfo.pickedMesh){
                        if(!gizmoSet[pointerInfo.pickInfo.pickedMesh.uniqueId]){
                            if(options!.singleGizmo){
                                clearGizmos();
                            }                            
                            // Enable gizmo when mesh is selected
                            gizmoSet[pointerInfo.pickInfo.pickedMesh.uniqueId] = {positionGizmo: new PositionGizmo(gizmoLayer), rotationGizmo: new RotationGizmo(gizmoLayer)}
                            gizmoSet[pointerInfo.pickInfo.pickedMesh.uniqueId].positionGizmo.attachedMesh = pointerInfo.pickInfo.pickedMesh;
                            gizmoSet[pointerInfo.pickInfo.pickedMesh.uniqueId].rotationGizmo.attachedMesh = pointerInfo.pickInfo.pickedMesh;
                        }else{
                            if(!options!.singleGizmo){
                                // Disable gizmo when clicked again
                                gizmoSet[pointerInfo.pickInfo.pickedMesh.uniqueId].positionGizmo.dispose();
                                gizmoSet[pointerInfo.pickInfo.pickedMesh.uniqueId].rotationGizmo.dispose();
                                delete gizmoSet[pointerInfo.pickInfo.pickedMesh.uniqueId];
                            }
                        }
                    }else {
                        if(options!.singleGizmo){
                            // Disable gizmo when clicked away
                            if(pointerInfo.pickInfo && pointerInfo.pickInfo.ray){
                                var gizmoPick = gizmoLayer.utilityLayerScene.pickWithRay(pointerInfo.pickInfo.ray);
                                if(gizmoPick && !gizmoPick.hit){
                                    clearGizmos();
                                }
                            }
                        }
                    }
                }
            })
        }
    }
}