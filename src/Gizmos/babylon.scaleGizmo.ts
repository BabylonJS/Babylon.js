module BABYLON {
    /**
     * Gizmo that enables scaling a mesh along 3 axis
     */
    export class ScaleGizmo extends Gizmo {
        private _xDrag:AxisScaleGizmo;
        private _yDrag:AxisScaleGizmo;
        private _zDrag:AxisScaleGizmo;

        public set attachedMesh(mesh:Nullable<AbstractMesh>){
            this._xDrag.attachedMesh = mesh;
            this._yDrag.attachedMesh = mesh;
            this._zDrag.attachedMesh = mesh;
        }
        /**
         * Creates a ScaleGizmo
         * @param gizmoLayer The utility layer the gizmo will be added to
         */
        constructor(gizmoLayer:UtilityLayerRenderer){
            super(gizmoLayer);
            this._xDrag = new AxisScaleGizmo(gizmoLayer, new Vector3(1,0,0), BABYLON.Color3.FromHexString("#00b894"));
            this._yDrag = new AxisScaleGizmo(gizmoLayer, new Vector3(0,1,0), BABYLON.Color3.FromHexString("#d63031"));
            this._zDrag = new AxisScaleGizmo(gizmoLayer, new Vector3(0,0,1), BABYLON.Color3.FromHexString("#0984e3"));
        }

        protected _onInteractionsEnabledChanged(value:boolean){
            this._xDrag.interactionsEnabled = value
            this._yDrag.interactionsEnabled = value
            this._zDrag.interactionsEnabled = value
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