module BABYLON {
    /**
     * Single axis scale gizmo
     */
    export class AxisScaleGizmo extends Gizmo {
        private _coloredMaterial: StandardMaterial;
        /**
         * Drag behavior responsible for the gizmos dragging interactions
         */
        public dragBehavior: PointerDragBehavior;
        private _pointerObserver: Nullable<Observer<PointerInfo>> = null;
        /**
         * Scale distance in babylon units that the gizmo will snap to when dragged (Default: 0)
         */
        public snapDistance = 0;
        /**
         * Event that fires each time the gizmo snaps to a new location.
         * * snapDistance is the the change in distance
         */
        public onSnapObservable = new Observable<{snapDistance: number}>();
        /**
         * If the scaling operation should be done on all axis (default: false)
         */
        public uniformScaling = false;
        /**
         * Creates an AxisScaleGizmo
         * @param gizmoLayer The utility layer the gizmo will be added to
         * @param dragAxis The axis which the gizmo will be able to scale on
         * @param color The color of the gizmo
         */
        constructor(dragAxis: Vector3, color: Color3 = Color3.Gray(), gizmoLayer: UtilityLayerRenderer = UtilityLayerRenderer.DefaultUtilityLayer) {
            super(gizmoLayer);

            // Create Material
            this._coloredMaterial = new BABYLON.StandardMaterial("", gizmoLayer.utilityLayerScene);
            this._coloredMaterial.disableLighting = true;
            this._coloredMaterial.emissiveColor = color;

            var hoverMaterial = new BABYLON.StandardMaterial("", gizmoLayer.utilityLayerScene);
            hoverMaterial.disableLighting = true;
            hoverMaterial.emissiveColor = color.add(new Color3(0.3, 0.3, 0.3));

            // Build mesh on root node
            var arrow = new BABYLON.AbstractMesh("", gizmoLayer.utilityLayerScene);
            var arrowMesh = BABYLON.MeshBuilder.CreateBox("yPosMesh", {size: 0.4}, gizmoLayer.utilityLayerScene);
            var arrowTail = BABYLON.MeshBuilder.CreateLines("yPosMesh", {points: [new Vector3(0, 0, 0), new Vector3(0, 1.1, 0)]}, gizmoLayer.utilityLayerScene);
            arrowTail.color = this._coloredMaterial.emissiveColor;
            arrow.addChild(arrowMesh);
            arrow.addChild(arrowTail);

            // Position arrow pointing in its drag axis
            arrowMesh.scaling.scaleInPlace(0.1);
            arrowMesh.material = this._coloredMaterial;
            arrowMesh.rotation.x = Math.PI / 2;
            arrowMesh.position.z += 0.3;
            arrowTail.scaling.scaleInPlace(0.26);
            arrowTail.rotation.x = Math.PI / 2;
            arrowTail.material = this._coloredMaterial;
            arrow.lookAt(this._rootMesh.position.subtract(dragAxis));
            this._rootMesh.addChild(arrow);
            arrow.scaling.scaleInPlace(1 / 3);

            // Add drag behavior to handle events when the gizmo is dragged
            this.dragBehavior = new PointerDragBehavior({dragAxis: dragAxis});
            this.dragBehavior.moveAttached = false;
            this._rootMesh.addBehavior(this.dragBehavior);

            var currentSnapDragDistance = 0;
            var tmpVector = new Vector3();
            var tmpSnapEvent = {snapDistance: 0};
            this.dragBehavior.onDragObservable.add((event) => {
                if (this.attachedMesh) {
                    // Snapping logic
                    var snapped = false;
                    var dragSteps = 0;
                    if (this.uniformScaling) {
                        this.attachedMesh.scaling.normalizeToRef(tmpVector);
                        if (tmpVector.y < 0) {
                            tmpVector.scaleInPlace(-1);
                        }
                    }else {
                        tmpVector.copyFrom(dragAxis);
                    }
                    if (this.snapDistance == 0) {
                        tmpVector.scaleToRef(event.dragDistance, tmpVector);
                    }else {
                        currentSnapDragDistance += event.dragDistance;
                        if (Math.abs(currentSnapDragDistance) > this.snapDistance) {
                            dragSteps = Math.floor(currentSnapDragDistance / this.snapDistance);
                            currentSnapDragDistance = currentSnapDragDistance % this.snapDistance;
                            tmpVector.scaleToRef(this.snapDistance * dragSteps, tmpVector);
                            snapped = true;
                        }else {
                            tmpVector.scaleInPlace(0);
                        }
                    }

                    this.attachedMesh.scaling.addInPlace(tmpVector);

                    if (snapped) {
                        tmpSnapEvent.snapDistance = this.snapDistance * dragSteps;
                        this.onSnapObservable.notifyObservers(tmpSnapEvent);
                    }
                }
            });

            this._pointerObserver = gizmoLayer.utilityLayerScene.onPointerObservable.add((pointerInfo, eventState) => {
                if (this._customMeshSet) {
                    return;
                }
                var isHovered = pointerInfo.pickInfo && (this._rootMesh.getChildMeshes().indexOf(<Mesh>pointerInfo.pickInfo.pickedMesh) != -1);
                var material = isHovered ? hoverMaterial : this._coloredMaterial;
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

        /**
         * Disposes and replaces the current meshes in the gizmo with the specified mesh
         * @param mesh The mesh to replace the default mesh of the gizmo
         * @param useGizmoMaterial If the gizmo's default material should be used (default: false)
         */
        public setCustomMesh(mesh: Mesh, useGizmoMaterial: boolean = false) {
            super.setCustomMesh(mesh);
            if (useGizmoMaterial) {
                this._rootMesh.getChildMeshes().forEach((m) => {
                    m.material = this._coloredMaterial;
                    if ((<LinesMesh>m).color) {
                        (<LinesMesh>m).color = this._coloredMaterial.emissiveColor;
                    }
                });
                this._customMeshSet = false;
            }
        }
    }
}