module BABYLON {
    /**
     * Single axis drag gizmo
     */
    export class AxisDragGizmo extends Gizmo {
        /**
         * Drag behavior responsible for the gizmos dragging interactions
         */
        public dragBehavior: PointerDragBehavior;
        private _pointerObserver: Nullable<Observer<PointerInfo>> = null;
        /**
         * Drag distance in babylon units that the gizmo will snap to when dragged (Default: 0)
         */
        public snapDistance = 0;
        /**
         * Event that fires each time the gizmo snaps to a new location.
         * * snapDistance is the the change in distance
         */
        public onSnapObservable = new Observable<{snapDistance: number}>();
        /**
         * Creates an AxisDragGizmo
         * @param gizmoLayer The utility layer the gizmo will be added to
         * @param dragAxis The axis which the gizmo will be able to drag on
         * @param color The color of the gizmo
         */
        constructor(dragAxis: Vector3, color: Color3 = Color3.Gray(), gizmoLayer: UtilityLayerRenderer = UtilityLayerRenderer.DefaultUtilityLayer) {
            super(gizmoLayer);

            // Create Material
            var coloredMaterial = new BABYLON.StandardMaterial("", gizmoLayer.utilityLayerScene);
            coloredMaterial.disableLighting = true;
            coloredMaterial.emissiveColor = color;

            var hoverMaterial = new BABYLON.StandardMaterial("", gizmoLayer.utilityLayerScene);
            hoverMaterial.disableLighting = true;
            hoverMaterial.emissiveColor = color.add(new Color3(0.3, 0.3, 0.3));

            // Build mesh on root node
            var arrow = new BABYLON.AbstractMesh("", gizmoLayer.utilityLayerScene);
            var arrowMesh = BABYLON.MeshBuilder.CreateCylinder("yPosMesh", {diameterTop: 0, height: 1.5, diameterBottom: 0.75, tessellation: 96}, gizmoLayer.utilityLayerScene);
            var arrowTail = BABYLON.MeshBuilder.CreateLines("yPosMesh", {points: [new Vector3(0, 0, 0), new Vector3(0, 1.1, 0)]}, gizmoLayer.utilityLayerScene);
            arrowTail.color = coloredMaterial.emissiveColor;
            arrow.addChild(arrowMesh);
            arrow.addChild(arrowTail);

            // Position arrow pointing in its drag axis
            arrowMesh.scaling.scaleInPlace(0.05);
            arrowMesh.material = coloredMaterial;
            arrowMesh.rotation.x = Math.PI / 2;
            arrowMesh.position.z += 0.3;
            arrowTail.scaling.scaleInPlace(0.26);
            arrowTail.rotation.x = Math.PI / 2;
            arrowTail.material = coloredMaterial;
            arrow.lookAt(this._rootMesh.position.subtract(dragAxis));
            arrow.scaling.scaleInPlace(1 / 3);

            this._rootMesh.addChild(arrow);

            var currentSnapDragDistance = 0;
            var tmpVector = new Vector3();
            var tmpSnapEvent = {snapDistance: 0};
            // Add drag behavior to handle events when the gizmo is dragged
            this.dragBehavior = new PointerDragBehavior({dragAxis: dragAxis});
            this.dragBehavior.moveAttached = false;
            this._rootMesh.addBehavior(this.dragBehavior);

            var localDelta = new BABYLON.Vector3();
            var tmpMatrix = new BABYLON.Matrix();
            this.dragBehavior.onDragObservable.add((event) => {
                if (this.attachedMesh) {
                    // Convert delta to local translation if it has a parent
                    if (this.attachedMesh.parent) {
                        this.attachedMesh.parent.computeWorldMatrix().invertToRef(tmpMatrix);
                        tmpMatrix.setTranslationFromFloats(0, 0, 0);
                        Vector3.TransformCoordinatesToRef(event.delta, tmpMatrix, localDelta);
                    }else {
                        localDelta.copyFrom(event.delta);
                    }
                    // Snapping logic
                    if (this.snapDistance == 0) {
                        this.attachedMesh.position.addInPlace(localDelta);
                    }else {
                        currentSnapDragDistance += event.dragDistance;
                        if (Math.abs(currentSnapDragDistance) > this.snapDistance) {
                            var dragSteps = Math.floor(Math.abs(currentSnapDragDistance) / this.snapDistance);
                            currentSnapDragDistance = currentSnapDragDistance % this.snapDistance;
                            localDelta.normalizeToRef(tmpVector);
                            tmpVector.scaleInPlace(this.snapDistance * dragSteps);
                            this.attachedMesh.position.addInPlace(tmpVector);
                            tmpSnapEvent.snapDistance = this.snapDistance * dragSteps;
                            this.onSnapObservable.notifyObservers(tmpSnapEvent);
                        }
                    }
                }
            });

            this._pointerObserver = gizmoLayer.utilityLayerScene.onPointerObservable.add((pointerInfo, eventState) => {
                if (this._customMeshSet) {
                    return;
                }
                var isHovered = pointerInfo.pickInfo && (this._rootMesh.getChildMeshes().indexOf(<Mesh>pointerInfo.pickInfo.pickedMesh) != -1);
                var material = isHovered ? hoverMaterial : coloredMaterial;
                this._rootMesh.getChildMeshes().forEach((m) => {
                    m.material = material;
                    if ((<LinesMesh>m).color) {
                        (<LinesMesh>m).color = material.emissiveColor;
                    }
                });
            });
        }
        protected _attachedMeshChanged(value: Nullable<AbstractMesh>) {
            if (this.dragBehavior) {
                this.dragBehavior.enabled = value ? true : false;
            }
        }
        /**
         * Disposes of the gizmo
         */
        public dispose() {
            this.onSnapObservable.clear();
            this.gizmoLayer.utilityLayerScene.onPointerObservable.remove(this._pointerObserver);
            this.dragBehavior.detach();
            super.dispose();
        }
    }
}