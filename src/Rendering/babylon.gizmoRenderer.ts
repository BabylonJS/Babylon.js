module BABYLON {
    /**
     * Renders gizmos on top of an existing scene which provide controls for position, rotation, etc.
     */
    export class GizmoRenderer extends UtilityLayerRenderer{
        /**
         *  If the gizmo layer should automatically be rendered on top of existing scene
         */
        public shouldRender = true;

        private _afterRenderObservable:Nullable<Observer<Scene>>;
        private _gizmos:Array<Gizmo> = [];

        /**
         * Instantiates a GizmoRenderer
         * @param originalScene the scene the gizmo renderer should draw on top of
         */
        constructor(originalScene:Scene){
            super(originalScene);
            // Create position gizmo
            this._gizmos.push(new DragDirectionGizmo(this,new BABYLON.Vector3(0,1,0),BABYLON.Color3.FromHexString("#00b894")));
            this._gizmos.push(new DragDirectionGizmo(this,new BABYLON.Vector3(1,0,0),BABYLON.Color3.FromHexString("#d63031")));
            this._gizmos.push(new DragDirectionGizmo(this,new BABYLON.Vector3(0,0,1),BABYLON.Color3.FromHexString("#0984e3")));

            // Create rotation gizmo
            this._gizmos.push(new DragRotationGizmo(this,new BABYLON.Vector3(0,1,0),BABYLON.Color3.FromHexString("#00b894")));
            this._gizmos.push(new DragRotationGizmo(this,new BABYLON.Vector3(1,0,0),BABYLON.Color3.FromHexString("#d63031")));
            this._gizmos.push(new DragRotationGizmo(this,new BABYLON.Vector3(0,0,1),BABYLON.Color3.FromHexString("#0984e3")));

            // Create plane position gizmo
            this._gizmos.push(new DragPlaneGizmo(this,new BABYLON.Vector3(0,1,0),BABYLON.Color3.FromHexString("#705A8A")));
            this._gizmos.push(new DragPlaneGizmo(this,new BABYLON.Vector3(1,0,0),BABYLON.Color3.FromHexString("#059EBC")));
            this._gizmos.push(new DragPlaneGizmo(this,new BABYLON.Vector3(0,0,1),BABYLON.Color3.FromHexString("#6B7463")));
            
            this._updateCamera()
            this._afterRenderObservable = this.originalScene.onAfterRenderObservable.add(()=>{
                if(this.shouldRender){
                    this.render();
                }
            })
        }
        /**
         *  Disposes of the gizmo renderer
         */
        public dispose(){
            if(this._afterRenderObservable){
                this.originalScene.onAfterRenderObservable.remove(this._afterRenderObservable);
            }
            this._gizmos.forEach((g)=>{
                g.dispose();
            })
            super.dispose();
        }
    }

    class Gizmo implements IDisposable {
        protected _rootMesh:Mesh;
        protected _selectedMesh:Nullable<AbstractMesh> = null;
        protected _dragBehavior:Nullable<PointerDragBehavior>; // TODO should this be here?
        private _pointerObserver:Nullable<Observer<PointerInfo>>;
        private _beforeRenderObserver:Nullable<Observer<Scene>>;
        constructor(protected _renderer:UtilityLayerRenderer){
            // Set selected mesh when scene is clicked
            this._pointerObserver = this._renderer.utilityLayerScene.onPointerObservable.add((pointerInfo)=>{
                switch (pointerInfo.type) {
                    case BABYLON.PointerEventTypes.POINTERDOWN:
                        var pickResult = this._renderer.utilityLayerScene.pick(pointerInfo.event.offsetX, pointerInfo.event.offsetY);
                        if(pickResult && pickResult.hit && pickResult.pickedMesh){
                            // Do not change selected mesh if a gizmo is hit
                            break;
                        }
                        pickResult = this._renderer.originalScene.pick(pointerInfo.event.offsetX, pointerInfo.event.offsetY);
                        if (pickResult && pickResult.hit && pickResult.pickedMesh) {
                            this._selectedMesh = pickResult.pickedMesh;
                            if(this._dragBehavior){
                                this._dragBehavior._dragPlaneParent = <Mesh>this._selectedMesh;
                            }
                        }
                        break;
                }
            })

            // Update arrow position to that of the selected mesh but always at the same distance from the camera
            this._beforeRenderObserver = this._renderer.utilityLayerScene.onBeforeRenderObservable.add(()=>{
                if(this._selectedMesh && this._renderer.utilityLayerScene.activeCamera){
                    var camPos = this._renderer.utilityLayerScene.activeCamera.position;
                    var direction = this._selectedMesh.getAbsolutePosition().clone().subtract(camPos).normalize().scaleInPlace(3);
                    var newPose = camPos.add(direction);
                    this._rootMesh.position.copyFrom(newPose);
                }
            })
        }
        public dispose(){
            if(this._pointerObserver){
                this._renderer.utilityLayerScene.onPointerObservable.remove(this._pointerObserver);
            }
            if(this._beforeRenderObserver){
                this._renderer.utilityLayerScene.onBeforeRenderObservable.remove(this._beforeRenderObserver);
            }
            this._rootMesh.getChildMeshes().forEach((m)=>{
                m.dispose();
            })
            if(this._dragBehavior){
                this._rootMesh.removeBehavior(this._dragBehavior);
            }
            this._rootMesh.dispose();
        }
    }
    class DragDirectionGizmo extends Gizmo {
        constructor(renderer:UtilityLayerRenderer, dragAxis: Vector3, color: Color3){
            super(renderer);
             // Create Material
            var coloredMaterial = new BABYLON.StandardMaterial("", renderer.utilityLayerScene);
            coloredMaterial.emissiveColor = color;

            // Build mesh within a root node
            this._rootMesh = new BABYLON.Mesh("",renderer.utilityLayerScene)
            var arrowMesh = BABYLON.MeshBuilder.CreateCylinder("yPosMesh", {diameterTop:0, height: 2, tessellation: 96}, renderer.utilityLayerScene);
            var arrowTail = BABYLON.MeshBuilder.CreateCylinder("yPosMesh", {diameter:0.03, height: 0.2, tessellation: 96}, renderer.utilityLayerScene);
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
            this._dragBehavior = new PointerDragBehavior({axis: dragAxis});
            this._dragBehavior.moveAttached = false;
            this._rootMesh.addBehavior(this._dragBehavior);
            this._dragBehavior.onDragObservable.add((event)=>{
                if(this._selectedMesh){
                    this._selectedMesh.position.addInPlace(event.delta);
                }
            })
        }
    }
    class DragPlaneGizmo extends Gizmo {
        constructor(renderer:UtilityLayerRenderer, normal: Vector3, color: Color3){
            super(renderer);

            // Create Material
            var coloredMaterial = new BABYLON.StandardMaterial("", renderer.utilityLayerScene);
            coloredMaterial.emissiveColor = color;

            // Build mesh within a root node
            this._rootMesh = new BABYLON.Mesh("",renderer.utilityLayerScene);
            var planeMesh = BABYLON.Mesh.CreatePlane("plane", 1.0, renderer.utilityLayerScene, false, Mesh.DOUBLESIDE);
            this._rootMesh.addChild(planeMesh);

            // Position pointing at normal
            planeMesh.scaling.scaleInPlace(0.1);
            planeMesh.material = coloredMaterial;
            planeMesh.lookAt(this._rootMesh.position.subtract(normal));
            planeMesh.position.addInPlace(normal.subtract(new Vector3(1,1,1)).scale(-0.1));
            
            // Add drag behavior to handle events when the gizmo is dragged
            this._dragBehavior = new PointerDragBehavior({normal: normal});
            this._dragBehavior.moveAttached = false;
            this._rootMesh.addBehavior(this._dragBehavior);
            this._dragBehavior.onDragObservable.add((event)=>{
                if(this._selectedMesh){
                    this._selectedMesh.position.addInPlace(event.delta);
                }
            })
        }
    }
    class DragRotationGizmo extends Gizmo {
        constructor(renderer:UtilityLayerRenderer, normal: Vector3, color: Color3){
            super(renderer);
            // Create Material
            var coloredMaterial = new BABYLON.StandardMaterial("", renderer.utilityLayerScene);
            coloredMaterial.emissiveColor = color;

            // Build mesh within a root node
            this._rootMesh = new BABYLON.Mesh("",renderer.utilityLayerScene);
            var rotationMesh = BABYLON.Mesh.CreateTorus("torus", 5, 0.2, 20, renderer.utilityLayerScene, false);
            this._rootMesh.addChild(rotationMesh);

            // Position pointing at normal
            rotationMesh.scaling.scaleInPlace(0.1);
            rotationMesh.material = coloredMaterial;
            rotationMesh.rotation.x = Math.PI/2;
            this._rootMesh.lookAt(this._rootMesh.position.subtract(normal));

            // Add drag behavior to handle events when the gizmo is dragged
            this._dragBehavior = new PointerDragBehavior({normal: normal});
            this._dragBehavior.moveAttached = false;
            this._rootMesh.addBehavior(this._dragBehavior);

            var lastDragPosition:Nullable<Vector3> = null;
            this._dragBehavior.onDragStartObservable.add((e)=>{
                lastDragPosition = e.dragPlanePoint;
            })
            
            // Every time a rotation gizmo is dragged, check the angle between the last position on the drag plane and new position.
            // Then rotate the selected mesh by that angle
            this._dragBehavior.onDragObservable.add((event)=>{
                if(this._selectedMesh && lastDragPosition){
                    if(!this._selectedMesh.rotationQuaternion){
                        this._selectedMesh.rotationQuaternion = new BABYLON.Quaternion();
                    }
                    // Calc angle over full 360 degree (https://stackoverflow.com/questions/43493711/the-angle-between-two-3d-vectors-with-a-result-range-0-360)
                    var newVector = event.dragPlanePoint.subtract(this._selectedMesh.position).normalize();
                    var originalVector = lastDragPosition.subtract(this._selectedMesh.position).normalize();
                    var cross = Vector3.Cross(newVector,originalVector);
                    var dot = Vector3.Dot(newVector,originalVector);
                    var angle = Math.atan2(cross.length(), dot);
                    var up = normal.clone();
                    // Flip up vector depending on which side the camera is on
                    if(renderer.utilityLayerScene.activeCamera){
                        var camVec = renderer.utilityLayerScene.activeCamera.position.subtract(this._selectedMesh.position);
                        if(Vector3.Dot(camVec, up) > 0){
                            up.scaleInPlace(-1);
                        }
                    }
                    var halfCircleSide = Vector3.Dot(up, cross) > 0.0;
                    if (halfCircleSide) angle = -angle;
                    

                    // Convert angle and axis to quaternion (http://www.euclideanspace.com/maths/geometry/rotations/conversions/angleToQuaternion/index.htm)
                    var quaternionCoefficient = Math.sin(angle/2)
                    var amountToRotate = new BABYLON.Quaternion(up.x*quaternionCoefficient,up.y*quaternionCoefficient,up.z*quaternionCoefficient,Math.cos(angle/2));

                    // Rotate selected mesh quaternion over fixed axis
                    amountToRotate.multiplyToRef(this._selectedMesh.rotationQuaternion,this._selectedMesh.rotationQuaternion);

                    // Rotate selected mesh quaternion over non fixed gizmo
                    //this._selectedMesh.rotationQuaternion.multiplyInPlace(q)

                    lastDragPosition = event.dragPlanePoint;
                }
            })
        }
    }
} 