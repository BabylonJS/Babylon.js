module BABYLON {
    /**
     * Single plane rotation gizmo
     */
    export class PlaneRotationGizmo extends Gizmo {
        /**
         * Drag behavior responsible for the gizmos dragging interactions
         */
        public dragBehavior:PointerDragBehavior;
        private _pointerObserver:Nullable<Observer<PointerInfo>> = null;
        
        /**
         * Rotation distance in radians that the gizmo will snap to (Default: 0)
         */
        public snapDistance = 0;
        /**
         * Event that fires each time the gizmo snaps to a new location.
         * * snapDistance is the the change in distance
         */
        public onSnapObservable = new Observable<{snapDistance:number}>();

        /**
         * Creates a PlaneRotationGizmo
         * @param gizmoLayer The utility layer the gizmo will be added to
         * @param planeNormal The normal of the plane which the gizmo will be able to rotate on
         * @param color The color of the gizmo
         */
        constructor(planeNormal:Vector3, color:Color3 = Color3.Gray(), gizmoLayer:UtilityLayerRenderer = UtilityLayerRenderer.DefaultUtilityLayer){
            super(gizmoLayer);
            
            // Create Material
            var coloredMaterial = new BABYLON.StandardMaterial("", gizmoLayer.utilityLayerScene);
            coloredMaterial.disableLighting = true;
            coloredMaterial.emissiveColor = color;
            
            var hoverMaterial = new BABYLON.StandardMaterial("", gizmoLayer.utilityLayerScene);
            hoverMaterial.disableLighting = true;
            hoverMaterial.emissiveColor = color.add(new Color3(0.2,0.2,0.2));

            // Build mesh on root node
            var parentMesh = new BABYLON.AbstractMesh("", gizmoLayer.utilityLayerScene);
            var rotationMesh = BABYLON.Mesh.CreateTorus("torus", 3, 0.15, 20, gizmoLayer.utilityLayerScene, false);
            
            // Position arrow pointing in its drag axis
            rotationMesh.scaling.scaleInPlace(0.1);
            rotationMesh.material = coloredMaterial;
            rotationMesh.rotation.x = Math.PI/2;
            parentMesh.addChild(rotationMesh);
            parentMesh.lookAt(this._rootMesh.position.subtract(planeNormal));
            
            this._rootMesh.addChild(parentMesh);
            // Add drag behavior to handle events when the gizmo is dragged
            this.dragBehavior = new PointerDragBehavior({dragPlaneNormal: planeNormal});
            this.dragBehavior.moveAttached = false;
            this.dragBehavior.maxDragAngle =  Math.PI*9/20;
            this.dragBehavior._useAlternatePickedPointAboveMaxDragAngle = true;
            this._rootMesh.addBehavior(this.dragBehavior);

            var lastDragPosition = new Vector3();

            this.dragBehavior.onDragStartObservable.add((e)=>{
                if(this.attachedMesh){
                    lastDragPosition.copyFrom(e.dragPlanePoint);
                }
            })

            var rotationMatrix = new Matrix();
            var planeNormalTowardsCamera = new Vector3();
            var localPlaneNormalTowardsCamera = new Vector3();

            var tmpSnapEvent = {snapDistance: 0};
            var currentSnapDragDistance = 0;
            this.dragBehavior.onDragObservable.add((event)=>{
                if(this.attachedMesh){
                    if(!this.attachedMesh.rotationQuaternion){
                        this.attachedMesh.rotationQuaternion = Quaternion.RotationYawPitchRoll(this.attachedMesh.rotation.y, this.attachedMesh.rotation.x, this.attachedMesh.rotation.z);
                    }
                    // Calc angle over full 360 degree (https://stackoverflow.com/questions/43493711/the-angle-between-two-3d-vectors-with-a-result-range-0-360)
                    var newVector = event.dragPlanePoint.subtract(this.attachedMesh.position).normalize();
                    var originalVector = lastDragPosition.subtract(this.attachedMesh.position).normalize();
                    var cross = Vector3.Cross(newVector,originalVector);
                    var dot = Vector3.Dot(newVector,originalVector);
                    var angle = Math.atan2(cross.length(), dot);
                    planeNormalTowardsCamera.copyFrom(planeNormal);
                    localPlaneNormalTowardsCamera.copyFrom(planeNormal);
                    if(this.updateGizmoRotationToMatchAttachedMesh){
                        this.attachedMesh.rotationQuaternion.toRotationMatrix(rotationMatrix);
                        localPlaneNormalTowardsCamera = Vector3.TransformCoordinates(planeNormalTowardsCamera, rotationMatrix);
                    }
                    // Flip up vector depending on which side the camera is on
                    if(gizmoLayer.utilityLayerScene.activeCamera){
                        var camVec = gizmoLayer.utilityLayerScene.activeCamera.position.subtract(this.attachedMesh.position);
                        if(Vector3.Dot(camVec, localPlaneNormalTowardsCamera) > 0){
                            planeNormalTowardsCamera.scaleInPlace(-1);
                            localPlaneNormalTowardsCamera.scaleInPlace(-1);
                        }
                    }
                    var halfCircleSide = Vector3.Dot(localPlaneNormalTowardsCamera, cross) > 0.0;
                    if (halfCircleSide) angle = -angle;
                    
                    // Snapping logic
                    var snapped = false;
                    if(this.snapDistance != 0){
                        currentSnapDragDistance+=angle
                        if(Math.abs(currentSnapDragDistance)>this.snapDistance){
                            var dragSteps = Math.floor(currentSnapDragDistance/this.snapDistance);
                            currentSnapDragDistance = currentSnapDragDistance % this.snapDistance;
                            angle = this.snapDistance*dragSteps;
                            snapped = true;
                        }else{
                            angle = 0;
                        }
                    }
                     // Convert angle and axis to quaternion (http://www.euclideanspace.com/maths/geometry/rotations/conversions/angleToQuaternion/index.htm)
                     var quaternionCoefficient = Math.sin(angle/2)
                     var amountToRotate = new BABYLON.Quaternion(planeNormalTowardsCamera.x*quaternionCoefficient,planeNormalTowardsCamera.y*quaternionCoefficient,planeNormalTowardsCamera.z*quaternionCoefficient,Math.cos(angle/2));

                     if(this.updateGizmoRotationToMatchAttachedMesh){
                        // Rotate selected mesh quaternion over fixed axis
                        this.attachedMesh.rotationQuaternion.multiplyToRef(amountToRotate,this.attachedMesh.rotationQuaternion);
                     }else{
                         // Rotate selected mesh quaternion over rotated axis
                        amountToRotate.multiplyToRef(this.attachedMesh.rotationQuaternion,this.attachedMesh.rotationQuaternion);
                     }
                     

                    lastDragPosition.copyFrom(event.dragPlanePoint);
                    if(snapped){
                        tmpSnapEvent.snapDistance = angle;
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