module BABYLON {
    /**
     * A behavior that when attached to a mesh will allow the mesh to be dragged around based on directions and origin of the pointer's ray
     */
    export class SixDofDragBehavior implements Behavior<Mesh> {
        private static _virtualScene: Scene;
        private _ownerNode: Mesh;
        private _sceneRenderObserver: Nullable<Observer<Scene>> = null;
        private _scene: Scene;
        private _targetPosition = new Vector3(0, 0, 0);
        private _virtualOriginMesh: AbstractMesh;
        private _virtualDragMesh: AbstractMesh;
        private _pointerObserver: Nullable<Observer<PointerInfo>>;
        private _moving = false;
        private _startingOrientation = new Quaternion();
        /**
         * How much faster the object should move when the controller is moving towards it. This is useful to bring objects that are far away from the user to them faster. Set this to 0 to avoid any speed increase. (Default: 3)
         */
         private zDragFactor = 3;
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
        /**
         * If camera controls should be detached during the drag
         */
        public detachCameraControls = true;
        /**
         * Fires each time a drag starts
         */
        public onDragStartObservable = new Observable<{}>();
        /**
         *  Fires each time a drag ends (eg. mouse release after drag)
         */
        public onDragEndObservable = new Observable<{}>();

        /**
         * Instantiates a behavior that when attached to a mesh will allow the mesh to be dragged around based on directions and origin of the pointer's ray
         */
        constructor() {
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
            if (!SixDofDragBehavior._virtualScene) {
                SixDofDragBehavior._virtualScene = new BABYLON.Scene(this._scene.getEngine());
                SixDofDragBehavior._virtualScene.detachControl();
                this._scene.getEngine().scenes.pop();
            }

            var pickedMesh: Nullable<AbstractMesh> = null;
            var lastSixDofOriginPosition = new BABYLON.Vector3(0, 0, 0);

            // Setup virtual meshes to be used for dragging without dirtying the existing scene
            this._virtualOriginMesh = new BABYLON.AbstractMesh("", SixDofDragBehavior._virtualScene);
            this._virtualOriginMesh.rotationQuaternion = new Quaternion();
            this._virtualDragMesh = new BABYLON.AbstractMesh("", SixDofDragBehavior._virtualScene);
            this._virtualDragMesh.rotationQuaternion = new Quaternion();

            var pickPredicate = (m: AbstractMesh) => {
                return this._ownerNode == m || m.isDescendantOf(this._ownerNode);
            };
            var attachedElement: Nullable<HTMLElement> = null;
            this._pointerObserver = this._scene.onPointerObservable.add((pointerInfo, eventState) => {
                if (pointerInfo.type == BABYLON.PointerEventTypes.POINTERDOWN) {
                    if (!this.dragging && pointerInfo.pickInfo && pointerInfo.pickInfo.hit && pointerInfo.pickInfo.pickedMesh && pointerInfo.pickInfo.ray && pickPredicate(pointerInfo.pickInfo.pickedMesh)) {
                        if (this._scene.activeCamera && this._scene.activeCamera.cameraRigMode == Camera.RIG_MODE_NONE) {
                            pointerInfo.pickInfo.ray.origin.copyFrom(this._scene.activeCamera!.position);
                        }

                        pickedMesh = this._ownerNode;
                        BoundingBoxGizmo._RemoveAndStorePivotPoint(pickedMesh);
                        lastSixDofOriginPosition.copyFrom(pointerInfo.pickInfo.ray.origin);

                        // Set position and orientation of the controller
                        this._virtualOriginMesh.position.copyFrom(pointerInfo.pickInfo.ray.origin);
                        this._virtualOriginMesh.lookAt(pointerInfo.pickInfo.ray.origin.subtract(pointerInfo.pickInfo.ray.direction));

                        // Attach the virtual drag mesh to the virtual origin mesh so it can be dragged
                        this._virtualOriginMesh.removeChild(this._virtualDragMesh);
                        pickedMesh.computeWorldMatrix();
                        this._virtualDragMesh.position.copyFrom(pickedMesh.absolutePosition);
                        if (!pickedMesh.rotationQuaternion) {
                            pickedMesh.rotationQuaternion = Quaternion.RotationYawPitchRoll(pickedMesh.rotation.y, pickedMesh.rotation.x, pickedMesh.rotation.z);
                        }
                        var oldParent = pickedMesh.parent;
                        pickedMesh.setParent(null);
                        this._virtualDragMesh.rotationQuaternion!.copyFrom(pickedMesh.rotationQuaternion);
                        pickedMesh.setParent(oldParent);
                        this._virtualOriginMesh.addChild(this._virtualDragMesh);

                        // Update state
                        this._targetPosition.copyFrom(this._virtualDragMesh.absolutePosition);
                        this.dragging = true;
                        this.currentDraggingPointerID = (<PointerEvent>pointerInfo.event).pointerId;

                        // Detatch camera controls
                        if (this.detachCameraControls && this._scene.activeCamera && !this._scene.activeCamera.leftCamera) {
                            if (this._scene.activeCamera.inputs.attachedElement) {
                                attachedElement = this._scene.activeCamera.inputs.attachedElement;
                                this._scene.activeCamera.detachControl(this._scene.activeCamera.inputs.attachedElement);
                            }else {
                                attachedElement = null;
                            }
                        }
                        BoundingBoxGizmo._RestorePivotPoint(pickedMesh);
                        this.onDragStartObservable.notifyObservers({});
                    }
                }else if (pointerInfo.type == BABYLON.PointerEventTypes.POINTERUP) {
                    if (this.currentDraggingPointerID == (<PointerEvent>pointerInfo.event).pointerId) {
                        this.dragging = false;
                        this._moving = false;
                        this.currentDraggingPointerID = -1;
                        pickedMesh = null;
                        this._virtualOriginMesh.removeChild(this._virtualDragMesh);

                        // Reattach camera controls
                        if (this.detachCameraControls && attachedElement && this._scene.activeCamera && !this._scene.activeCamera.leftCamera) {
                            this._scene.activeCamera.attachControl(attachedElement, true);
                        }
                        this.onDragEndObservable.notifyObservers({});
                    }
                }else if (pointerInfo.type == BABYLON.PointerEventTypes.POINTERMOVE) {
                    if (this.currentDraggingPointerID == (<PointerEvent>pointerInfo.event).pointerId && this.dragging && pointerInfo.pickInfo && pointerInfo.pickInfo.ray && pickedMesh) {
                        var zDragFactor = this.zDragFactor;
                        if (this._scene.activeCamera && this._scene.activeCamera.cameraRigMode == Camera.RIG_MODE_NONE) {
                            pointerInfo.pickInfo.ray.origin.copyFrom(this._scene.activeCamera!.position);
                            zDragFactor = 0;
                        }

                        // Calculate controller drag distance in controller space
                        var originDragDifference = pointerInfo.pickInfo.ray.origin.subtract(lastSixDofOriginPosition);
                        lastSixDofOriginPosition.copyFrom(pointerInfo.pickInfo.ray.origin);
                        var localOriginDragDifference = -Vector3.Dot(originDragDifference, pointerInfo.pickInfo.ray.direction);

                        this._virtualOriginMesh.addChild(this._virtualDragMesh);
                        // Determine how much the controller moved to/away towards the dragged object and use this to move the object further when its further away
                        this._virtualDragMesh.position.z -= this._virtualDragMesh.position.z < 1 ? localOriginDragDifference * this.zDragFactor : localOriginDragDifference * zDragFactor * this._virtualDragMesh.position.z;
                        if (this._virtualDragMesh.position.z < 0) {
                            this._virtualDragMesh.position.z = 0;
                        }

                        // Update the controller position
                        this._virtualOriginMesh.position.copyFrom(pointerInfo.pickInfo.ray.origin);
                        this._virtualOriginMesh.lookAt(pointerInfo.pickInfo.ray.origin.subtract(pointerInfo.pickInfo.ray.direction));
                        this._virtualOriginMesh.removeChild(this._virtualDragMesh);

                        // Move the virtualObjectsPosition into the picked mesh's space if needed
                        this._targetPosition.copyFrom(this._virtualDragMesh.absolutePosition);
                        if (pickedMesh.parent) {
                            Vector3.TransformCoordinatesToRef(this._targetPosition, Matrix.Invert(pickedMesh.parent.getWorldMatrix()), this._targetPosition);
                        }

                        if (!this._moving) {
                            this._startingOrientation.copyFrom(this._virtualDragMesh.rotationQuaternion!);
                        }
                        this._moving = true;
                    }
                }
            });

            var tmpQuaternion = new Quaternion();
            // On every frame move towards target scaling to avoid jitter caused by vr controllers
            this._sceneRenderObserver = ownerNode.getScene().onBeforeRenderObservable.add(() => {
                if (this.dragging && this._moving && pickedMesh) {
                    BoundingBoxGizmo._RemoveAndStorePivotPoint(pickedMesh);
                    // Slowly move mesh to avoid jitter
                    pickedMesh.position.addInPlace(this._targetPosition.subtract(pickedMesh.position).scale(this.dragDeltaRatio));

                    // Get change in rotation
                    tmpQuaternion.copyFrom(this._startingOrientation);
                    tmpQuaternion.x = -tmpQuaternion.x;
                    tmpQuaternion.y = -tmpQuaternion.y;
                    tmpQuaternion.z = -tmpQuaternion.z;
                    this._virtualDragMesh.rotationQuaternion!.multiplyToRef(tmpQuaternion, tmpQuaternion);
                    // Convert change in rotation to only y axis rotation
                    Quaternion.RotationYawPitchRollToRef(tmpQuaternion.toEulerAngles("xyz").y, 0, 0, tmpQuaternion);
                    tmpQuaternion.multiplyToRef(this._startingOrientation, tmpQuaternion);
                    // Slowly move mesh to avoid jitter
                    var oldParent = pickedMesh.parent;
                    pickedMesh.setParent(null);
                    Quaternion.SlerpToRef(pickedMesh.rotationQuaternion!, tmpQuaternion, this.dragDeltaRatio, pickedMesh.rotationQuaternion!);
                    pickedMesh.setParent(oldParent);
                    BoundingBoxGizmo._RestorePivotPoint(pickedMesh);
                }
            });
        }
        /**
         *  Detaches the behavior from the mesh
         */
        public detach(): void {
            if (this._scene) {
                this._scene.onPointerObservable.remove(this._pointerObserver);
            }
            if (this._ownerNode) {
                this._ownerNode.getScene().onBeforeRenderObservable.remove(this._sceneRenderObserver);
            }
            if (this._virtualOriginMesh) {
                this._virtualOriginMesh.dispose();
            }
            if (this._virtualDragMesh) {
                this._virtualDragMesh.dispose();
            }
            this.onDragEndObservable.clear();
            this.onDragStartObservable.clear();
        }
    }
}