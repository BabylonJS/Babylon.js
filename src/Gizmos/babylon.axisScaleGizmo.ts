module BABYLON {
    /**
     * Single axis scale gizmo
     */
    export class AxisScaleGizmo extends Gizmo {
        /**
         * Drag behavior responsible for the gizmos dragging interactions
         */
        public dragBehavior:PointerDragBehavior;
        private _pointerObserver:Nullable<Observer<PointerInfo>> = null;
        /**
         * Scale distance in babylon units that the gizmo will snap to when dragged (Default: 0)
         */
        public snapDistance = 0;
        /**
         * Event that fires each time the gizmo snaps to a new location.
         * * snapDistance is the the change in distance
         */
        public onSnapObservable = new Observable<{snapDistance:number}>();
        /**
         * Creates an AxisScaleGizmo
         * @param gizmoLayer The utility layer the gizmo will be added to
         * @param dragAxis The axis which the gizmo will be able to scale on
         * @param color The color of the gizmo
         */
        constructor(dragAxis:Vector3, color:Color3 = Color3.Gray(), gizmoLayer:UtilityLayerRenderer = UtilityLayerRenderer.DefaultUtilityLayer){
            super(gizmoLayer);
            
            // Create Material
            var coloredMaterial = new BABYLON.StandardMaterial("", gizmoLayer.utilityLayerScene);
            coloredMaterial.disableLighting = true;
            coloredMaterial.emissiveColor = color;

            var hoverMaterial = new BABYLON.StandardMaterial("", gizmoLayer.utilityLayerScene);
            hoverMaterial.disableLighting = true;
            hoverMaterial.emissiveColor = color.add(new Color3(0.2,0.2,0.2));

            // Build mesh on root node
            var arrow = new BABYLON.AbstractMesh("", gizmoLayer.utilityLayerScene)
            var arrowMesh = BABYLON.MeshBuilder.CreateBox("yPosMesh", {size: 0.5}, gizmoLayer.utilityLayerScene);
            var arrowTail = BABYLON.MeshBuilder.CreateCylinder("yPosMesh", {diameter:0.015, height: 0.3, tessellation: 96}, gizmoLayer.utilityLayerScene);
            arrow.addChild(arrowMesh);
            arrow.addChild(arrowTail);

            // Position arrow pointing in its drag axis
            arrowMesh.scaling.scaleInPlace(0.1);
            arrowMesh.material = coloredMaterial;
            arrowMesh.rotation.x = Math.PI/2;
            arrowMesh.position.z+=0.3;
            arrowTail.rotation.x = Math.PI/2;
            arrowTail.material = coloredMaterial;
            arrowTail.position.z+=0.15;
            arrow.lookAt(this._rootMesh.position.subtract(dragAxis));
            this._rootMesh.addChild(arrow);

            // Add drag behavior to handle events when the gizmo is dragged
            this.dragBehavior = new PointerDragBehavior({dragAxis: dragAxis});
            this.dragBehavior.moveAttached = false;
            this._rootMesh.addBehavior(this.dragBehavior);

            var currentSnapDragDistance = 0;
            var tmpVector = new Vector3();
            var tmpSnapEvent = {snapDistance: 0};
            this.dragBehavior.onDragObservable.add((event)=>{                
                if(this.attachedMesh){
                    // Snapping logic
                    var snapped = false;
                    var dragSteps = 0;
                    if(this.snapDistance == 0){
                        dragAxis.scaleToRef(event.dragDistance, tmpVector);
                    }else{
                        currentSnapDragDistance+=event.dragDistance;
                        if(Math.abs(currentSnapDragDistance)>this.snapDistance){
                            dragSteps = Math.floor(currentSnapDragDistance/this.snapDistance);
                            currentSnapDragDistance = currentSnapDragDistance % this.snapDistance;
                            dragAxis.scaleToRef(this.snapDistance*dragSteps, tmpVector);
                            snapped = true;
                        }else{
                            tmpVector.scaleInPlace(0);
                        }
                    }
                    
                    this.attachedMesh.scaling.addInPlace(tmpVector);

                    if(snapped){
                        tmpSnapEvent.snapDistance = this.snapDistance*dragSteps;
                        this.onSnapObservable.notifyObservers(tmpSnapEvent);
                    }
                }
            })

            this._pointerObserver = gizmoLayer.utilityLayerScene.onPointerObservable.add((pointerInfo, eventState)=>{
                if(pointerInfo.pickInfo && (this._rootMesh.getChildMeshes().indexOf(<Mesh>pointerInfo.pickInfo.pickedMesh) != -1)){
                    this._rootMesh.getChildMeshes().forEach((m)=>{
                        m.material = hoverMaterial;
                    });
                }else{
                    this._rootMesh.getChildMeshes().forEach((m)=>{
                        m.material = coloredMaterial;
                    });
                }
            });
        }
        
        protected _attachedMeshChanged(value:Nullable<AbstractMesh>){
            if(this.dragBehavior){
                this.dragBehavior.enabled = value ? true : false;
            }
        }
        
        /**
         * Disposes of the gizmo
         */
        public dispose(){
            this.onSnapObservable.clear();
            this.gizmoLayer.utilityLayerScene.onPointerObservable.remove(this._pointerObserver);
            this.dragBehavior.detach();
            super.dispose();
        } 
    }
}