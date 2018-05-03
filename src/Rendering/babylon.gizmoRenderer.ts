module BABYLON {
    class DragDIrectionGizmo {
        constructor(renderer:GizmoRenderer, dragAxis: Vector3, color: Color3){
            // TODO move to existing class and use behaviors (Test scene: http://localhost:1338/Playground/index-local.html#CN8VII#3)

            // Create mesh
            var coloredMaterial = new BABYLON.StandardMaterial("", renderer.gizmoForegroundScene)
            coloredMaterial.emissiveColor = color

            // Build and arrow mesh within a root node
            var rootMesh = new BABYLON.Mesh("",renderer.gizmoForegroundScene)
            var arrowMesh = BABYLON.MeshBuilder.CreateCylinder("yPosMesh", {diameterTop:0, height: 2, tessellation: 96}, renderer.gizmoForegroundScene);
            var arrowTail = BABYLON.MeshBuilder.CreateCylinder("yPosMesh", {diameter:0.03, height: 0.2, tessellation: 96}, renderer.gizmoForegroundScene);
            rootMesh.addChild(arrowMesh)
            rootMesh.addChild(arrowTail)

            // Position arrow pointing in its drag axis
            arrowMesh.scaling.scaleInPlace(0.1)
            arrowMesh.material = coloredMaterial
            arrowMesh.rotation.x = Math.PI/2
            arrowMesh.position.z+=0.3
            arrowTail.rotation.x = Math.PI/2
            arrowTail.material = coloredMaterial
            arrowTail.position.z+=0.3-0.1
            rootMesh.lookAt(rootMesh.position.subtract(dragAxis))

            // Store which mesh is currently selected
            var selectedMesh:any = null

            // Create drag plane which will be the plane the mesh is dragged on
            var plane = BABYLON.Mesh.CreatePlane("", 100, renderer.gizmoForegroundScene, false, BABYLON.Mesh.DOUBLESIDE);
            plane.visibility = 0
            plane.setEnabled(false)

            // State of the drag
            var dragging = false
            var lastPos:Nullable<BABYLON.Vector3> = null

            // Handle pointer interactions to start, stop and drag
            renderer.gizmoForegroundScene.onPointerObservable.add((pointerInfo)=>{
                switch (pointerInfo.type) {
                    case BABYLON.PointerEventTypes.POINTERDOWN:
                        var pickResult = renderer.gizmoForegroundScene.pick(pointerInfo.event.offsetX, pointerInfo.event.offsetY)
                        if(pickResult && pickResult.hit && pickResult.pickedMesh){
                            if(rootMesh.getChildren().indexOf(pickResult.pickedMesh)!=-1){
                                dragging = true
                                plane.setEnabled(true)
                                lastPos = null;
                            }
                            break;
                        }
                        pickResult = renderer.originalScene.pick(pointerInfo.event.offsetX, pointerInfo.event.offsetY)
                        if (pickResult && pickResult.hit && pickResult.pickedMesh) {
                            selectedMesh = pickResult.pickedMesh
                        }
                        break;
                    case BABYLON.PointerEventTypes.POINTERUP:
                        dragging = false
                        plane.setEnabled(false)
                        break;
                    case BABYLON.PointerEventTypes.POINTERMOVE:
                        if(dragging){
                            var pickResult = renderer.gizmoForegroundScene.pick(pointerInfo.event.offsetX, pointerInfo.event.offsetY, (m)=>{return m == plane})
                            if (pickResult && pickResult.hit && pickResult.pickedMesh && pickResult.pickedPoint) {
                                
                                //get the closest point on the dragaxis from the selected mesh to the picked point location
                                // https://www.opengl.org/discussion_boards/showthread.php/159717-Closest-point-on-a-Vector-to-a-point
                                if(lastPos){
                                    var pos = dragAxis.clone().scaleInPlace(BABYLON.Vector3.Dot(pickResult.pickedPoint.subtract(lastPos), dragAxis))
                                    selectedMesh.position.addInPlace(pos)//.y = pickResult.pickedPoint.y
                                }
                                
                                lastPos = pickResult.pickedPoint.clone()
                            }
                        }
                        break;
                }
            })

            // Update arrow position to that of the mesh, create the appropriate plane to drag on a given axis
            renderer.gizmoForegroundScene.onBeforeRenderObservable.add(()=>{
                if(selectedMesh && renderer.gizmoForegroundScene.activeCamera){
                    var camPos = renderer.gizmoForegroundScene.activeCamera.position

                    var direction = selectedMesh.getAbsolutePosition().clone().subtract(camPos).normalize().scaleInPlace(3)
                    var newPose = camPos.add(direction)
                    rootMesh.position.copyFrom(newPose)
                    
                    // Calculate plane normal in direction of camera but perpendicular to drag axis
                    var pointA = selectedMesh.position // center
                    var pointB = pointA.add(dragAxis) // towards drag axis
                    var pointC = pointA.add(camPos.subtract(pointA).normalize()) // towards camera
                    // Get perpendicular line from direction to camera and drag axis
                    var lineA = pointB.subtract(pointA)
                    var lineB = pointC.subtract(pointA)
                    var perpLine = BABYLON.Vector3.Cross(lineA, lineB)
                    // Get perpendicular line from previous result and drag axis to adjust lineB to be perpendiculat to camera
                    var norm = BABYLON.Vector3.Cross(lineA, perpLine).normalize()

                    plane.position = pointA.clone()
                    plane.lookAt(pointA.add(norm))
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

            new DragDIrectionGizmo(this,new BABYLON.Vector3(0,1,0),BABYLON.Color3.FromHexString("#00b894"));
            new DragDIrectionGizmo(this,new BABYLON.Vector3(1,0,0),BABYLON.Color3.FromHexString("#d63031"));
            new DragDIrectionGizmo(this,new BABYLON.Vector3(0,0,1),BABYLON.Color3.FromHexString("#0984e3"));

            originalScene.onAfterRenderObservable.add(()=>{
                this.render();
            })
        }
        private render(){
            this.gizmoForegroundScene.activeCamera=this.originalScene.activeCamera
            this.gizmoForegroundScene.render()
        }
    }
} 