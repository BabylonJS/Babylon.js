module BABYLON {
    class PointerDragBehavior implements Behavior<Mesh> {
        private _attachedNode: Node; 
        private _dragPlane: Mesh
        private _scene:Scene
        
        // Fires each time the attached mesh is dragged with the pointer
        public onDragObservable = new Observable<{delta:Vector3, dragPlanePoint:Vector3}>()
        public onDragStartObservable = new Observable<{dragPlanePoint:Vector3}>()
        public onDragEndObservable = new Observable<{dragPlanePoint:Vector3}>()
        // If  the attached mesh should be moved when dragged
        public moveAttached = true;
        // Mesh with the position where the drag plane should be placed
        public _dragPlaneParent:Nullable<Mesh>=null
        public dragging = false;
        constructor(private options:{axis?:Vector3, normal?:Vector3}){    
        }

        public get name(): string {
            return "Dragable";
        }

        public init() {}

        public attach(ownerNode: Node): void {
            this._scene = ownerNode.getScene()
            this._attachedNode = ownerNode;
            this._dragPlane = BABYLON.Mesh.CreatePlane("", 100, this._scene, false, BABYLON.Mesh.DOUBLESIDE);
            this._dragPlane.visibility = 0
            this._dragPlane.setEnabled(false)

            // State of the drag
            this.dragging = false
            var lastPos:Nullable<BABYLON.Vector3> = null

            this._scene.onPointerObservable.add((pointerInfo)=>{
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
            this._scene.onBeforeRenderObservable.add(()=>{
                this.updateDragPlanePosition();
            })
        }

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

        public detach(): void {

        }
    }

    class Gizmo {
        protected _rootMesh:Mesh
        protected _selectedMesh:Nullable<AbstractMesh> = null
        protected _dragBehavior:Nullable<PointerDragBehavior> // TODO should this be here?
        constructor(protected _renderer:GizmoRenderer){
            // Set selected mesh when scene is clicked
            this._renderer.gizmoForegroundScene.onPointerObservable.add((pointerInfo)=>{
                switch (pointerInfo.type) {
                    case BABYLON.PointerEventTypes.POINTERDOWN:
                        var pickResult = this._renderer.gizmoForegroundScene.pick(pointerInfo.event.offsetX, pointerInfo.event.offsetY)
                        if(pickResult && pickResult.hit && pickResult.pickedMesh){
                            // Do not change selected mesh if a gizmo is hit
                            break;
                        }
                        pickResult = this._renderer.originalScene.pick(pointerInfo.event.offsetX, pointerInfo.event.offsetY)
                        if (pickResult && pickResult.hit && pickResult.pickedMesh) {
                            this._selectedMesh = pickResult.pickedMesh
                            if(this._dragBehavior){
                                this._dragBehavior._dragPlaneParent = <Mesh>this._selectedMesh
                            }
                        }
                        break;
                }
            })

            // Update arrow position to that of the selected mesh but always at the same distance from the camera
            this._renderer.gizmoForegroundScene.onBeforeRenderObservable.add(()=>{
                if(this._selectedMesh && this._renderer.gizmoForegroundScene.activeCamera){
                    var camPos = this._renderer.gizmoForegroundScene.activeCamera.position

                    var direction = this._selectedMesh.getAbsolutePosition().clone().subtract(camPos).normalize().scaleInPlace(3)
                    var newPose = camPos.add(direction)
                    this._rootMesh.position.copyFrom(newPose)
                }
            })
        }
    }
    class DragDirectionGizmo extends Gizmo {
        constructor(renderer:GizmoRenderer, dragAxis: Vector3, color: Color3){
            super(renderer);
             // Create Material
            var coloredMaterial = new BABYLON.StandardMaterial("", renderer.gizmoForegroundScene)
            coloredMaterial.emissiveColor = color

            // Build mesh within a root node
            this._rootMesh = new BABYLON.Mesh("",renderer.gizmoForegroundScene)
            var arrowMesh = BABYLON.MeshBuilder.CreateCylinder("yPosMesh", {diameterTop:0, height: 2, tessellation: 96}, renderer.gizmoForegroundScene);
            var arrowTail = BABYLON.MeshBuilder.CreateCylinder("yPosMesh", {diameter:0.03, height: 0.2, tessellation: 96}, renderer.gizmoForegroundScene);
            this._rootMesh.addChild(arrowMesh)
            this._rootMesh.addChild(arrowTail)

            // Position arrow pointing in its drag axis
            arrowMesh.scaling.scaleInPlace(0.1)
            arrowMesh.material = coloredMaterial
            arrowMesh.rotation.x = Math.PI/2
            arrowMesh.position.z+=0.3
            arrowTail.rotation.x = Math.PI/2
            arrowTail.material = coloredMaterial
            arrowTail.position.z+=0.3-0.1
            this._rootMesh.lookAt(this._rootMesh.position.subtract(dragAxis))

            // Add drag behavior to handle events when the gizmo is dragged
            this._dragBehavior = new PointerDragBehavior({axis: dragAxis})
            this._dragBehavior.moveAttached = false
            this._rootMesh.addBehavior(this._dragBehavior)
            this._dragBehavior.onDragObservable.add((event)=>{
                if(this._selectedMesh){
                    this._selectedMesh.position.addInPlace(event.delta)
                }
            })
        }
    }

    class DragRotationGizmo extends Gizmo {
        constructor(renderer:GizmoRenderer, normal: Vector3, color: Color3){
            super(renderer);
            // Create Material
            var coloredMaterial = new BABYLON.StandardMaterial("", renderer.gizmoForegroundScene)
            coloredMaterial.emissiveColor = color

            // Build mesh within a root node
            this._rootMesh = new BABYLON.Mesh("",renderer.gizmoForegroundScene)
            var rotationMesh = BABYLON.Mesh.CreateTorus("torus", 5, 0.2, 20, renderer.gizmoForegroundScene, false);
            this._rootMesh.addChild(rotationMesh)

            // Position pointing at normal
            rotationMesh.scaling.scaleInPlace(0.1)
            rotationMesh.material = coloredMaterial
            rotationMesh.rotation.x = Math.PI/2
            this._rootMesh.lookAt(this._rootMesh.position.subtract(normal))

            // Add drag behavior to handle events when the gizmo is dragged
            this._dragBehavior = new PointerDragBehavior({normal: normal})
            this._dragBehavior.moveAttached = false
            this._rootMesh.addBehavior(this._dragBehavior)

            var lastDragPosition:Nullable<Vector3> = null
            this._dragBehavior.onDragStartObservable.add((e)=>{
                lastDragPosition = e.dragPlanePoint
            })
            
            this._dragBehavior.onDragObservable.add((event)=>{
                if(this._selectedMesh && lastDragPosition){
                    if(!this._selectedMesh.rotationQuaternion){
                        this._selectedMesh.rotationQuaternion = new BABYLON.Quaternion()
                    }
                    // Calc angle over full degree (https://stackoverflow.com/questions/43493711/the-angle-between-two-3d-vectors-with-a-result-range-0-360)
                    var a = event.dragPlanePoint.subtract(this._selectedMesh.position).normalize()
                    var b = lastDragPosition.subtract(this._selectedMesh.position).normalize()
                    var cross = Vector3.Cross(a,b)
                    var dot = Vector3.Dot(a,b)
                    var angle = Math.atan2(cross.length(), dot)
                    var up = normal.clone()
                    // Flip up vector depending on which side the camera is on
                    if(renderer.gizmoForegroundScene.activeCamera){
                        var camVec = renderer.gizmoForegroundScene.activeCamera.position.subtract(this._selectedMesh.position) 
                        if(Vector3.Dot(camVec, up) > 0){
                            up.scaleInPlace(-1)
                        }
                    }
                    var test = Vector3.Dot(up, cross);
                    if (test < 0.0) angle = -angle;
                    angle *= -1

                    // Convert angle and axis to quaternion (http://www.euclideanspace.com/maths/geometry/rotations/conversions/angleToQuaternion/index.htm)
                    var s = Math.sin(angle/2)
                    var q = new BABYLON.Quaternion(up.x*s,up.y*s,up.z*s,Math.cos(angle/2))

                    if(!isNaN(angle)){
                        // Rotate selected mesh quaternion over fixed axis
                        q.multiplyToRef(this._selectedMesh.rotationQuaternion,this._selectedMesh.rotationQuaternion)

                        // Rotate selected mesh quaternion over non fixed gizmo
                        //this._selectedMesh.rotationQuaternion.multiplyInPlace(q)

                        
                    }
                    lastDragPosition = event.dragPlanePoint
                }
            })
        }
    }

    class DragPlaneGizmo extends Gizmo {
        constructor(renderer:GizmoRenderer, normal: Vector3, color: Color3){
            super(renderer);

            // Create Material
            var coloredMaterial = new BABYLON.StandardMaterial("", renderer.gizmoForegroundScene)
            coloredMaterial.emissiveColor = color

            // Build mesh within a root node
            this._rootMesh = new BABYLON.Mesh("",renderer.gizmoForegroundScene)
            var planeMesh = BABYLON.Mesh.CreatePlane("plane", 1.0, renderer.gizmoForegroundScene, false, Mesh.DOUBLESIDE);
            this._rootMesh.addChild(planeMesh)

            // Position pointing at normal
            planeMesh.scaling.scaleInPlace(0.1)
            planeMesh.material = coloredMaterial
            planeMesh.lookAt(this._rootMesh.position.subtract(normal))
            planeMesh.position.addInPlace(normal.subtract(new Vector3(1,1,1)).scale(-0.1))
            
            // Add drag behavior to handle events when the gizmo is dragged
            this._dragBehavior = new PointerDragBehavior({normal: normal})
            this._dragBehavior.moveAttached = false
            this._rootMesh.addBehavior(this._dragBehavior)
            this._dragBehavior.onDragObservable.add((event)=>{
                if(this._selectedMesh){
                    this._selectedMesh.position.addInPlace(event.delta)
                }
            })
        }
    }

    export class GizmoRenderer {
        public gizmoForegroundScene:Scene
        //private light:HemisphericLight
        constructor(public originalScene:Scene){
            // Create gizmo scene which will be rendered in the foreground and remove it from being referenced by engine to avoid interfering with existing app
            this.gizmoForegroundScene = new BABYLON.Scene(originalScene.getEngine());
            originalScene.getEngine().scenes.pop();

            // Render directly on top of existing scene
            this.gizmoForegroundScene.clearColor = new BABYLON.Color4(0,0,0,0);
            this.gizmoForegroundScene.autoClear = false;
            
            // Gizmo lighting
            //this.light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), this.gizmoForegroundScene);

            // Create position gizmo
            new DragDirectionGizmo(this,new BABYLON.Vector3(0,1,0),BABYLON.Color3.FromHexString("#00b894"));
            new DragDirectionGizmo(this,new BABYLON.Vector3(1,0,0),BABYLON.Color3.FromHexString("#d63031"));
            new DragDirectionGizmo(this,new BABYLON.Vector3(0,0,1),BABYLON.Color3.FromHexString("#0984e3"));

            // Create rotation gizmo
            new DragRotationGizmo(this,new BABYLON.Vector3(0,1,0),BABYLON.Color3.FromHexString("#00b894"));
            new DragRotationGizmo(this,new BABYLON.Vector3(1,0,0),BABYLON.Color3.FromHexString("#d63031"));
            new DragRotationGizmo(this,new BABYLON.Vector3(0,0,1),BABYLON.Color3.FromHexString("#0984e3"));

            // Create plane position gizmo
            new DragPlaneGizmo(this,new BABYLON.Vector3(0,1,0),BABYLON.Color3.FromHexString("#705A8A"));
            new DragPlaneGizmo(this,new BABYLON.Vector3(1,0,0),BABYLON.Color3.FromHexString("#059EBC"));
            new DragPlaneGizmo(this,new BABYLON.Vector3(0,0,1),BABYLON.Color3.FromHexString("#6B7463"));
            

            originalScene.onAfterRenderObservable.add(()=>{
                // Render
                this.gizmoForegroundScene.activeCamera=this.originalScene.activeCamera
                this.gizmoForegroundScene.render()
            })
        }
    }
} 