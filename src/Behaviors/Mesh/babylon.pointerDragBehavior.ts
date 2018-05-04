module BABYLON {
    /**
     * A behavior that when attached to a mesh will allow the mesh to be dragged around the screen based on pointer events
     */
    export class PointerDragBehavior implements Behavior<Mesh> {
        private _attachedNode: Node; 
        private _dragPlane: Mesh;
        private _scene:Scene;
        private _pointerObserver:Nullable<Observer<PointerInfo>>
        private _beforeRenderObserver:Nullable<Observer<Scene>>
        
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
         *  If  the attached mesh should be moved when dragged
         */
        public moveAttached = true;
        /**
         *  Mesh with the position where the drag plane should be placed
         */
        public _dragPlaneParent:Nullable<Mesh>=null
        /**
         *  If the attached mesh is currently being dragged
         */
        public dragging = false;
        /**
         * Creates a pointer drag behavior that can be attached to a mesh
         * @param options The drag axis or normal of the plane that will be dragged accross
         */
        constructor(private options:{axis?:Vector3, normal?:Vector3}){    
        }

        /**
         *  the name of the behavior
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
            this._scene = ownerNode.getScene()
            this._attachedNode = ownerNode;
            this._dragPlane = BABYLON.Mesh.CreatePlane("", 100, this._scene, false, BABYLON.Mesh.DOUBLESIDE);
            this._dragPlane.visibility = 0
            this._dragPlane.setEnabled(false)

            // State of the drag
            this.dragging = false
            var lastPos:Nullable<BABYLON.Vector3> = null

            this._pointerObserver = this._scene.onPointerObservable.add((pointerInfo)=>{
                switch (pointerInfo.type) {
                    case BABYLON.PointerEventTypes.POINTERDOWN:
                        var pickResult = this._scene.pick(pointerInfo.event.offsetX, pointerInfo.event.offsetY)
                        if(pickResult && pickResult.hit && pickResult.pickedMesh){
                            if(this._attachedNode.getChildren().indexOf(pickResult.pickedMesh)!=-1){
                                this.dragging = true
                                this._dragPlane.setEnabled(true)
                                lastPos = null;
                                this.updateDragPlanePosition();
                                var pickResult = this._scene.pick(pointerInfo.event.offsetX, pointerInfo.event.offsetY, (m)=>{return m == this._dragPlane})
                                if (pickResult && pickResult.hit && pickResult.pickedMesh && pickResult.pickedPoint) {
                                    this.onDragStartObservable.notifyObservers({dragPlanePoint: pickResult.pickedPoint})
                                }
                            }
                            break;
                        }
                        break;
                    case BABYLON.PointerEventTypes.POINTERUP:
                        this.dragging = false
                        this._dragPlane.setEnabled(false)
                        break;
                    case BABYLON.PointerEventTypes.POINTERMOVE:
                        if(this.dragging){
                            var pickResult = this._scene.pick(pointerInfo.event.offsetX, pointerInfo.event.offsetY, (m)=>{return m == this._dragPlane})
                            if (pickResult && pickResult.hit && pickResult.pickedMesh && pickResult.pickedPoint) {
                                    if(lastPos){
                                        var delta:Vector3;
                                        if(this.options.axis){
                                            //get the closest point on the dragaxis from the selected mesh to the picked point location
                                            // https://www.opengl.org/discussion_boards/showthread.php/159717-Closest-point-on-a-Vector-to-a-point
                                            var axis =this.options.axis.clone()
                                            delta = axis.scaleInPlace(BABYLON.Vector3.Dot(pickResult.pickedPoint.subtract(lastPos), axis));
                                            if(this.moveAttached){
                                                (<Mesh>this._attachedNode).position.addInPlace(delta)//.y = pickResult.pickedPoint.y
                                            }
                                        }else{
                                            delta = pickResult.pickedPoint.subtract(lastPos)
                                        }
                                        this.onDragObservable.notifyObservers({delta: delta, dragPlanePoint: pickResult.pickedPoint})
                                    }
                                    lastPos = pickResult.pickedPoint.clone()
                                
                            }
                        }
                        break;
                }
            })
            // Create the drag plane correctly
            this._beforeRenderObserver = this._scene.onBeforeRenderObservable.add(()=>{
                this.updateDragPlanePosition();
            })
        }

        // Position the drag plane based on the attached mesh position, for single axis rotate the plane along the axis to face the camera
        private updateDragPlanePosition(){
            if(this.dragging && this._scene.activeCamera){
                var pointA = this._dragPlaneParent ? this._dragPlaneParent.position : (<Mesh>this._attachedNode).position // center
                if(this.options.axis){
                    var camPos = this._scene.activeCamera.position
                
                    // Calculate plane normal in direction of camera but perpendicular to drag axis
                    var pointB = pointA.add(this.options.axis) // towards drag axis
                    var pointC = pointA.add(camPos.subtract(pointA).normalize()) // towards camera
                    // Get perpendicular line from direction to camera and drag axis
                    var lineA = pointB.subtract(pointA)
                    var lineB = pointC.subtract(pointA)
                    var perpLine = BABYLON.Vector3.Cross(lineA, lineB)
                    // Get perpendicular line from previous result and drag axis to adjust lineB to be perpendiculat to camera
                    var norm = BABYLON.Vector3.Cross(lineA, perpLine).normalize()

                    this._dragPlane.position = pointA.clone()
                    this._dragPlane.lookAt(pointA.add(norm))
                }else if(this.options.normal){
                    this._dragPlane.position = pointA.clone()
                    this._dragPlane.lookAt(pointA.add(this.options.normal))
                }
            }
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