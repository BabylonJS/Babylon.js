module BABYLON {
    /**
     * Bounding box gizmo
     */
    export class BoundingBoxGizmo extends Gizmo {
        private _lineBoundingBox:AbstractMesh;
        private _rotateSpheresParent:AbstractMesh;
        private _scaleBoxesParent:AbstractMesh;
        private _boundingDimensions = new BABYLON.Vector3(1,1,1);
        private _renderObserver:Nullable<Observer<Scene>> = null;
        private _pointerObserver:Nullable<Observer<PointerInfo>> = null;
        private _scaleDragSpeed = 0.2;

        private _tmpQuaternion = new Quaternion();
        private _tmpVector = new Vector3(0,0,0);

        /**
         * The size of the rotation spheres attached to the bounding box (Default: 0.1)
         */
        public rotationSphereSize = 0.1;
        /**
         * The size of the scale boxes attached to the bounding box (Default: 0.1)
         */
        public scaleBoxSize = 0.1;
        /**
         * If set, the rotation spheres and scale boxes will increase in size based on the distance away from the camera to have a consistent screen size (Default: false)
         */
        public fixedDragMeshScreenSize = false;

        /**
         * The distance away from the object which the draggable meshes should appear world sized when fixedDragMeshScreenSize is set to true (default: 10)
         */
        public fixedDragMeshScreenSizeDistanceFactor = 10;
        /**
         * Fired when a rotation sphere or scale box is dragged
         */
        public onDragStartObservable = new Observable<{}>();
        /**
         * Fired when a rotation sphere or scale box drag is started
         */
        public onDragObservable = new Observable<{}>();
        /**
         * Fired when a rotation sphere or scale box drag is needed
         */
        public onDragEndObservable = new Observable<{}>();
        private _anchorMesh:AbstractMesh;
        /**
         * Creates an BoundingBoxGizmo
         * @param gizmoLayer The utility layer the gizmo will be added to
         * @param color The color of the gizmo
         */
        constructor(color:Color3 = Color3.Gray(), gizmoLayer:UtilityLayerRenderer = UtilityLayerRenderer.DefaultKeepDepthUtilityLayer){
            super(gizmoLayer);

            // Do not update the gizmo's scale so it has a fixed size to the object its attached to
            this._updateScale = false;

            this._anchorMesh = new AbstractMesh("anchor", gizmoLayer.utilityLayerScene);
            // Create Materials
            var coloredMaterial = new BABYLON.StandardMaterial("", gizmoLayer.utilityLayerScene);
            coloredMaterial.disableLighting = true;
            coloredMaterial.emissiveColor = color;
            var hoverColoredMaterial = new BABYLON.StandardMaterial("", gizmoLayer.utilityLayerScene);
            hoverColoredMaterial.disableLighting = true;
            hoverColoredMaterial.emissiveColor = color.clone().add(new Color3(0.2,0.2,0.2));

            // Build bounding box out of lines
            this._lineBoundingBox = new BABYLON.AbstractMesh("", gizmoLayer.utilityLayerScene);
            this._lineBoundingBox.rotationQuaternion = new BABYLON.Quaternion();
            var lines = []
            lines.push(BABYLON.MeshBuilder.CreateLines("lines", {points: [new BABYLON.Vector3(0,0,0), new BABYLON.Vector3(this._boundingDimensions.x,0,0)]}, gizmoLayer.utilityLayerScene));
            lines.push(BABYLON.MeshBuilder.CreateLines("lines", {points: [new BABYLON.Vector3(0,0,0), new BABYLON.Vector3(0,this._boundingDimensions.y,0)]}, gizmoLayer.utilityLayerScene));
            lines.push(BABYLON.MeshBuilder.CreateLines("lines", {points: [new BABYLON.Vector3(0,0,0), new BABYLON.Vector3(0,0,this._boundingDimensions.z)]}, gizmoLayer.utilityLayerScene));
            lines.push(BABYLON.MeshBuilder.CreateLines("lines", {points: [new BABYLON.Vector3(this._boundingDimensions.x,0,0), new BABYLON.Vector3(this._boundingDimensions.x,this._boundingDimensions.y,0)]}, gizmoLayer.utilityLayerScene));
            lines.push(BABYLON.MeshBuilder.CreateLines("lines", {points: [new BABYLON.Vector3(this._boundingDimensions.x,0,0), new BABYLON.Vector3(this._boundingDimensions.x,0,this._boundingDimensions.z)]}, gizmoLayer.utilityLayerScene));
            lines.push(BABYLON.MeshBuilder.CreateLines("lines", {points: [new BABYLON.Vector3(0,this._boundingDimensions.y,0), new BABYLON.Vector3(this._boundingDimensions.x,this._boundingDimensions.y,0)]}, gizmoLayer.utilityLayerScene));
            lines.push(BABYLON.MeshBuilder.CreateLines("lines", {points: [new BABYLON.Vector3(0,this._boundingDimensions.y,0), new BABYLON.Vector3(0,this._boundingDimensions.y,this._boundingDimensions.z)]}, gizmoLayer.utilityLayerScene));
            lines.push(BABYLON.MeshBuilder.CreateLines("lines", {points: [new BABYLON.Vector3(0,0,this._boundingDimensions.z), new BABYLON.Vector3(this._boundingDimensions.x,0,this._boundingDimensions.z)]}, gizmoLayer.utilityLayerScene));
            lines.push(BABYLON.MeshBuilder.CreateLines("lines", {points: [new BABYLON.Vector3(0,0,this._boundingDimensions.z), new BABYLON.Vector3(0,this._boundingDimensions.y,this._boundingDimensions.z)]}, gizmoLayer.utilityLayerScene));
            lines.push(BABYLON.MeshBuilder.CreateLines("lines", {points: [new BABYLON.Vector3(this._boundingDimensions.x,this._boundingDimensions.y,this._boundingDimensions.z), new BABYLON.Vector3(0,this._boundingDimensions.y,this._boundingDimensions.z)]}, gizmoLayer.utilityLayerScene));
            lines.push(BABYLON.MeshBuilder.CreateLines("lines", {points: [new BABYLON.Vector3(this._boundingDimensions.x,this._boundingDimensions.y,this._boundingDimensions.z), new BABYLON.Vector3(this._boundingDimensions.x,0,this._boundingDimensions.z)]}, gizmoLayer.utilityLayerScene));
            lines.push(BABYLON.MeshBuilder.CreateLines("lines", {points: [new BABYLON.Vector3(this._boundingDimensions.x,this._boundingDimensions.y,this._boundingDimensions.z), new BABYLON.Vector3(this._boundingDimensions.x,this._boundingDimensions.y,0)]}, gizmoLayer.utilityLayerScene));
            lines.forEach((l)=>{
                l.color = color
                l.position.addInPlace(new BABYLON.Vector3(-this._boundingDimensions.x/2,-this._boundingDimensions.y/2,-this._boundingDimensions.z/2))
                l.isPickable=false;
                this._lineBoundingBox.addChild(l)
            })
            this._rootMesh.addChild(this._lineBoundingBox);

            // Create rotation spheres
            this._rotateSpheresParent = new BABYLON.AbstractMesh("", gizmoLayer.utilityLayerScene);
            this._rotateSpheresParent.rotationQuaternion = new Quaternion();
            for(let i=0;i<12;i++){
                let sphere = BABYLON.MeshBuilder.CreateSphere("", {diameter: 1}, gizmoLayer.utilityLayerScene);
                sphere.rotationQuaternion = new Quaternion();
                sphere.material = coloredMaterial;

                // Drag behavior
                var _dragBehavior = new PointerDragBehavior({});
                _dragBehavior.moveAttached = false;
                _dragBehavior.updateDragPlane = false;
                sphere.addBehavior(_dragBehavior);
                let startingTurnDirection = new Vector3(1,0,0);
                let totalTurnAmountOfDrag = 0;
                _dragBehavior.onDragStartObservable.add((event)=>{
                    startingTurnDirection.copyFrom(sphere.forward);
                    totalTurnAmountOfDrag = 0;
                })
                _dragBehavior.onDragObservable.add((event)=>{
                    this.onDragObservable.notifyObservers({});
                    if(this.attachedMesh){
                        var worldDragDirection = startingTurnDirection;

                        // Project the world right on to the drag plane
                        var toSub = event.dragPlaneNormal.scale(Vector3.Dot(event.dragPlaneNormal, worldDragDirection));
                        var dragAxis = worldDragDirection.subtract(toSub).normalizeToNew();

                        // project drag delta on to the resulting drag axis and rotate based on that
                        var projectDist = -Vector3.Dot(dragAxis, event.delta);

                        // Rotate based on axis
                        if(!this.attachedMesh.rotationQuaternion){
                            this.attachedMesh.rotationQuaternion = Quaternion.RotationYawPitchRoll(this.attachedMesh.rotation.y,this.attachedMesh.rotation.x,this.attachedMesh.rotation.z);
                        }
                        if(!this._anchorMesh.rotationQuaternion){
                            this._anchorMesh.rotationQuaternion = Quaternion.RotationYawPitchRoll(this._anchorMesh.rotation.y,this._anchorMesh.rotation.x,this._anchorMesh.rotation.z);
                        }
                       
                        // Do not allow the object to turn more than a full circle
                        totalTurnAmountOfDrag+=projectDist;
                        if(Math.abs(totalTurnAmountOfDrag)<=2*Math.PI){
                            if(i>=8){
                                Quaternion.RotationYawPitchRollToRef(0,0,projectDist, this._tmpQuaternion);
                            }else if(i>=4){
                                Quaternion.RotationYawPitchRollToRef(projectDist,0,0, this._tmpQuaternion);
                            }else{
                                Quaternion.RotationYawPitchRollToRef(0,projectDist,0, this._tmpQuaternion);
                            }

                            // Rotate around center of bounding box
                            this._anchorMesh.addChild(this.attachedMesh);
                            this._anchorMesh.rotationQuaternion!.multiplyToRef(this._tmpQuaternion,this._anchorMesh.rotationQuaternion!);
                            this._anchorMesh.removeChild(this.attachedMesh);
                        }
                    }
                });

                // Selection/deselection
                _dragBehavior.onDragStartObservable.add(()=>{
                    this.onDragStartObservable.notifyObservers({});
                    this._selectNode(sphere)
                })
                _dragBehavior.onDragEndObservable.add(()=>{
                    this.onDragEndObservable.notifyObservers({});
                    this._selectNode(null)
                })

                this._rotateSpheresParent.addChild(sphere);
            }
            this._rootMesh.addChild(this._rotateSpheresParent);

            // Create scale cubes
            this._scaleBoxesParent = new BABYLON.AbstractMesh("", gizmoLayer.utilityLayerScene);
            this._scaleBoxesParent.rotationQuaternion = new Quaternion();
            for(var i=0;i<2;i++){
                for(var j=0;j<2;j++){
                    for(var k=0;k<2;k++){
                        let box = BABYLON.MeshBuilder.CreateBox("", {size: 1}, gizmoLayer.utilityLayerScene);
                        box.material = coloredMaterial;

                        // Dragging logic
                        let dragAxis = new BABYLON.Vector3(i==0?-1:1,j==0?-1:1,k==0?-1:1);
                        var _dragBehavior = new PointerDragBehavior({dragAxis: dragAxis});
                        _dragBehavior.moveAttached = false;
                        box.addBehavior(_dragBehavior);
                        _dragBehavior.onDragObservable.add((event)=>{
                            this.onDragObservable.notifyObservers({});
                            if(this.attachedMesh){
                                var deltaScale = new Vector3(event.dragDistance,event.dragDistance,event.dragDistance);
                                deltaScale.scaleInPlace(this._scaleDragSpeed);
                                this._updateBoundingBox(); 

                                 // Scale from the position of the opposite corner                   
                                box.absolutePosition.subtractToRef(this._anchorMesh.position, this._tmpVector);
                                this._anchorMesh.position.subtractInPlace(this._tmpVector);
                                this._anchorMesh.addChild(this.attachedMesh);
                                this._anchorMesh.scaling.addInPlace(deltaScale);
                                if(this._anchorMesh.scaling.x < 0 || this._anchorMesh.scaling.y < 0 || this._anchorMesh.scaling.z < 0){
                                    this._anchorMesh.scaling.subtractInPlace(deltaScale);
                                }
                                this._anchorMesh.removeChild(this.attachedMesh);
                            }
                        })

                        // Selection/deselection
                        _dragBehavior.onDragStartObservable.add(()=>{
                            this.onDragStartObservable.notifyObservers({});
                            this._selectNode(box)
                        })
                        _dragBehavior.onDragEndObservable.add(()=>{
                            this.onDragEndObservable.notifyObservers({});
                            this._selectNode(null)
                        })

                        this._scaleBoxesParent.addChild(box);
                    }
                }
            }
            this._rootMesh.addChild(this._scaleBoxesParent);

            // Hover color change
            var pointerIds = new Array<AbstractMesh>();
            this._pointerObserver = gizmoLayer.utilityLayerScene.onPointerObservable.add((pointerInfo, eventState)=>{
                if(!pointerIds[(<PointerEvent>pointerInfo.event).pointerId]){
                    this._rotateSpheresParent.getChildMeshes().concat(this._scaleBoxesParent.getChildMeshes()).forEach((mesh)=>{
                        if(pointerInfo.pickInfo && pointerInfo.pickInfo.pickedMesh == mesh){
                            pointerIds[(<PointerEvent>pointerInfo.event).pointerId]=mesh;
                            mesh.material = hoverColoredMaterial;
                        }
                    });
                }else{
                    if(pointerInfo.pickInfo && pointerInfo.pickInfo.pickedMesh != pointerIds[(<PointerEvent>pointerInfo.event).pointerId]){
                        pointerIds[(<PointerEvent>pointerInfo.event).pointerId].material = coloredMaterial;
                        delete pointerIds[(<PointerEvent>pointerInfo.event).pointerId];
                    }
                }
            });

            // Update bounding box positions
            this._renderObserver = this.gizmoLayer.originalScene.onBeforeRenderObservable.add(()=>{
                this._updateBoundingBox();
            })
            this._updateBoundingBox();
        }
        
        protected _attachedMeshChanged(value:Nullable<AbstractMesh>){
            if(value){
                // Reset anchor mesh to match attached mesh's scale
                // This is needed to avoid invalid box/sphere position on first drag
                this._anchorMesh.addChild(value);
                this._anchorMesh.removeChild(value);
                this._updateBoundingBox();
            }
        }

        private _selectNode(selectedMesh:Nullable<Mesh>){
            this._rotateSpheresParent.getChildMeshes()
            .concat(this._scaleBoxesParent.getChildMeshes()).forEach((m,i)=>{
                m.isVisible = (!selectedMesh || m == selectedMesh);
            })
        }

        private _recurseComputeWorld(mesh:AbstractMesh){
            mesh.computeWorldMatrix(true);
            mesh.getChildMeshes().forEach((m)=>{
                this._recurseComputeWorld(m);
            });
        }

        private _updateBoundingBox(){
            if(this.attachedMesh){             
                // Rotate based on axis
                if(!this.attachedMesh.rotationQuaternion){
                    this.attachedMesh.rotationQuaternion = Quaternion.RotationYawPitchRoll(this.attachedMesh.rotation.y,this.attachedMesh.rotation.x,this.attachedMesh.rotation.z);
                }
                if(!this._anchorMesh.rotationQuaternion){
                    this._anchorMesh.rotationQuaternion = Quaternion.RotationYawPitchRoll(this._anchorMesh.rotation.y,this._anchorMesh.rotation.x,this._anchorMesh.rotation.z);
                }
                this._anchorMesh.rotationQuaternion.copyFrom(this.attachedMesh.rotationQuaternion);

                // Store original position and reset mesh to origin before computing the bounding box
                this._tmpQuaternion.copyFrom(this.attachedMesh.rotationQuaternion);
                this._tmpVector.copyFrom(this.attachedMesh.position);
                this.attachedMesh.rotationQuaternion.set(0,0,0,1);
                this.attachedMesh.position.set(0,0,0);
                
                // Update bounding dimensions/positions   
                var boundingMinMax = this.attachedMesh.getHierarchyBoundingVectors();
                boundingMinMax.max.subtractToRef(boundingMinMax.min, this._boundingDimensions);

                // Update gizmo to match bounding box scaling and rotation
                this._lineBoundingBox.scaling.copyFrom(this._boundingDimensions);
                this._lineBoundingBox.position.set((boundingMinMax.max.x+boundingMinMax.min.x)/2,(boundingMinMax.max.y+boundingMinMax.min.y)/2,(boundingMinMax.max.z+boundingMinMax.min.z)/2);
                this._rotateSpheresParent.position.copyFrom(this._lineBoundingBox.position);
                this._scaleBoxesParent.position.copyFrom(this._lineBoundingBox.position);
                this._lineBoundingBox.computeWorldMatrix();
                this._anchorMesh.position.copyFrom(this._lineBoundingBox.absolutePosition);

                // restore position/rotation values
                this.attachedMesh.rotationQuaternion.copyFrom(this._tmpQuaternion);
                this.attachedMesh.position.copyFrom(this._tmpVector);
                this._recurseComputeWorld(this.attachedMesh);
            }

            // Update rotation sphere locations
            var rotateSpheres = this._rotateSpheresParent.getChildMeshes();
            for(var i=0;i<3;i++){
                for(var j=0;j<2;j++){
                    for(var k=0;k<2;k++){
                        var index= ((i*4)+(j*2))+k
                        if(i==0){
                            rotateSpheres[index].position.set(this._boundingDimensions.x/2,this._boundingDimensions.y*j,this._boundingDimensions.z*k);
                            rotateSpheres[index].position.addInPlace(new BABYLON.Vector3(-this._boundingDimensions.x/2,-this._boundingDimensions.y/2,-this._boundingDimensions.z/2));
                            rotateSpheres[index].lookAt(Vector3.Cross(Vector3.Right(), rotateSpheres[index].position.normalizeToNew()).normalizeToNew().add(rotateSpheres[index].position));
                        }
                        if(i==1){
                            rotateSpheres[index].position.set(this._boundingDimensions.x*j,this._boundingDimensions.y/2,this._boundingDimensions.z*k);
                            rotateSpheres[index].position.addInPlace(new BABYLON.Vector3(-this._boundingDimensions.x/2,-this._boundingDimensions.y/2,-this._boundingDimensions.z/2));
                            rotateSpheres[index].lookAt(Vector3.Cross(Vector3.Up(), rotateSpheres[index].position.normalizeToNew()).normalizeToNew().add(rotateSpheres[index].position));
                        }
                        if(i==2){
                            rotateSpheres[index].position.set(this._boundingDimensions.x*j,this._boundingDimensions.y*k,this._boundingDimensions.z/2);
                            rotateSpheres[index].position.addInPlace(new BABYLON.Vector3(-this._boundingDimensions.x/2,-this._boundingDimensions.y/2,-this._boundingDimensions.z/2));
                            rotateSpheres[index].lookAt(Vector3.Cross(Vector3.Forward(), rotateSpheres[index].position.normalizeToNew()).normalizeToNew().add(rotateSpheres[index].position));
                        }
                        if(this.fixedDragMeshScreenSize){
                            rotateSpheres[index].absolutePosition.subtractToRef(this.gizmoLayer.utilityLayerScene.activeCamera!.position, this._tmpVector);
                            var distanceFromCamera = this.rotationSphereSize*this._tmpVector.length()/this.fixedDragMeshScreenSizeDistanceFactor;
                            rotateSpheres[index].scaling.set(distanceFromCamera, distanceFromCamera, distanceFromCamera);
                        }else{
                            rotateSpheres[index].scaling.set(this.rotationSphereSize, this.rotationSphereSize, this.rotationSphereSize);
                        }
                    }
                }
            }

            // Update scale box locations
            var scaleBoxes = this._scaleBoxesParent.getChildMeshes();
            for(var i=0;i<2;i++){
                for(var j=0;j<2;j++){
                    for(var k=0;k<2;k++){
                        var index= ((i*4)+(j*2))+k;
                        if(scaleBoxes[index]){
                            scaleBoxes[index].position.set(this._boundingDimensions.x*i,this._boundingDimensions.y*j,this._boundingDimensions.z*k);
                            scaleBoxes[index].position.addInPlace(new BABYLON.Vector3(-this._boundingDimensions.x/2,-this._boundingDimensions.y/2,-this._boundingDimensions.z/2));
                            if(this.fixedDragMeshScreenSize){
                                scaleBoxes[index].absolutePosition.subtractToRef(this.gizmoLayer.utilityLayerScene.activeCamera!.position, this._tmpVector);
                                var distanceFromCamera = this.scaleBoxSize*this._tmpVector.length()/this.fixedDragMeshScreenSizeDistanceFactor;
                                scaleBoxes[index].scaling.set(distanceFromCamera, distanceFromCamera, distanceFromCamera);
                            }else{
                                scaleBoxes[index].scaling.set(this.scaleBoxSize, this.scaleBoxSize, this.scaleBoxSize);
                            }
                        }
                    }
                }
            }
        }

        /**
         * Enables rotation on the specified axis and disables rotation on the others
         * @param axis The list of axis that should be enabled (eg. "xy" or "xyz")
         */
        public setEnabledRotationAxis(axis:string){
            this._rotateSpheresParent.getChildMeshes().forEach((m,i)=>{
                if(i<4){
                    m.setEnabled(axis.indexOf("x")!=-1);
                }else if(i<8){
                    m.setEnabled(axis.indexOf("y")!=-1);
                }else{
                    m.setEnabled(axis.indexOf("z")!=-1);
                }
            })
        }

        /**
         * Disposes of the gizmo
         */
        public dispose(){
            this.gizmoLayer.utilityLayerScene.onPointerObservable.remove(this._pointerObserver); 
            this.gizmoLayer.originalScene.onBeforeRenderObservable.remove(this._renderObserver);
            this._lineBoundingBox.dispose();
            this._rotateSpheresParent.dispose();
            this._scaleBoxesParent.dispose();
            super.dispose();
        } 

        /**
         * Makes a mesh not pickable and wraps the mesh inside of a bounding box mesh that is pickable. (This is useful to avoid picking within complex geometry)
         * @param mesh the mesh to wrap in the bounding box mesh and make not pickable
         * @returns the bounding box mesh with the passed in mesh as a child
         */
        public static MakeNotPickableAndWrapInBoundingBox(mesh:Mesh):Mesh{
            var makeNotPickable = (root:AbstractMesh) => {
                root.isPickable = false;
                root.getChildMeshes().forEach((c) => {
                    makeNotPickable(c);
                });
            }
            makeNotPickable(mesh);

            // Reset position to get boudning box from origin with no rotation
            if(!mesh.rotationQuaternion){
                mesh.rotationQuaternion = Quaternion.RotationYawPitchRoll(mesh.rotation.y,mesh.rotation.x,mesh.rotation.z);
            }
            var oldPos = mesh.position.clone()
            var oldRot = mesh.rotationQuaternion.clone();
            mesh.rotationQuaternion.set(0,0,0,1);
            mesh.position.set(0,0,0)

            // Update bounding dimensions/positions   
            var box = BABYLON.MeshBuilder.CreateBox("box", {size: 1}, mesh.getScene());
            var boundingMinMax = mesh.getHierarchyBoundingVectors();
            boundingMinMax.max.subtractToRef(boundingMinMax.min, box.scaling);
            box.position.set((boundingMinMax.max.x+boundingMinMax.min.x)/2,(boundingMinMax.max.y+boundingMinMax.min.y)/2,(boundingMinMax.max.z+boundingMinMax.min.z)/2);
            
            // Restore original positions
            mesh.addChild(box);
            mesh.rotationQuaternion.copyFrom(oldRot);
            mesh.position.copyFrom(oldPos);

            // Reverse parenting
            mesh.removeChild(box);
            box.addChild(mesh);
            box.visibility = 0;
            return box;
        }
    }
}