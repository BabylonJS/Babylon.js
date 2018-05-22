module BABYLON {
    /**
     * Renders gizmos on top of an existing scene which provide controls for position, rotation, etc.
     */
    export class Gizmo implements IDisposable {
        /**
         * The root mesh of the gizmo
         */
        protected _rootMesh:Mesh;
        /**
         * Mesh that the gizmo will be attached to. (eg. on a drag gizmo the mesh that will be dragged)
         */
        public attachedMesh:Nullable<Mesh>;
        private _beforeRenderObserver:Nullable<Observer<Scene>>;
        /**
         * Creates a gizmo
         * @param gizmoLayer The utility layer the gizmo will be added to
         */
        constructor(/** The utility layer the gizmo will be added to */ public gizmoLayer:UtilityLayerRenderer){
            this._rootMesh = new BABYLON.Mesh("gizmoRootNode",gizmoLayer.utilityLayerScene);
            this._beforeRenderObserver = this.gizmoLayer.utilityLayerScene.onBeforeRenderObservable.add(()=>{
                if(this.gizmoLayer.utilityLayerScene.activeCamera && this.attachedMesh){
                    var dist = this.attachedMesh.position.subtract(this.gizmoLayer.utilityLayerScene.activeCamera.position).length()/5;
                    this._rootMesh.scaling.set(dist, dist, dist);
                }
                if(this.attachedMesh){
                    this._rootMesh.position.copyFrom(this.attachedMesh.position);
                }
            })
        }
        /**
         * Disposes of the gizmo
         */
        public dispose(){
            this._rootMesh.dispose()
            if(this._beforeRenderObserver){
                this.gizmoLayer.utilityLayerScene.onBeforeRenderObservable.remove(this._beforeRenderObserver);
            }
        }
    }

    /**
     * Single axis drag gizmo
     */
    export class AxisDragGizmo extends Gizmo {
        private _dragBehavior:PointerDragBehavior;
        /**
         * Creates an AxisDragGizmo
         * @param gizmoLayer The utility layer the gizmo will be added to
         * @param dragAxis The axis which the gizmo will be able to drag on
         * @param color The color of the gizmo
         */
        constructor(gizmoLayer:UtilityLayerRenderer, dragAxis:Vector3, color:Color3){
            super(gizmoLayer);

            // Create Material
            var coloredMaterial = new BABYLON.StandardMaterial("", gizmoLayer.utilityLayerScene);
            coloredMaterial.disableLighting = true;
            coloredMaterial.emissiveColor = color;

            // Build mesh on root node
            var arrowMesh = BABYLON.MeshBuilder.CreateCylinder("yPosMesh", {diameterTop:0, height: 2, tessellation: 96}, gizmoLayer.utilityLayerScene);
            var arrowTail = BABYLON.MeshBuilder.CreateCylinder("yPosMesh", {diameter:0.03, height: 0.2, tessellation: 96}, gizmoLayer.utilityLayerScene);
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
            this._dragBehavior = new PointerDragBehavior({dragAxis: dragAxis, pointerObservableScene: gizmoLayer.originalScene});
            this._dragBehavior.moveAttached = false;
            this._rootMesh.addBehavior(this._dragBehavior);
            this._dragBehavior.onDragObservable.add((event)=>{
                if(this.attachedMesh){
                    this.attachedMesh.position.addInPlace(event.delta);
                }
            })
        }
        /**
         * Disposes of the gizmo
         */
        public dispose(){
            this._dragBehavior.detach();
            super.dispose();
        } 
    }

    /**
     * Gizmo that enables dragging a mesh along 3 axis
     */
    export class PositionGizmo extends Gizmo {
        private _xDrag:AxisDragGizmo;
        private _yDrag:AxisDragGizmo;
        private _zDrag:AxisDragGizmo;

        public set attachedMesh(mesh:Nullable<Mesh>){
            this._xDrag.attachedMesh = mesh;
            this._yDrag.attachedMesh = mesh;
            this._zDrag.attachedMesh = mesh;
        }
        /**
         * Creates a PositionGizmo
         * @param gizmoLayer The utility layer the gizmo will be added to
         */
        constructor(gizmoLayer:UtilityLayerRenderer){
            super(gizmoLayer);
            this._xDrag = new AxisDragGizmo(gizmoLayer, new Vector3(1,0,0), BABYLON.Color3.FromHexString("#00b894"));
            this._yDrag = new AxisDragGizmo(gizmoLayer, new Vector3(0,1,0), BABYLON.Color3.FromHexString("#d63031"));
            this._zDrag = new AxisDragGizmo(gizmoLayer, new Vector3(0,0,1), BABYLON.Color3.FromHexString("#0984e3"));
        }

        /**
         * Disposes of the gizmo
         */
        public dispose(){
            this._xDrag.dispose();
            this._yDrag.dispose();
            this._zDrag.dispose();
        }
    }
}