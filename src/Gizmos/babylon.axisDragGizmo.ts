module BABYLON {
    /**
     * Single axis drag gizmo
     */
    export class AxisDragGizmo extends Gizmo {
        private _dragBehavior:PointerDragBehavior;
        /**
         * Creates an AxisDragGizmo
         * @param gizmoLayer The utility layer the gizmo will be added to
         * @param dragAxis The axis which the gizmo will be able to drag on
         * @param color The color of the gizmo
         */
        constructor(gizmoLayer:UtilityLayerRenderer, dragAxis:Vector3, color:Color3){
            super(gizmoLayer);

            // Create Material
            var coloredMaterial = new BABYLON.StandardMaterial("", gizmoLayer.utilityLayerScene);
            coloredMaterial.disableLighting = true;
            coloredMaterial.emissiveColor = color;

            // Build mesh on root node
            var arrowMesh = BABYLON.MeshBuilder.CreateCylinder("yPosMesh", {diameterTop:0, height: 2, tessellation: 96}, gizmoLayer.utilityLayerScene);
            var arrowTail = BABYLON.MeshBuilder.CreateCylinder("yPosMesh", {diameter:0.03, height: 0.2, tessellation: 96}, gizmoLayer.utilityLayerScene);
            this._rootMesh.addChild(arrowMesh);
            this._rootMesh.addChild(arrowTail);

            // Position arrow pointing in its drag axis
            arrowMesh.scaling.scaleInPlace(0.1);
            arrowMesh.material = coloredMaterial;
            arrowMesh.rotation.x = Math.PI/2;
            arrowMesh.position.z+=0.3;
            arrowTail.rotation.x = Math.PI/2;
            arrowTail.material = coloredMaterial;
            arrowTail.position.z+=0.2;
            this._rootMesh.lookAt(this._rootMesh.position.subtract(dragAxis));

            // Add drag behavior to handle events when the gizmo is dragged
            this._dragBehavior = new PointerDragBehavior({dragAxis: new BABYLON.Vector3(0,0,1)});
            this._dragBehavior.moveAttached = false;
            this._rootMesh.addBehavior(this._dragBehavior);
            this._dragBehavior.onDragObservable.add((event)=>{
                if(!this.interactionsEnabled){
                    return;
                }
                if(this.attachedMesh){
                    this.attachedMesh.position.addInPlace(event.delta);
                }
            })
        }
        protected _onInteractionsEnabledChanged(value:boolean){
            this._dragBehavior.enabled = value;
        }
        /**
         * Disposes of the gizmo
         */
        public dispose(){
            this._dragBehavior.detach();
            super.dispose();
        } 
    }
}