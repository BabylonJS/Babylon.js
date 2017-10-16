module INSPECTOR {

    export class MeshAdapter
        extends Adapter
        implements IToolVisible, IToolDebug, IToolBoundingBox, IToolInfo {

        /** Keep track of the axis of the actual object */
        private _axesViewer: BABYLON.Debug.AxesViewer;

        constructor(obj: BABYLON.AbstractMesh) {
            super(obj);
        }

        /** Returns the name displayed in the tree */
        public id(): string {
            let str = '';
            if (this._obj.name) {
                str = this._obj.name;
            } // otherwise nothing displayed        
            return str;
        }

        /** Returns the type of this object - displayed in the tree */
        public type(): string {
            return Helpers.GET_TYPE(this._obj);
        }

        /** Returns the list of properties to be displayed for this adapter */
        public getProperties(): Array<PropertyLine> {
            return Helpers.GetAllLinesProperties(this._obj);
        }

        public getTools(): Array<AbstractTreeTool> {
            let tools = [];
            tools.push(new Checkbox(this));
            tools.push(new DebugArea(this));
            if ((this._obj as BABYLON.AbstractMesh).getTotalVertices() > 0) {
                tools.push(new BoundingBox(this));
            }

            tools.push(new Info(this));
            return tools;
        }

        public setVisible(b: boolean) {
            this._obj.setEnabled(b);
            this._obj.isVisible = b;
        }
        public isVisible(): boolean {
            return this._obj.isEnabled() && this._obj.isVisible;
        }
        public isBoxVisible(): boolean {
            return (this._obj as BABYLON.AbstractMesh).showBoundingBox;
        }
        public setBoxVisible(b: boolean) {
            return (this._obj as BABYLON.AbstractMesh).showBoundingBox = b;
        }

        public debug(b: boolean) {
            // Draw axis the first time
            if (!this._axesViewer) {
                 this._drawAxis();
            }
            // Display or hide axis
            if (!b && this._axesViewer) {
                this._axesViewer.dispose();
                this._axesViewer = null;
            }
        }

        /** Returns some information about this mesh */
        public getInfo(): string {
            return `${(this._obj as BABYLON.AbstractMesh).getTotalVertices()} vertices`;
        }

        /** Draw X, Y and Z axis for the actual object if this adapter.
         * Should be called only one time as it will fill this._axis
         */
        private _drawAxis() {
            this._obj.computeWorldMatrix();

            // Axis
            var x = new BABYLON.Vector3(8 / (this._obj as BABYLON.AbstractMesh).scaling.x, 0, 0);
            var y = new BABYLON.Vector3(0, 8 / (this._obj as BABYLON.AbstractMesh).scaling.y, 0);
            var z = new BABYLON.Vector3(0, 0, 8 / (this._obj as BABYLON.AbstractMesh).scaling.z);

            this._axesViewer = new BABYLON.Debug.AxesViewer(this._obj.getScene());
            this._axesViewer.update(this._obj.position, x, y, z);
        }
    }
}