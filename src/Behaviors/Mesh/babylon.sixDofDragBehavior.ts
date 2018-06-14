module BABYLON {
    /**
     * A behavior that when attached to a mesh will allow the mesh to be dragged around based on directions and origin of the pointer's ray
     */
    export class SixDofDragBehavior implements Behavior<Mesh> {
        private static _virtualScene:Scene;
        private _ownerNode:Mesh;
        private _sceneRenderObserver:Nullable<Observer<Scene>> = null;
        private _scene:Scene;
        private _targetPosition = new Vector3(0,0,0);
        private _virtualOriginMesh:AbstractMesh;
        private _virtualDragMesh:AbstractMesh;
        private _pointerObserver:Nullable<Observer<PointerInfo>>;
        /**
         * How much faster the object should move when the controller is moving towards it. This is useful to bring objects that are far away from the user to them faster. Set this to 0 to avoid any speed increase. (Default: 5)
         */
         private zDragFactor = 5;
        /**
         * If the behavior is currently in a dragging state
         */
        public dragging = false;
        /**
         * The distance towards the target drag position to move each frame. This can be useful to avoid jitter. Set this to 1 for no delay. (Default: 0.2)
         */
        public dragDeltaRatio = 0.2;
        /**
         * The id of the pointer that is currently interacting with the behavior (-1 when no pointer is active)
         */
        public currentDraggingPointerID = -1;


        constructor(){
        }
        
        /**
         *  The name of the behavior
         */
        public get name(): string {
            return "SixDofDrag";
        }

        /**
         *  Initializes the behavior
         */
        public init() {}

        /**
         * Attaches the scale behavior the passed in mesh
         * @param ownerNode The mesh that will be scaled around once attached
         */
        public attach(ownerNode: Mesh): void {
            this._ownerNode = ownerNode;
            this._scene = this._ownerNode.getScene();
            if(!SixDofDragBehavior._virtualScene){
                SixDofDragBehavior._virtualScene = new BABYLON.Scene(this._scene.getEngine());
                this._scene.getEngine().scenes.pop();
            }
        
            var pickedMesh:Nullable<AbstractMesh> = null;
            var lastSixDofOriginPosition = new BABYLON.Vector3(0,0,0);

            // Setup virtual meshes to be used for dragging without dirtying the existing scene
            this._virtualOriginMesh = new BABYLON.AbstractMesh("", SixDofDragBehavior._virtualScene);
            this._virtualOriginMesh.rotationQuaternion = new Quaternion();
            this._virtualDragMesh = new BABYLON.AbstractMesh("", SixDofDragBehavior._virtualScene);
            this._virtualDragMesh.rotationQuaternion = new Quaternion();

            var pickPredicate = (m:AbstractMesh)=>{
                return this._ownerNode == m || m.isDescendantOf(this._ownerNode);
            }
            
            this._pointerObserver = this._scene.onPointerObservable.add((pointerInfo, eventState)=>{                
                if (pointerInfo.type == BABYLON.PointerEventTypes.POINTERDOWN) {
                    if(!this.dragging && pointerInfo.pickInfo && pointerInfo.pickInfo.hit && pointerInfo.pickInfo.pickedMesh && pointerInfo.pickInfo.ray && pickPredicate(pointerInfo.pickInfo.pickedMesh)){
                        pickedMesh = pointerInfo.pickInfo.pickedMesh;
                        lastSixDofOriginPosition.copyFrom(pointerInfo.pickInfo.ray.origin);

                        // Set position and orientation of the controller
                        this._virtualOriginMesh.position.copyFrom(pointerInfo.pickInfo.ray.origin);
                        this._virtualOriginMesh.lookAt(pointerInfo.pickInfo.ray.origin.subtract(pointerInfo.pickInfo.ray.direction));

                        // Attach the virtual drag mesh to the virtual origin mesh so it can be dragged
                        this._virtualOriginMesh.removeChild(this._virtualDragMesh);
                        this._virtualDragMesh.position.copyFrom(pickedMesh.absolutePosition);
                        if(!pickedMesh.rotationQuaternion){
                            pickedMesh.rotationQuaternion = Quaternion.RotationYawPitchRoll(pickedMesh.rotation.y,pickedMesh.rotation.x,pickedMesh.rotation.z);
                        }
                        this._virtualDragMesh.rotationQuaternion!.copyFrom(pickedMesh.rotationQuaternion);
                        this._virtualOriginMesh.addChild(this._virtualDragMesh);

                        // Update state
                        this.dragging = true;
                        this.currentDraggingPointerID = (<PointerEvent>pointerInfo.event).pointerId;
                    }
                }else if(pointerInfo.type == BABYLON.PointerEventTypes.POINTERUP){
                    if(this.currentDraggingPointerID == (<PointerEvent>pointerInfo.event).pointerId){
                        this.dragging = false;
                        this.currentDraggingPointerID = -1;
                        pickedMesh = null;
                        this._virtualOriginMesh.removeChild(this._virtualDragMesh);
                    }
                }else if(pointerInfo.type == BABYLON.PointerEventTypes.POINTERMOVE){
                    if(this.currentDraggingPointerID == (<PointerEvent>pointerInfo.event).pointerId && this.dragging && pointerInfo.pickInfo && pointerInfo.pickInfo.ray && pickedMesh){
                        // Calculate controller drag distance in controller space
                        var originDragDifference = pointerInfo.pickInfo.ray.origin.subtract(lastSixDofOriginPosition);
                        lastSixDofOriginPosition.copyFrom(pointerInfo.pickInfo.ray.origin);
                        var localOriginDragDifference = Vector3.TransformCoordinates(originDragDifference, Matrix.Invert(this._virtualOriginMesh.getWorldMatrix().getRotationMatrix()));
                        
                        this._virtualOriginMesh.addChild(this._virtualDragMesh);
                        // Determine how much the controller moved to/away towards the dragged object and use this to move the object further when its further away
                        var zDragDistance = Vector3.Dot(localOriginDragDifference, this._virtualOriginMesh.position.normalizeToNew());
                        this._virtualDragMesh.position.z -= this._virtualDragMesh.position.z < 1 ? zDragDistance*this.zDragFactor : zDragDistance*this.zDragFactor*this._virtualDragMesh.position.z;
                        if(this._virtualDragMesh.position.z < 0){
                            this._virtualDragMesh.position.z = 0;
                        }
                        
                        // Update the controller position
                        this._virtualOriginMesh.position.copyFrom(pointerInfo.pickInfo.ray.origin);
                        this._virtualOriginMesh.lookAt(pointerInfo.pickInfo.ray.origin.subtract(pointerInfo.pickInfo.ray.direction));
                        this._virtualOriginMesh.removeChild(this._virtualDragMesh)
                    
                        // Move the virtualObjectsPosition into the picked mesh's space if needed
                        this._targetPosition.copyFrom(this._virtualDragMesh.absolutePosition);
                        if(pickedMesh.parent){
                            Vector3.TransformCoordinatesToRef(this._targetPosition, Matrix.Invert(pickedMesh.parent.getWorldMatrix()), this._targetPosition);
                        }
                    }
                }
            });

            // On every frame move towards target scaling to avoid jitter caused by vr controllers
            this._sceneRenderObserver = ownerNode.getScene().onBeforeRenderObservable.add(()=>{
                if(this.dragging && pickedMesh){
                    // Slowly move mesh to avoid jitter
                    pickedMesh.position.addInPlace(this._targetPosition.subtract(pickedMesh.position).scale(this.dragDeltaRatio));
                }
            });
        }
        /**
         *  Detaches the behavior from the mesh
         */
        public detach(): void {
            this._scene.onPointerObservable.remove(this._pointerObserver);
            this._ownerNode.getScene().onBeforeRenderObservable.remove(this._sceneRenderObserver);
            this._virtualOriginMesh.dispose()
            this._virtualDragMesh.dispose();
        }
    }
}