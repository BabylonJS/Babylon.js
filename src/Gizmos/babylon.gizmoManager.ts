module BABYLON {
    // export enum GizmoManagerMode {
    //     GUMBALL,
    //     BOUNDING_BOX
    // }
    // export class GizmoManager {
    //     gizmoLayer:UtilityLayerRenderer
    //     constructor(private scene:Scene, private options?:{mode?:GizmoManagerMode,singleGizmo?:boolean}){
    //         this.gizmoLayer = new BABYLON.UtilityLayerRenderer(scene);

    //         // options parsing
    //         if(!options){
    //             options = {}
    //         }
    //         if(!options.mode){
    //             options.mode = GizmoManagerMode.GUMBALL
    //         }
    //         if(!options.singleGizmo){
    //             options.singleGizmo = true;
    //         }
    //         if(options.singleGizmo){
    //             this.gizmoLayer.shouldRender=false;
    //         }

    //         var positionGizmo = new PositionGizmo(this.gizmoLayer)
    //         var rotationGizmo = new RotationGizmo(this.gizmoLayer)
            
    //         scene.onPointerObservable.add((pointerInfo, state)=>{
    //             if(pointerInfo.type == BABYLON.PointerEventTypes.POINTERDOWN){
    //                 if(pointerInfo.pickInfo && pointerInfo.pickInfo.pickedMesh){
    //                     // Enable gizmo when mesh is selected
    //                     positionGizmo.attachedMesh = pointerInfo.pickInfo.pickedMesh;
    //                     rotationGizmo.attachedMesh = pointerInfo.pickInfo.pickedMesh;
    //                     this.gizmoLayer.shouldRender=true;
    //                     positionGizmo.interactionsEnabled = true;
    //                     rotationGizmo.interactionsEnabled = true;
    //                 }else {
    //                     // Disable gizmo when clicked away
    //                     if(pointerInfo.pickInfo && pointerInfo.pickInfo.ray){
    //                         var gizmoPick = this.gizmoLayer.utilityLayerScene.pickWithRay(pointerInfo.pickInfo.ray)
    //                         if(gizmoPick && !gizmoPick.hit){
    //                             this.gizmoLayer.shouldRender=false;
    //                             positionGizmo.interactionsEnabled = false;
    //                             rotationGizmo.interactionsEnabled = false;
    //                         }
    //                     }
    //                 }
    //             }
    //         })
    //     }
    // }
}