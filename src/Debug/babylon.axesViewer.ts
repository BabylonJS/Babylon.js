/**
 * Module Debug contains the (visual) components to debug a scene correctly
 */
module BABYLON.Debug {

    /**
     * The Axes viewer will show 3 axes in a specific point in space
     */
    export class AxesViewer {

        private _xline = [Vector3.Zero(), Vector3.Zero()];
        private _yline = [Vector3.Zero(), Vector3.Zero()];
        private _zline = [Vector3.Zero(), Vector3.Zero()];

        private _xmesh: Nullable<LinesMesh>;
        private _ymesh: Nullable<LinesMesh>;
        private _zmesh: Nullable<LinesMesh>;

        /**
         * Gets the hosting scene
         */
        public scene: Nullable<Scene>;
        /**
         * Gets or sets a number used to scale line length
         */
        public scaleLines = 1;

        /**
         * Creates a new AxesViewer
         * @param scene defines the hosting scene
         * @param scaleLines defines a number used to scale line length (1 by default)
         */
        constructor(scene: Scene, scaleLines = 1) {

            this.scaleLines = scaleLines;

            this._xmesh = Mesh.CreateLines("xline", this._xline, scene, true);
            this._ymesh = Mesh.CreateLines("yline", this._yline, scene, true);
            this._zmesh = Mesh.CreateLines("zline", this._zline, scene, true);

            this._xmesh.renderingGroupId = 2;
            this._ymesh.renderingGroupId = 2;
            this._zmesh.renderingGroupId = 2;

            this._xmesh.material.checkReadyOnlyOnce = true;
            this._xmesh.color = new Color3(1, 0, 0);
            this._ymesh.material.checkReadyOnlyOnce = true;
            this._ymesh.color = new Color3(0, 1, 0);
            this._zmesh.material.checkReadyOnlyOnce = true;
            this._zmesh.color = new Color3(0, 0, 1);

            this.scene = scene;

        }

        /**
         * Force the viewer to update
         * @param position defines the position of the viewer
         * @param xaxis defines the x axis of the viewer
         * @param yaxis defines the y axis of the viewer
         * @param zaxis defines the z axis of the viewer
         */
        public update(position: Vector3, xaxis: Vector3, yaxis: Vector3, zaxis: Vector3): void {

            var scaleLines = this.scaleLines;

            if (this._xmesh) {
                this._xmesh.position.copyFrom(position);
            }
            if (this._ymesh) {
                this._ymesh.position.copyFrom(position);
            }
            if (this._zmesh) {
                this._zmesh.position.copyFrom(position);
            }

            var point2 = this._xline[1];
            point2.x = xaxis.x * scaleLines;
            point2.y = xaxis.y * scaleLines;
            point2.z = xaxis.z * scaleLines;
            Mesh.CreateLines("", this._xline, null, false, this._xmesh);

            point2 = this._yline[1];
            point2.x = yaxis.x * scaleLines;
            point2.y = yaxis.y * scaleLines;
            point2.z = yaxis.z * scaleLines;
            Mesh.CreateLines("", this._yline, null, false, this._ymesh);

            point2 = this._zline[1];
            point2.x = zaxis.x * scaleLines;
            point2.y = zaxis.y * scaleLines;
            point2.z = zaxis.z * scaleLines;
            Mesh.CreateLines("", this._zline, null, false, this._zmesh);

        }

        /** Releases resources */
        public dispose() {

            if (this._xmesh) {
                this._xmesh.dispose();
            }

            if (this._ymesh) {
                this._ymesh.dispose();
            }

            if (this._zmesh) {
                this._zmesh.dispose();
            }

            this._xmesh = null;
            this._ymesh = null;
            this._zmesh = null;

            this.scene = null;
        }

    }
}