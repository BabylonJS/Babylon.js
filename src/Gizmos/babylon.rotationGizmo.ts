module BABYLON {
    /**
     * Gizmo that enables rotating a mesh along 3 axis
     */
    export class RotationGizmo extends Gizmo {
        /**
         * Internal gizmo used for interactions on the x axis
         */
        public xGizmo:PlaneRotationGizmo;
        /**
         * Internal gizmo used for interactions on the y axis
         */
        public yGizmo:PlaneRotationGizmo;
        /**
         * Internal gizmo used for interactions on the z axis
         */
        public zGizmo:PlaneRotationGizmo;

        public set attachedMesh(mesh:Nullable<AbstractMesh>){
            if(this.xGizmo){
                this.xGizmo.attachedMesh = mesh;
                this.yGizmo.attachedMesh = mesh;
                this.zGizmo.attachedMesh = mesh;
            }
        }
        /**
         * Creates a RotationGizmo
         * @param gizmoLayer The utility layer the gizmo will be added to
         */
        constructor(gizmoLayer:UtilityLayerRenderer=UtilityLayerRenderer.DefaultUtilityLayer){
            super(gizmoLayer);
            this.xGizmo = new PlaneRotationGizmo(new Vector3(1,0,0), BABYLON.Color3.Green().scale(0.5), gizmoLayer);
            this.yGizmo = new PlaneRotationGizmo(new Vector3(0,1,0), BABYLON.Color3.Red().scale(0.5), gizmoLayer);
            this.zGizmo = new PlaneRotationGizmo(new Vector3(0,0,1), BABYLON.Color3.Blue().scale(0.5), gizmoLayer);
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
         * Disposes of the gizmo
         */
        public dispose(){
            this.xGizmo.dispose();
            this.yGizmo.dispose();
            this.zGizmo.dispose();
        }

        /**
         * CustomMeshes are not supported by this gizmo
         * @param mesh The mesh to replace the default mesh of the gizmo
         */
        public setCustomMesh(mesh:Mesh){
            Tools.Error("Custom meshes are not supported on this gizmo, please set the custom meshes on the gizmos contained within this one (gizmo.xGizmo, gizmo.yGizmo, gizmo.zGizmo)");
        }
    }
}