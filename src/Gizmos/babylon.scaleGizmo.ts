module BABYLON {
    /**
     * Gizmo that enables scaling a mesh along 3 axis
     */
    export class ScaleGizmo extends Gizmo {
        /**
         * Internal gizmo used for interactions on the x axis
         */
        public xGizmo:AxisScaleGizmo;
        /**
         * Internal gizmo used for interactions on the y axis
         */
        public yGizmo:AxisScaleGizmo;
        /**
         * Internal gizmo used for interactions on the z axis
         */
        public zGizmo:AxisScaleGizmo;

        /**
         * @hidden
         * Internal gizmo used to scale all axis equally
         */
        private _uniformGizmo:AxisScaleGizmo;

        public set attachedMesh(mesh:Nullable<AbstractMesh>){
            if(this.xGizmo){
                this.xGizmo.attachedMesh = mesh;
                this.yGizmo.attachedMesh = mesh;
                this.zGizmo.attachedMesh = mesh;
                this._uniformGizmo.attachedMesh = mesh;
            }
        }
        /**
         * Creates a ScaleGizmo
         * @param gizmoLayer The utility layer the gizmo will be added to
         */
        constructor(gizmoLayer:UtilityLayerRenderer=UtilityLayerRenderer.DefaultUtilityLayer){
            super(gizmoLayer);
            this.xGizmo = new AxisScaleGizmo(new Vector3(1,0,0), BABYLON.Color3.Green().scale(0.5), gizmoLayer);
            this.yGizmo = new AxisScaleGizmo(new Vector3(0,1,0), BABYLON.Color3.Red().scale(0.5), gizmoLayer);
            this.zGizmo = new AxisScaleGizmo(new Vector3(0,0,1), BABYLON.Color3.Blue().scale(0.5), gizmoLayer);

            // Create uniform scale gizmo
            this._uniformGizmo = new AxisScaleGizmo(new Vector3(0,1,0), BABYLON.Color3.Yellow().scale(0.5), gizmoLayer);
            this._uniformGizmo.updateGizmoRotationToMatchAttachedMesh = false;
            this._uniformGizmo.uniformScaling = true
            var octahedron = BABYLON.Mesh.CreatePolyhedron("", {type: 1}, this._uniformGizmo.gizmoLayer.utilityLayerScene);
            octahedron.scaling.scaleInPlace(0.02);
            this._uniformGizmo.setCustomMesh(octahedron, true);
            
            this.attachedMesh = null;
        }

        public set updateGizmoRotationToMatchAttachedMesh(value:boolean){
            if(this.xGizmo){
                this.xGizmo.updateGizmoRotationToMatchAttachedMesh = value;
                this.yGizmo.updateGizmoRotationToMatchAttachedMesh = value;
                this.zGizmo.updateGizmoRotationToMatchAttachedMesh = value;
            }
        }
        public get updateGizmoRotationToMatchAttachedMesh(){
            return this.xGizmo.updateGizmoRotationToMatchAttachedMesh;
        }

        /**
         * Drag distance in babylon units that the gizmo will snap to when dragged (Default: 0)
         */
        public set snapDistance(value:number){
            if(this.xGizmo){
                this.xGizmo.snapDistance = value;
                this.yGizmo.snapDistance = value;
                this.zGizmo.snapDistance = value;
                this._uniformGizmo.snapDistance = value;
            }
        }
        public get snapDistance(){
            return this.xGizmo.snapDistance;
        }

        /**
         * Disposes of the gizmo
         */
        public dispose(){
            this.xGizmo.dispose();
            this.yGizmo.dispose();
            this.zGizmo.dispose();
            this._uniformGizmo.dispose();
        }
    }
}