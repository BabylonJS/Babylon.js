module BABYLON.Debug {

    export class AxesViewer {
        
        private _xline = [Vector3.Zero(), Vector3.Zero()];
        private _yline = [Vector3.Zero(), Vector3.Zero()];
        private _zline = [Vector3.Zero(), Vector3.Zero()];

        private _xmesh: LinesMesh;
        private _ymesh: LinesMesh;
        private _zmesh: LinesMesh;

        public scene: Scene;
        public scaleLines = 1;

        constructor(scene: Scene, scaleLines = 1) {

            this.scaleLines = scaleLines;

            this._xmesh = Mesh.CreateLines("xline", this._xline, scene, true);
            this._ymesh = Mesh.CreateLines("yline", this._yline, scene, true);
            this._zmesh = Mesh.CreateLines("zline", this._zline, scene, true);

            this._xmesh.renderingGroupId = 2;
            this._ymesh.renderingGroupId = 2;
            this._zmesh.renderingGroupId = 2;

            this._xmesh.material.checkReadyOnlyOnce = true;
            this._xmesh.color = new BABYLON.Color3(1, 0, 0);
            this._ymesh.material.checkReadyOnlyOnce = true;
            this._ymesh.color = new BABYLON.Color3(0, 1, 0);
            this._zmesh.material.checkReadyOnlyOnce = true;
            this._zmesh.color = new BABYLON.Color3(0, 0, 1);

            this.scene = scene;

        }

        public update (position: Vector3, xaxis: Vector3, yaxis: Vector3, zaxis: Vector3): void {

            var scaleLines = this.scaleLines;

            var point1 = this._xline[0];
            var point2 = this._xline[1];
            point1.x = position.x;
            point1.y = position.y;
            point1.z = position.z;
            point2.x = point1.x + xaxis.x * scaleLines;
            point2.y = point1.y + xaxis.y * scaleLines;
            point2.z = point1.z + xaxis.z * scaleLines;
            Mesh.CreateLines(null, this._xline, null, null, this._xmesh);

            point1 = this._yline[0];
            point2 = this._yline[1];
            point1.x = position.x;
            point1.y = position.y;
            point1.z = position.z;
            point2.x = point1.x + yaxis.x * scaleLines;
            point2.y = point1.y + yaxis.y * scaleLines;
            point2.z = point1.z + yaxis.z * scaleLines;
            Mesh.CreateLines(null, this._yline, null, null, this._ymesh);

            point1 = this._zline[0];
            point2 = this._zline[1];
            point1.x = position.x;
            point1.y = position.y;
            point1.z = position.z;
            point2.x = point1.x + zaxis.x * scaleLines;
            point2.y = point1.y + zaxis.y * scaleLines;
            point2.z = point1.z + zaxis.z * scaleLines;
            Mesh.CreateLines(null, this._zline, null, null, this._zmesh);

        }

        public dispose() {

            if (this._xmesh) {
                this._xmesh.dispose();
                this._ymesh.dispose();
                this._zmesh.dispose();

                this._xmesh = null;
                this._ymesh = null;
                this._zmesh = null;

                this._xline = null;
                this._yline = null;
                this._zline = null;

                this.scene = null;
            }

        }

    }
}
