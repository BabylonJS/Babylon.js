module BABYLON {
    /**
     * Gizmo that enables dragging a mesh along 3 axis
     */
    export class PositionGizmo extends Gizmo {
        private _xDrag:AxisDragGizmo;
        private _yDrag:AxisDragGizmo;
        private _zDrag:AxisDragGizmo;

        public set attachedMesh(mesh:Nullable<AbstractMesh>){
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