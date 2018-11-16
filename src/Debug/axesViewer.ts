import { Vector3, Color3 } from "Maths/math";
import { Nullable } from "types";
import { Scene } from "scene";
import { Mesh } from "Meshes/mesh";
import { LinesMesh } from "Meshes/linesMesh";

/**
     * The Axes viewer will show 3 axes in a specific point in space
     */
    export class AxesViewer {
        private _xmesh: Nullable<AbstractMesh>;
        private _ymesh: Nullable<AbstractMesh>;
        private _zmesh: Nullable<AbstractMesh>;

        /**
         * Gets the hosting scene
         */
        public scene: Nullable<Scene>;
        /**
         * Gets or sets a number used to scale line length
         */
        public scaleLines = 1;

        /** Gets the mesh used to render x-axis */
        public get xAxisMesh(): Nullable<AbstractMesh> {
            return this._xmesh;
        }

        /** Gets the mesh used to render x-axis */
        public get yAxisMesh(): Nullable<AbstractMesh> {
            return this._ymesh;
        }

        /** Gets the mesh used to render x-axis */
        public get zAxisMesh(): Nullable<AbstractMesh> {
            return this._zmesh;
        }

        private static _recursiveChangeRenderingGroupId(mesh: AbstractMesh, id: number) {
            mesh.renderingGroupId = id;
            mesh.getChildMeshes().forEach((m) => {
                AxesViewer._recursiveChangeRenderingGroupId(m, id);
            });
        }

        /**
         * Creates a new AxesViewer
         * @param scene defines the hosting scene
         * @param scaleLines defines a number used to scale line length (1 by default)
         */
        constructor(scene: Scene, scaleLines = 1) {
            this.scaleLines = scaleLines;

            var greenColoredMaterial = new BABYLON.StandardMaterial("", scene);
            greenColoredMaterial.disableLighting = true;
            greenColoredMaterial.emissiveColor = BABYLON.Color3.Green().scale(0.5);

            var redColoredMaterial = new BABYLON.StandardMaterial("", scene);
            redColoredMaterial.disableLighting = true;
            redColoredMaterial.emissiveColor = BABYLON.Color3.Red().scale(0.5);

            var blueColoredMaterial = new BABYLON.StandardMaterial("", scene);
            blueColoredMaterial.disableLighting = true;
            blueColoredMaterial.emissiveColor = BABYLON.Color3.Blue().scale(0.5);

            this._xmesh = BABYLON.AxisDragGizmo._CreateArrow(scene, redColoredMaterial);
            this._ymesh = BABYLON.AxisDragGizmo._CreateArrow(scene, greenColoredMaterial);
            this._zmesh = BABYLON.AxisDragGizmo._CreateArrow(scene, blueColoredMaterial);

            this._xmesh.rotationQuaternion = new BABYLON.Quaternion();
            this._xmesh.scaling.scaleInPlace(4);
            this._ymesh.rotationQuaternion = new BABYLON.Quaternion();
            this._ymesh.scaling.scaleInPlace(4);
            this._zmesh.rotationQuaternion = new BABYLON.Quaternion();
            this._zmesh.scaling.scaleInPlace(4);

            AxesViewer._recursiveChangeRenderingGroupId(this._xmesh, 2);
            AxesViewer._recursiveChangeRenderingGroupId(this._ymesh, 2);
            AxesViewer._recursiveChangeRenderingGroupId(this._zmesh, 2);

            this.scene = scene;
            this.update(new BABYLON.Vector3(), Vector3.Right(), Vector3.Up(), Vector3.Forward());
        }

        /**
         * Force the viewer to update
         * @param position defines the position of the viewer
         * @param xaxis defines the x axis of the viewer
         * @param yaxis defines the y axis of the viewer
         * @param zaxis defines the z axis of the viewer
         */
        public update(position: Vector3, xaxis: Vector3, yaxis: Vector3, zaxis: Vector3): void {
            if (this._xmesh) {
                this._xmesh.position.copyFrom(position);

                var cross = Vector3.Cross(Vector3.Forward(), xaxis);
                this._xmesh.rotationQuaternion!.set(cross.x, cross.y, cross.z, 1 + Vector3.Dot(Vector3.Forward(), xaxis));
                this._xmesh.rotationQuaternion!.normalize();
            }
            if (this._ymesh) {
                this._ymesh.position.copyFrom(position);

                var cross = Vector3.Cross(Vector3.Forward(), yaxis);
                this._ymesh.rotationQuaternion!.set(cross.x, cross.y, cross.z, 1 + Vector3.Dot(Vector3.Forward(), yaxis));
                this._ymesh.rotationQuaternion!.normalize();
            }
            if (this._zmesh) {
                this._zmesh.position.copyFrom(position);

                var cross = Vector3.Cross(Vector3.Forward(), zaxis);
                this._zmesh.rotationQuaternion!.set(cross.x, cross.y, cross.z, 1 + Vector3.Dot(Vector3.Forward(), zaxis));
                this._zmesh.rotationQuaternion!.normalize();
            }

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