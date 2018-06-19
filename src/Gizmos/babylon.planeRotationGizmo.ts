module BABYLON {
    /**
     * Single plane rotation gizmo
     */
    export class PlaneRotationGizmo extends Gizmo {
        private _dragBehavior:PointerDragBehavior;
        private _pointerObserver:Nullable<Observer<PointerInfo>> = null;
        /**
         * Creates a PlaneRotationGizmo
         * @param gizmoLayer The utility layer the gizmo will be added to
         * @param planeNormal The normal of the plane which the gizmo will be able to rotate on
         * @param color The color of the gizmo
         */
        constructor(gizmoLayer:UtilityLayerRenderer, planeNormal:Vector3, color:Color3){
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
            this._dragBehavior = new PointerDragBehavior({dragPlaneNormal: planeNormal});
            this._dragBehavior.moveAttached = false;
            this._rootMesh.addBehavior(this._dragBehavior);

            var lastDragPosition:Nullable<Vector3> = null;

            this._dragBehavior.onDragStartObservable.add((e)=>{
                if(!this.interactionsEnabled){
                    return;
                }
                lastDragPosition = e.dragPlanePoint;
            })

            var rotationMatrix = new Matrix();
            var planeNormalTowardsCamera = new Vector3();
            var localPlaneNormalTowardsCamera = new Vector3();
            this._dragBehavior.onDragObservable.add((event)=>{
                if(!this.interactionsEnabled){
                    return;
                }
                if(this.attachedMesh && lastDragPosition){
                    if(!this.attachedMesh.rotationQuaternion){
                        this.attachedMesh.rotationQuaternion = new BABYLON.Quaternion();
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
                    

                    // Convert angle and axis to quaternion (http://www.euclideanspace.com/maths/geometry/rotations/conversions/angleToQuaternion/index.htm)
                    var quaternionCoefficient = Math.sin(angle/2)
                    var amountToRotate = new BABYLON.Quaternion(planeNormalTowardsCamera.x*quaternionCoefficient,planeNormalTowardsCamera.y*quaternionCoefficient,planeNormalTowardsCamera.z*quaternionCoefficient,Math.cos(angle/2));

                    // Rotate selected mesh quaternion over fixed axis
                    this.attachedMesh.rotationQuaternion.multiplyToRef(amountToRotate,this.attachedMesh.rotationQuaternion);

                    lastDragPosition = event.dragPlanePoint;
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

        protected _onInteractionsEnabledChanged(value:boolean){
            this._dragBehavior.enabled = value;
        }

        /**
         * Disposes of the gizmo
         */
        public dispose(){
            this.gizmoLayer.utilityLayerScene.onPointerObservable.remove(this._pointerObserver);
            this._dragBehavior.detach();
            super.dispose();
        } 
    }
}