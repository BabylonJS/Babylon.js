module BABYLON {
    /**
     * A behavior that when attached to a mesh will allow the mesh to be dragged around the screen based on pointer events
     */
    export class PointerDragBehavior implements Behavior<Mesh> {
        private _attachedNode: Node; 
        private _dragPlane: Mesh;
        private _scene:Scene;
        private _pointerObserver:Nullable<Observer<PointerInfoPre>>;
        private static _planeScene:Scene;
        private _draggingID = -1;
        
        /**
         *  Fires each time the attached mesh is dragged with the pointer
         */
        public onDragObservable = new Observable<{delta:Vector3, dragPlanePoint:Vector3}>()
        /**
         *  Fires each time a drag begins (eg. mouse down on mesh)
         */
        public onDragStartObservable = new Observable<{dragPlanePoint:Vector3}>()
        /**
         *  Fires each time a drag ends (eg. mouse release after drag)
         */
        public onDragEndObservable = new Observable<{dragPlanePoint:Vector3}>()
        /**
         *  If the attached mesh should be moved when dragged
         */
        public moveAttached = true;
        /**
         *  Mesh with the position where the drag plane should be placed
         */
        public _dragPlaneParent:Nullable<Mesh>=null;

        /**
         *  If the drag behavior will react to drag events
         */
        public enabled = true;
        
        /**
         * Creates a pointer drag behavior that can be attached to a mesh
         * @param options The drag axis or normal of the plane that will be dragged across. pointerObservableScene can be used to listen to drag events from another scene(eg. if the attached mesh is in an overlay scene).
         */
        constructor(private options:{dragAxis?:Vector3, dragPlaneNormal?:Vector3, pointerObservableScene?:Scene}){
            var optionCount = 0;
            if(options.dragAxis){
                optionCount++;
            }
            if(options.dragPlaneNormal){
                optionCount++;
            }
            if(optionCount > 1){
                throw "Multiple drag modes specified in dragBehavior options. Only one expected";
            }
            if(optionCount < 1){
                throw "At least one drag mode option must be specified";
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

        /**
         * Attaches the drag behavior the passed in mesh
         * @param ownerNode The mesh that will be dragged around once attached
         */
        public attach(ownerNode: Mesh): void {
            this._scene = ownerNode.getScene();
            if(!this.options.pointerObservableScene){
                this.options.pointerObservableScene = this._scene;
            }
            this._attachedNode = ownerNode;

            // Initialize drag plane to not interfere with existing scene
            if(!PointerDragBehavior._planeScene){
                PointerDragBehavior._planeScene = new BABYLON.Scene(this._scene.getEngine())
                this._scene.getEngine().scenes.pop();
            }
            this._dragPlane = BABYLON.Mesh.CreatePlane("pointerDragPlane", 1000, PointerDragBehavior._planeScene, false, BABYLON.Mesh.DOUBLESIDE);

            // State of the drag
            var dragging = false;
            var lastPosition = new BABYLON.Vector3(0,0,0);
            var delta = new BABYLON.Vector3(0,0,0);

            var pickPredicate = (m:AbstractMesh)=>{
                return this._attachedNode == m || m.isDescendantOf(this._attachedNode)
            }

            this._pointerObserver = this.options.pointerObservableScene!.onPrePointerObservable.add((pointerInfoPre, eventState)=>{
                if(!this.enabled){
                    return;
                }
                // Check if attached mesh is picked
                var pickInfo = pointerInfoPre.ray ? this._scene.pickWithRay(pointerInfoPre.ray, pickPredicate) : this._scene.pick(this._scene.pointerX, this._scene.pointerY, pickPredicate);
                if(pickInfo){
                    pickInfo.ray = pointerInfoPre.ray;
                    if(!pickInfo.ray){
                        pickInfo.ray = this.options.pointerObservableScene!.createPickingRay(this._scene.pointerX, this._scene.pointerY, Matrix.Identity(), this._scene.activeCamera);
                    }
                    if(pickInfo.hit && pointerInfoPre.type == BABYLON.PointerEventTypes.POINTERDOWN){
                        pointerInfoPre.skipOnPointerObservable = true;
                    }
                }
                
                if (pointerInfoPre.type == BABYLON.PointerEventTypes.POINTERDOWN) {
                    if(!dragging && pickInfo && pickInfo.hit && pickInfo.pickedMesh && pickInfo.ray){
                        this._updateDragPlanePosition(pickInfo.ray);
                        var pickedPoint = this._pickWithRayOnDragPlane(pickInfo.ray);
                        if(pickedPoint){
                            dragging = true;
                            this._draggingID = (<PointerEvent>pointerInfoPre.event).pointerId;
                            lastPosition.copyFrom(pickedPoint);
                            this.onDragStartObservable.notifyObservers({dragPlanePoint: pickedPoint});
                        }
                    }
                }else if(pointerInfoPre.type == BABYLON.PointerEventTypes.POINTERUP){
                    if(this._draggingID == (<PointerEvent>pointerInfoPre.event).pointerId){
                        dragging = false;
                        this._draggingID = -1;
                        this.onDragEndObservable.notifyObservers({dragPlanePoint: lastPosition});
                    }
                }else if(pointerInfoPre.type == BABYLON.PointerEventTypes.POINTERMOVE){
                    if(this._draggingID == (<PointerEvent>pointerInfoPre.event).pointerId && dragging && pickInfo && pickInfo.ray){
                        var pickedPoint = this._pickWithRayOnDragPlane(pickInfo.ray);
                        this._updateDragPlanePosition(pickInfo.ray);
                        if (pickedPoint) {
                            // depending on the drag mode option drag accordingly
                            if(this.options.dragAxis){
                                //get the closest point on the dragaxis from the selected mesh to the picked point location
                                // https://www.opengl.org/discussion_boards/showthread.php/159717-Closest-point-on-a-Vector-to-a-point
                                this.options.dragAxis.scaleToRef(BABYLON.Vector3.Dot(pickedPoint.subtract(lastPosition), this.options.dragAxis), delta);
                            }else{
                                pickedPoint.subtractToRef(lastPosition, delta);
                            }
                            if(this.moveAttached){
                                (<Mesh>this._attachedNode).position.addInPlace(delta);
                                
                            }
                            this.onDragObservable.notifyObservers({delta: delta, dragPlanePoint: pickedPoint});
                            lastPosition.copyFrom(pickedPoint);
                        }
                    }
                }
            });
        }

        private _pickWithRayOnDragPlane(ray:Nullable<Ray>){
            if(!ray){
                return null;
            }
            var pickResult = PointerDragBehavior._planeScene.pickWithRay(ray, (m)=>{return m == this._dragPlane})
            if (pickResult && pickResult.hit && pickResult.pickedMesh && pickResult.pickedPoint) {
                return pickResult.pickedPoint;
            }else{
                return null;
            }
        }

        // Position the drag plane based on the attached mesh position, for single axis rotate the plane along the axis to face the camera
        private _updateDragPlanePosition(ray:Ray){
            var pointA = this._dragPlaneParent ? this._dragPlaneParent.position : (<Mesh>this._attachedNode).position // center
            if(this.options.dragAxis){
                var camPos = ray.origin;

                // Calculate plane normal in direction of camera but perpendicular to drag axis
                var pointB = pointA.add(this.options.dragAxis); // towards drag axis
                var pointC = pointA.add(camPos.subtract(pointA).normalize()); // towards camera
                // Get perpendicular line from direction to camera and drag axis
                var lineA = pointB.subtract(pointA);
                var lineB = pointC.subtract(pointA);
                var perpLine = BABYLON.Vector3.Cross(lineA, lineB);
                // Get perpendicular line from previous result and drag axis to adjust lineB to be perpendiculat to camera
                var norm = BABYLON.Vector3.Cross(lineA, perpLine).normalize();

                this._dragPlane.position.copyFrom(pointA);
                this._dragPlane.lookAt(pointA.add(norm));
            }else if(this.options.dragPlaneNormal){
                this._dragPlane.position.copyFrom(pointA);
                this._dragPlane.lookAt(pointA.add(this.options.dragPlaneNormal));
            }
            this._dragPlane.computeWorldMatrix(true);
        }

        /**
         *  Detaches the behavior from the mesh
         */
        public detach(): void {
            if(this._pointerObserver){
                this._scene.onPrePointerObservable.remove(this._pointerObserver);
            }
        }
    }
}