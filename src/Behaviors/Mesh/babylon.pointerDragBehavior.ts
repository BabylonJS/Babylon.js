module BABYLON {
    /**
     * A behavior that when attached to a mesh will allow the mesh to be dragged around the screen based on pointer events
     */
    export class PointerDragBehavior implements Behavior<Mesh> {
        private _attachedNode: Node; 
        private _dragPlane: Mesh;
        private _scene:Scene;
        private _pointerObserver:Nullable<Observer<PointerInfo>>;
        private static _planeScene:Scene;
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
        // Debug mode will display drag planes to help visualize behavior
        private _debugMode = false;
        private _maxDragAngle = Math.PI/5;
        
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
         *  Mesh with the position where the drag plane should be placed
         */
        public _dragPlaneParent:Nullable<Mesh>=null;

        /**
         *  If the drag behavior will react to drag events (Default: true)
         */
        public enabled = true;
        
        /**
         * If set, the drag plane/axis will be rotated based on the attached mesh's world rotation (Default: true)
         */
        public useObjectOrienationForDragging = true;

        /**
         * Creates a pointer drag behavior that can be attached to a mesh
         * @param options The drag axis or normal of the plane that will be dragged across. If no options are specified the drag plane will always face the ray's origin (eg. camera)
         */
        constructor(private options:{dragAxis?:Vector3, dragPlaneNormal?:Vector3}){
            var optionCount = 0;
            if(options === undefined){
                options = {}
            }
            if(options.dragAxis){
                optionCount++;
            }
            if(options.dragPlaneNormal){
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
                    this._scene.getEngine().scenes.pop();
                }
            }
            this._dragPlane = BABYLON.Mesh.CreatePlane("pointerDragPlane", this._debugMode ? 1 : 10000, PointerDragBehavior._planeScene, false, BABYLON.Mesh.DOUBLESIDE);

            // State of the drag
            this.lastDragPosition = new BABYLON.Vector3(0,0,0);
            var delta = new BABYLON.Vector3(0,0,0);
            var dragLength = 0;

            var pickPredicate = (m:AbstractMesh)=>{
                return this._attachedNode == m || m.isDescendantOf(this._attachedNode)
            }

            this._pointerObserver = this._scene.onPointerObservable.add((pointerInfo, eventState)=>{
                if(!this.enabled){
                    return;
                }
                
                if (pointerInfo.type == BABYLON.PointerEventTypes.POINTERDOWN) {
                    
                    if(!this.dragging && pointerInfo.pickInfo && pointerInfo.pickInfo.hit && pointerInfo.pickInfo.pickedMesh && pointerInfo.pickInfo.ray && pickPredicate(pointerInfo.pickInfo.pickedMesh)){
                        this._updateDragPlanePosition(pointerInfo.pickInfo.ray);
                        var pickedPoint = this._pickWithRayOnDragPlane(pointerInfo.pickInfo.ray);
                        if(pickedPoint){
                            this.dragging = true;
                            this.currentDraggingPointerID = (<PointerEvent>pointerInfo.event).pointerId;
                            this.lastDragPosition.copyFrom(pickedPoint);
                            this.onDragStartObservable.notifyObservers({dragPlanePoint: pickedPoint, pointerId: this.currentDraggingPointerID});
                        }
                    }
                }else if(pointerInfo.type == BABYLON.PointerEventTypes.POINTERUP){
                    if(this.currentDraggingPointerID == (<PointerEvent>pointerInfo.event).pointerId){
                        this.releaseDrag();
                    }
                }else if(pointerInfo.type == BABYLON.PointerEventTypes.POINTERMOVE){
                    if(this.currentDraggingPointerID == (<PointerEvent>pointerInfo.event).pointerId && this.dragging && pointerInfo.pickInfo && pointerInfo.pickInfo.ray){
                        var pickedPoint = this._pickWithRayOnDragPlane(pointerInfo.pickInfo.ray);
                        
                         // Get angle between drag plane and ray. Only update the drag plane at non steep angles to avoid jumps in delta position
                        var angle = Math.acos(Vector3.Dot(this._dragPlane.forward, pointerInfo.pickInfo.ray.direction));
                        if(angle < this._maxDragAngle){
                            this._updateDragPlanePosition(pointerInfo.pickInfo.ray);
                        }
                        
                        if (pickedPoint) {
                            // depending on the drag mode option drag accordingly
                            if(this.options.dragAxis){
                                // Convert local drag axis to world
                                var worldDragAxis = Vector3.TransformCoordinates(this.options.dragAxis, this._attachedNode.getWorldMatrix().getRotationMatrix());

                                // Project delta drag from the drag plane onto the drag axis
                                dragLength = BABYLON.Vector3.Dot(pickedPoint.subtract(this.lastDragPosition), worldDragAxis)
                                worldDragAxis.scaleToRef(dragLength, delta);
                            }else{
                                dragLength = delta.length();
                                pickedPoint.subtractToRef(this.lastDragPosition, delta);
                            }
                            if(this.moveAttached){
                                (<Mesh>this._attachedNode).setAbsolutePosition((<Mesh>this._attachedNode).absolutePosition.add(delta));
                            }
                            this.onDragObservable.notifyObservers({dragDistance: dragLength, delta: delta, dragPlanePoint: pickedPoint, dragPlaneNormal: this._dragPlane.forward, pointerId: this.currentDraggingPointerID});
                            this.lastDragPosition.copyFrom(pickedPoint);
                        }
                    }
                }
            });
        }

        public releaseDrag(){
            this.dragging = false;
            this.onDragEndObservable.notifyObservers({dragPlanePoint: this.lastDragPosition, pointerId: this.currentDraggingPointerID});
            this.currentDraggingPointerID = -1;
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
            var pointA = this._dragPlaneParent ? this._dragPlaneParent.absolutePosition : (<Mesh>this._attachedNode).absolutePosition;
            if(this.options.dragAxis){
                var localAxis = this.useObjectOrienationForDragging ? Vector3.TransformCoordinates(this.options.dragAxis, this._attachedNode.getWorldMatrix().getRotationMatrix()) : this.options.dragAxis;

                // Calculate plane normal in direction of camera but perpendicular to drag axis
                var pointB = pointA.add(localAxis); // towards drag axis
                var pointC = pointA.add(ray.origin.subtract(pointA).normalize()); // towards camera
                // Get perpendicular line from direction to camera and drag axis
                var lineA = pointB.subtract(pointA);
                var lineB = pointC.subtract(pointA);
                var perpLine = BABYLON.Vector3.Cross(lineA, lineB);
                // Get perpendicular line from previous result and drag axis to adjust lineB to be perpendiculat to camera
                var norm = BABYLON.Vector3.Cross(lineA, perpLine).normalize();

                this._dragPlane.position.copyFrom(pointA);
                this._dragPlane.lookAt(pointA.subtract(norm));
            }else if(this.options.dragPlaneNormal){
                var localAxis = this.useObjectOrienationForDragging ? Vector3.TransformCoordinates(this.options.dragPlaneNormal, this._attachedNode.getWorldMatrix().getRotationMatrix()) : this.options.dragPlaneNormal;
                this._dragPlane.position.copyFrom(pointA);
                this._dragPlane.lookAt(pointA.subtract(localAxis));
            }else{
                this._dragPlane.position.copyFrom(pointA);
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
        }
    }
}