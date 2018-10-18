module BABYLON {
    /**
     * Gizmo that enables scaling a mesh along 3 axis
     */
    export class ScaleGizmo extends Gizmo {
        /**
         * Internal gizmo used for interactions on the x axis
         */
        public xGizmo: AxisScaleGizmo;
        /**
         * Internal gizmo used for interactions on the y axis
         */
        public yGizmo: AxisScaleGizmo;
        /**
         * Internal gizmo used for interactions on the z axis
         */
        public zGizmo: AxisScaleGizmo;

        /**
         * Internal gizmo used to scale all axis equally
         */
        public uniformScaleGizmo: AxisScaleGizmo;

        /** Fires an event when any of it's sub gizmos are dragged */
        public onDragStartObservable = new Observable();
        /** Fires an event when any of it's sub gizmos are released from dragging */
        public onDragEndObservable = new Observable();

        public set attachedMesh(mesh: Nullable<AbstractMesh>) {
            if (this.xGizmo) {
                this.xGizmo.attachedMesh = mesh;
                this.yGizmo.attachedMesh = mesh;
                this.zGizmo.attachedMesh = mesh;
                this.uniformScaleGizmo.attachedMesh = mesh;
            }
        }
        /**
         * Creates a ScaleGizmo
         * @param gizmoLayer The utility layer the gizmo will be added to
         */
        constructor(gizmoLayer: UtilityLayerRenderer= UtilityLayerRenderer.DefaultUtilityLayer) {
            super(gizmoLayer);
            this.xGizmo = new AxisScaleGizmo(new Vector3(1, 0, 0), BABYLON.Color3.Red().scale(0.5), gizmoLayer);
            this.yGizmo = new AxisScaleGizmo(new Vector3(0, 1, 0), BABYLON.Color3.Green().scale(0.5), gizmoLayer);
            this.zGizmo = new AxisScaleGizmo(new Vector3(0, 0, 1), BABYLON.Color3.Blue().scale(0.5), gizmoLayer);

            // Create uniform scale gizmo
            this.uniformScaleGizmo = new AxisScaleGizmo(new Vector3(0, 1, 0), BABYLON.Color3.Yellow().scale(0.5), gizmoLayer);
            this.uniformScaleGizmo.updateGizmoRotationToMatchAttachedMesh = false;
            this.uniformScaleGizmo.uniformScaling = true;
            var uniformScalingMesh = BABYLON.Mesh.CreatePolyhedron("", {type: 1}, this.uniformScaleGizmo.gizmoLayer.utilityLayerScene);
            uniformScalingMesh.scaling.scaleInPlace(0.02);
            uniformScalingMesh.visibility = 0;
            var octahedron = BABYLON.Mesh.CreatePolyhedron("", {type: 1}, this.uniformScaleGizmo.gizmoLayer.utilityLayerScene);
            octahedron.scaling.scaleInPlace(0.007);
            uniformScalingMesh.addChild(octahedron);
            this.uniformScaleGizmo.setCustomMesh(uniformScalingMesh, true);

            // Relay drag events
            [this.xGizmo, this.yGizmo, this.zGizmo, this.uniformScaleGizmo].forEach((gizmo) => {
                gizmo.dragBehavior.onDragStartObservable.add(() => {
                    this.onDragStartObservable.notifyObservers({});
                });
                gizmo.dragBehavior.onDragEndObservable.add(() => {
                    this.onDragEndObservable.notifyObservers({});
                });
            });

            this.attachedMesh = null;
        }

        public set updateGizmoRotationToMatchAttachedMesh(value: boolean) {
            if (!value) {
                Tools.Warn("Setting updateGizmoRotationToMatchAttachedMesh = false on scaling gizmo is not supported.");
            }
            if (this.xGizmo) {
                this.xGizmo.updateGizmoRotationToMatchAttachedMesh = value;
                this.yGizmo.updateGizmoRotationToMatchAttachedMesh = value;
                this.zGizmo.updateGizmoRotationToMatchAttachedMesh = value;
            }
        }
        public get updateGizmoRotationToMatchAttachedMesh() {
            return this.xGizmo.updateGizmoRotationToMatchAttachedMesh;
        }

        /**
         * Drag distance in babylon units that the gizmo will snap to when dragged (Default: 0)
         */
        public set snapDistance(value: number) {
            if (this.xGizmo) {
                this.xGizmo.snapDistance = value;
                this.yGizmo.snapDistance = value;
                this.zGizmo.snapDistance = value;
                this.uniformScaleGizmo.snapDistance = value;
            }
        }
        public get snapDistance() {
            return this.xGizmo.snapDistance;
        }

        /**
         * Ratio for the scale of the gizmo (Default: 1)
         */
        public set scaleRatio(value: number) {
            if (this.xGizmo) {
                this.xGizmo.scaleRatio = value;
                this.yGizmo.scaleRatio = value;
                this.zGizmo.scaleRatio = value;
                this.uniformScaleGizmo.scaleRatio = value;
            }
        }
        public get scaleRatio() {
            return this.xGizmo.scaleRatio;
        }

        /**
         * Disposes of the gizmo
         */
        public dispose() {
            this.xGizmo.dispose();
            this.yGizmo.dispose();
            this.zGizmo.dispose();
            this.uniformScaleGizmo.dispose();
            this.onDragStartObservable.clear();
            this.onDragEndObservable.clear();
        }
    }
}