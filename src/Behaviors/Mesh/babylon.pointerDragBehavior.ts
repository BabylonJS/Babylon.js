module BABYLON {
    /**
     * A behavior that when attached to a mesh will allow the mesh to be dragged around the screen based on pointer events
     */
    export class PointerDragBehavior implements Behavior<Mesh> {
        private _attachedNode: Node; 
        private _dragPlane: Mesh;
        private _scene:Scene;
        private _pointerObserver:Nullable<Observer<PointerInfo>>;
        private _beforeRenderObserver:Nullable<Observer<Scene>>;
        private static _planeScene:Scene;
        /**
         * The maximum tolerated angle between the drag plane and dragging pointer rays to trigger pointer events. Set to 0 to allow any angle (default: 0)
         */
        public maxDragAngle = 0;
        /**
         * @hidden
         */
        public _useAlternatePickedPointAboveMaxDragAngle = false;
        /**
         * The id of the pointer that is currently interacting with the behavior (-1 when no pointer is active)
         */
        public currentDraggingPointerID = -1;
        /**
         * The last position where the pointer hit the drag plane in world space
         */
        public lastDragPosition:Vector3;
        /**
         * If the behavior is currently in a dragging state
         */
        public dragging = false;
        /**
         * The distance towards the target drag position to move each frame. This can be useful to avoid jitter. Set this to 1 for no delay. (Default: 0.2)
         */
        public dragDeltaRatio = 0.2;
        /**
         * If the drag plane orientation should be updated during the dragging (Default: true)
         */
        public updateDragPlane = true;
        // Debug mode will display drag planes to help visualize behavior
        private _debugMode = false;
        private _moving = false;
        /**
         *  Fires each time the attached mesh is dragged with the pointer
         *  * delta between last drag position and current drag position in world space
         *  * dragDistance along the drag axis
         *  * dragPlaneNormal normal of the current drag plane used during the drag
         *  * dragPlanePoint in world space where the drag intersects the drag plane
         */
        public onDragObservable = new Observable<{delta:Vector3, dragPlanePoint:Vector3, dragPlaneNormal:Vector3, dragDistance:number, pointerId:number}>()
        /**
         *  Fires each time a drag begins (eg. mouse down on mesh)
         */
        public onDragStartObservable = new Observable<{dragPlanePoint:Vector3, pointerId:number}>()
        /**
         *  Fires each time a drag ends (eg. mouse release after drag)
         */
        public onDragEndObservable = new Observable<{dragPlanePoint:Vector3, pointerId:number}>()
        /**
         *  If the attached mesh should be moved when dragged
         */
        public moveAttached = true;

        /**
         *  If the drag behavior will react to drag events (Default: true)
         */
        public enabled = true;
        
        /**
         * If set, the drag plane/axis will be rotated based on the attached mesh's world rotation (Default: true)
         */
        public useObjectOrienationForDragging = true;

        private _options:{dragAxis?:Vector3, dragPlaneNormal?:Vector3};
        /**
         * Creates a pointer drag behavior that can be attached to a mesh
         * @param options The drag axis or normal of the plane that will be dragged across. If no options are specified the drag plane will always face the ray's origin (eg. camera)
         */
        constructor(options?:{dragAxis?:Vector3, dragPlaneNormal?:Vector3}){
            this._options = options ? options : {};
            
            var optionCount = 0;
            if(this._options.dragAxis){
                optionCount++;
            }
            if(this._options.dragPlaneNormal){
                optionCount++;
            }
            if(optionCount > 1){
                throw "Multiple drag modes specified in dragBehavior options. Only one expected";
            }
        }

        /**
         *  The name of the behavior
         */
        public get name(): string {
            return "PointerDrag";
        }

        /**
         *  Initializes the behavior
         */
        public init() {}

        private _tmpVector = new Vector3(0,0,0);
        private _alternatePickedPoint = new Vector3(0,0,0);
        private _worldDragAxis = new Vector3(0,0,0);
        /**
         * Attaches the drag behavior the passed in mesh
         * @param ownerNode The mesh that will be dragged around once attached
         */
        public attach(ownerNode: Mesh): void {
            this._scene = ownerNode.getScene();
            this._attachedNode = ownerNode;

            // Initialize drag plane to not interfere with existing scene
            if(!PointerDragBehavior._planeScene){
                if(this._debugMode){
                    PointerDragBehavior._planeScene = this._scene;
                }else{
                    PointerDragBehavior._planeScene = new BABYLON.Scene(this._scene.getEngine());
                    PointerDragBehavior._planeScene.detachControl();
                    this._scene.getEngine().scenes.pop();
                }
            }
            this._dragPlane = BABYLON.Mesh.CreatePlane("pointerDragPlane", this._debugMode ? 1 : 10000, PointerDragBehavior._planeScene, false, BABYLON.Mesh.DOUBLESIDE);

            // State of the drag
            this.lastDragPosition = new BABYLON.Vector3(0,0,0);
            var delta = new BABYLON.Vector3(0,0,0);
            var dragLength = 0;
            var targetPosition = new BABYLON.Vector3(0,0,0);

            var pickPredicate = (m:AbstractMesh)=>{
                return this._attachedNode == m || m.isDescendantOf(this._attachedNode)
            }

            this._pointerObserver = this._scene.onPointerObservable.add((pointerInfo, eventState)=>{
                if(!this.enabled){
                    return;
                }
                
                if (pointerInfo.type == BABYLON.PointerEventTypes.POINTERDOWN) {
                    
                    if(!this.dragging && pointerInfo.pickInfo && pointerInfo.pickInfo.hit && pointerInfo.pickInfo.pickedMesh && pointerInfo.pickInfo.pickedPoint && pointerInfo.pickInfo.ray && pickPredicate(pointerInfo.pickInfo.pickedMesh)){
                        this._updateDragPlanePosition(pointerInfo.pickInfo.ray, pointerInfo.pickInfo.pickedPoint);
                        var pickedPoint = this._pickWithRayOnDragPlane(pointerInfo.pickInfo.ray);
                        if(pickedPoint){
                            this.dragging = true;
                            this.currentDraggingPointerID = (<PointerEvent>pointerInfo.event).pointerId;
                            this.lastDragPosition.copyFrom(pickedPoint);
                            this.onDragStartObservable.notifyObservers({dragPlanePoint: pickedPoint, pointerId: this.currentDraggingPointerID});
                            targetPosition.copyFrom((<Mesh>this._attachedNode).absolutePosition)
                        }
                    }
                }else if(pointerInfo.type == BABYLON.PointerEventTypes.POINTERUP){
                    if(this.currentDraggingPointerID == (<PointerEvent>pointerInfo.event).pointerId){
                        this.releaseDrag();
                    }
                }else if(pointerInfo.type == BABYLON.PointerEventTypes.POINTERMOVE){
                    if(this.currentDraggingPointerID == (<PointerEvent>pointerInfo.event).pointerId && this.dragging && pointerInfo.pickInfo && pointerInfo.pickInfo.ray){
                        this._moving = true;
                        var pickedPoint = this._pickWithRayOnDragPlane(pointerInfo.pickInfo.ray);
                        
                        if (pickedPoint) {
                            if(this.updateDragPlane){
                                this._updateDragPlanePosition(pointerInfo.pickInfo.ray, pickedPoint);
                            }
                            
                            // depending on the drag mode option drag accordingly
                            if(this._options.dragAxis){
                                // Convert local drag axis to world
                                Vector3.TransformCoordinatesToRef(this._options.dragAxis, this._attachedNode.getWorldMatrix().getRotationMatrix(), this._worldDragAxis);

                                // Project delta drag from the drag plane onto the drag axis
                                pickedPoint.subtractToRef(this.lastDragPosition, this._tmpVector);
                                dragLength = BABYLON.Vector3.Dot(this._tmpVector, this._worldDragAxis)
                                this._worldDragAxis.scaleToRef(dragLength, delta);
                            }else{
                                dragLength = delta.length();
                                pickedPoint.subtractToRef(this.lastDragPosition, delta);
                            }
                            targetPosition.addInPlace(delta);
                            this.onDragObservable.notifyObservers({dragDistance: dragLength, delta: delta, dragPlanePoint: pickedPoint, dragPlaneNormal: this._dragPlane.forward, pointerId: this.currentDraggingPointerID});
                            this.lastDragPosition.copyFrom(pickedPoint);
                        }
                    }
                }
            });

            this._beforeRenderObserver = this._scene.onBeforeRenderObservable.add(()=>{
                if(this._moving && this.moveAttached){
                    // Slowly move mesh to avoid jitter
                    targetPosition.subtractToRef((<Mesh>this._attachedNode).absolutePosition, this._tmpVector);
                    this._tmpVector.scaleInPlace(0.2);
                    (<Mesh>this._attachedNode).getAbsolutePosition().addToRef(this._tmpVector, this._tmpVector);
                    (<Mesh>this._attachedNode).setAbsolutePosition(this._tmpVector);
                }
            });
        }

        public releaseDrag(){
            this.dragging = false;
            this.onDragEndObservable.notifyObservers({dragPlanePoint: this.lastDragPosition, pointerId: this.currentDraggingPointerID});
            this.currentDraggingPointerID = -1;
            this._moving = false;
        }

        private _pickWithRayOnDragPlane(ray:Nullable<Ray>){
            if(!ray){
                return null;
            }

            // Calculate angle between plane normal and ray
            var angle = Math.acos(Vector3.Dot(this._dragPlane.forward, ray.direction));
            // Correct if ray is casted from oposite side
            if(angle > Math.PI/2){
                angle = Math.PI - angle;
            }

            // If the angle is too perpendicular to the plane pick another point on the plane where it is looking
            if(this.maxDragAngle > 0 && angle > this.maxDragAngle){
                if(this._useAlternatePickedPointAboveMaxDragAngle){
                    // Invert ray direction along the towards object axis
                    this._tmpVector.copyFrom(ray.direction);
                    (<Mesh>this._attachedNode).absolutePosition.subtractToRef(ray.origin, this._alternatePickedPoint);
                    this._alternatePickedPoint.normalize();
                    this._alternatePickedPoint.scaleInPlace(-2*Vector3.Dot(this._alternatePickedPoint, this._tmpVector));
                    this._tmpVector.addInPlace(this._alternatePickedPoint);
                    
                    // Project resulting vector onto the drag plane and add it to the attached nodes absolute position to get a picked point
                    var dot = Vector3.Dot(this._dragPlane.forward, this._tmpVector);
                    this._dragPlane.forward.scaleToRef(-dot, this._alternatePickedPoint);
                    this._alternatePickedPoint.addInPlace(this._tmpVector);
                    this._alternatePickedPoint.addInPlace((<Mesh>this._attachedNode).absolutePosition);
                    return this._alternatePickedPoint
                }else{
                    return null;
                }
            }

            var pickResult = PointerDragBehavior._planeScene.pickWithRay(ray, (m)=>{return m == this._dragPlane})
            if (pickResult && pickResult.hit && pickResult.pickedMesh && pickResult.pickedPoint) {
                return pickResult.pickedPoint;
            }else{
                return null;
            }
        }

        // Variables to avoid instantiation in the below method
        private _pointA = new Vector3(0,0,0);
        private _pointB = new Vector3(0,0,0);
        private _pointC = new Vector3(0,0,0);
        private _lineA = new Vector3(0,0,0);
        private _lineB = new Vector3(0,0,0);
        private _localAxis = new Vector3(0,0,0);
        private _lookAt = new Vector3(0,0,0);
        // Position the drag plane based on the attached mesh position, for single axis rotate the plane along the axis to face the camera
        private _updateDragPlanePosition(ray:Ray, dragPlanePosition:Vector3){
            this._pointA.copyFrom(dragPlanePosition);
            if(this._options.dragAxis){
                this.useObjectOrienationForDragging ? Vector3.TransformCoordinatesToRef(this._options.dragAxis, this._attachedNode.getWorldMatrix().getRotationMatrix(), this._localAxis) : this._localAxis.copyFrom(this._options.dragAxis);

                // Calculate plane normal in direction of camera but perpendicular to drag axis
                this._pointA.addToRef(this._localAxis, this._pointB); // towards drag axis
                ray.origin.subtractToRef(this._pointA, this._pointC)
                this._pointA.addToRef(this._pointC.normalize(), this._pointC); // towards camera
                // Get perpendicular line from direction to camera and drag axis
                this._pointB.subtractToRef(this._pointA, this._lineA);
                this._pointC.subtractToRef(this._pointA, this._lineB);
                BABYLON.Vector3.CrossToRef(this._lineA, this._lineB, this._lookAt);
                // Get perpendicular line from previous result and drag axis to adjust lineB to be perpendiculat to camera
                BABYLON.Vector3.CrossToRef(this._lineA, this._lookAt, this._lookAt);
                this._lookAt.normalize();

                this._dragPlane.position.copyFrom(this._pointA);
                this._pointA.subtractToRef(this._lookAt, this._lookAt);
                this._dragPlane.lookAt(this._lookAt);
            }else if(this._options.dragPlaneNormal){
                this.useObjectOrienationForDragging ? Vector3.TransformCoordinatesToRef(this._options.dragPlaneNormal, this._attachedNode.getWorldMatrix().getRotationMatrix(),this._localAxis) : this._localAxis.copyFrom(this._options.dragPlaneNormal);
                this._dragPlane.position.copyFrom(this._pointA);
                this._pointA.subtractToRef(this._localAxis, this._lookAt);
                this._dragPlane.lookAt(this._lookAt);
            }else{
                this._dragPlane.position.copyFrom(this._pointA);
                this._dragPlane.lookAt(ray.origin);
            }
            this._dragPlane.computeWorldMatrix(true);
        }

        /**
         *  Detaches the behavior from the mesh
         */
        public detach(): void {
            if(this._pointerObserver){
                this._scene.onPointerObservable.remove(this._pointerObserver);
            }
            if(this._beforeRenderObserver){
                this._scene.onBeforeRenderObservable.remove(this._beforeRenderObserver);
            }
        }
    }
}