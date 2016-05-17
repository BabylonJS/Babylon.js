module Sandbox {
    import Color3 = BABYLON.Color3;
    import StandardMaterial = BABYLON.StandardMaterial;
    import Scene = BABYLON.Scene;
    import Matrix = BABYLON.Matrix;
    import Mesh = BABYLON.Mesh;
    import Vector3 = BABYLON.Vector3;
    import Quaternion = BABYLON.Quaternion;
    import VertexData = BABYLON.VertexData;
    import LinesMesh = BABYLON.LinesMesh;
    import PointLight = BABYLON.PointLight;
    import AbstractMesh = BABYLON.AbstractMesh;
    import Ray = BABYLON.Ray;
    import Vector2 = BABYLON.Vector2;

    export const enum RadixFeatures {
        None = 0,

        /**
         * Display the Arrow that follows the X Axis
         */
        ArrowX = 0x0001,

        /**
         * Display the Arrow that follows the Y Axis
         */
        ArrowY = 0x0002,

        /**
         * Display the Arrow that follows the Z Axis
         */
        ArrowZ = 0x0004,

        /**
         * Display the Arrow that follows the XYZ Axis
         */
        ArrowsXYZ = 0x0007,

        /**
         * Display the anchor that allow XY plane manipulation
         */
        PlaneSelectionXY = 0x0010,

        /**
         * Display the anchor that allow XZ plane manipulation
         */
        PlaneSelectionXZ = 0x0020,

        /**
         * Display the anchor that allow YZ plane manipulation
         */
        PlaneSelectionYZ = 0x0040,

        /**
         * Display all the anchors that allow plane manipulation
         */
        AllPlanesSelection = 0x0070,

        /**
         * Display the rotation cylinder that allows rotation manipulation along the X Axis
         */
        RotationX = 0x0100,

        /**
         * Display the rotation cylinder that allows rotation manipulation along the Y Axis
         */
        RotationY = 0x0200,

        /**
         * Display the rotation cylinder that allows rotation manipulation along the A Axis
         */
        RotationZ = 0x0400,

        /**
         * Display all rotation cylinders
         */
        Rotations = 0x0700,

        //CenterSquare = 0x1000 NOT SUPPORTED RIGHT NOW
    }

    /**
     * This class create the visual geometry to display a manipulation radix in a viewport.
     * It also implements the logic to handler intersection, hover on feature.
     */
    export class Radix {
        private static pc = 0.6;
        private static sc = 0.2;

        /**
         * Set/get the Wire Selection Threshold, set a bigger value to improve tolerance while picking a wire mesh
         */
        get wireSelectionThreshold(): number {
            return this._wireSelectionThreshold;
        }

        set wireSelectionThreshold(value: number) {
            this._wireSelectionThreshold = value;

            let meshes = this._rootMesh.getChildMeshes(true, m => m instanceof LinesMesh);
            for (var mesh of meshes) {
                var lm = <LinesMesh>mesh;
                if (lm) {
                    lm.intersectionThreshold = value;
                }
            }
        }

        /**
         * Get/set the colors of the X Arrow
         */
        get xArrowColor(): Color3 {
            return this._xArrowColor;
        }

        set xArrowColor(value: Color3) {
            this._xArrowColor = value;
            this.updateMaterial("arrowX", value);
            this.updateMaterial("rotationX", value);
        }

        /**
         * Get/set the colors of the Y Arrow
         */
        get yArrowColor(): Color3 {
            return this._yArrowColor;
        }

        set yArrowColor(value: Color3) {
            this._yArrowColor = value;
            this.updateMaterial("arrowY", value);
            this.updateMaterial("rotationY", value);
        }

        /**
         * Get/set the colors of the Z Arrow
         */
        get zArrowColor(): Color3 {
            return this._zArrowColor;
        }

        set zArrowColor(value: Color3) {
            this._zArrowColor = value;
            this.updateMaterial("arrowZ", value);
            this.updateMaterial("rotationZ", value);
        }

        /**
         * Get/set the colors of the XY Plane selection anchor
         */
        get xyPlaneSelectionColor(): Color3 {
            return this._xyPlaneSelectionColor;
        }

        set xyPlaneSelectionColor(value: Color3) {
            this._xyPlaneSelectionColor = value;
        }

        /**
         * Get/set the colors of the XZ Plane selection anchor
         */
        get xzPlaneSelectionColor(): Color3 {
            return this._xzPlaneSelectionColor;
        }

        set xzPlaneSelectionColor(value: Color3) {
            this._xzPlaneSelectionColor = value;
        }

        /**
         * Get/set the colors of the YZ Plane selection anchor
         */
        get yzPlaneSelectionColor(): Color3 {
            return this._yzPlaneSelectionColor;
        }

        set yzPlaneSelectionColor(value: Color3) {
            this._yzPlaneSelectionColor = value;
        }

        /**
         * Get/set the feature of the Radix that are/must be highlighted
         * @returns {} 
         */
        get highlighted(): RadixFeatures {
            return this._highlighted;
        }

        set highlighted(value: RadixFeatures) {
            this.updateMaterialFromHighlighted(RadixFeatures.ArrowX, value, "arrowX");
            this.updateMaterialFromHighlighted(RadixFeatures.ArrowY, value, "arrowY");
            this.updateMaterialFromHighlighted(RadixFeatures.ArrowZ, value, "arrowZ");
            this.updateMaterialFromHighlighted(RadixFeatures.PlaneSelectionXY, value, "planeXY");
            this.updateMaterialFromHighlighted(RadixFeatures.PlaneSelectionXZ, value, "planeXZ");
            this.updateMaterialFromHighlighted(RadixFeatures.PlaneSelectionYZ, value, "planeYZ");
            this.updateMaterialFromHighlighted(RadixFeatures.RotationX, value, "rotationX");
            this.updateMaterialFromHighlighted(RadixFeatures.RotationY, value, "rotationY");
            this.updateMaterialFromHighlighted(RadixFeatures.RotationZ, value, "rotationZ");

            this._highlighted = value;
        }

        /**
         * Get the Radix Features that were selected upon creation
         */
        get features(): RadixFeatures {
            return this._features;
        }

        /**
         * Create a new Radix instance. The length/radius members are optionals and the default value should suit most cases
         * @param scene the owner Scene
         * @param features the feature the radix must display
         * @param arrowLength the length of a row of an axis, include the rotation cylinder (if any), but always exclude the arrow cone
         * @param coneLength the length of the arrow cone. this is also the length taken for the rotation cylinder (if any)
         * @param coneRadius the radius of the arrow cone
         * @param planeSelectionLength the length of the selection plane
         */
        constructor(scene: Scene, features: RadixFeatures = RadixFeatures.ArrowsXYZ | RadixFeatures.AllPlanesSelection | RadixFeatures.Rotations, arrowLength?: number, coneLength?: number, coneRadius?: number, planeSelectionLength?: number) {
            this._scene = scene;
            this._arrowLength = arrowLength ? arrowLength : 1;
            this._coneLength = coneLength ? coneLength : 0.2;
            this._coneRadius = coneRadius ? coneRadius : 0.1;
            this._planeSelectionLength = planeSelectionLength ? planeSelectionLength : (this._arrowLength / 5.0);

            this._wireSelectionThreshold = 0.05;

            this._light1 = new BABYLON.PointLight("ManipulatorLight", new BABYLON.Vector3(50, 50, 70), this._scene);
            this._light1.id = "***SceneManipulatorLight***";
            this._light2 = new BABYLON.PointLight("ManipulatorLight", new BABYLON.Vector3(-50, -50, -70), this._scene);
            this._light2.id = "***SceneManipulatorLight***";

            this._xArrowColor = new Color3(Radix.pc, Radix.sc / 2, Radix.sc);
            this._yArrowColor = new Color3(Radix.sc, Radix.pc, Radix.sc / 2);
            this._zArrowColor = new Color3(Radix.sc / 2, Radix.sc, Radix.pc);

            this._xyPlaneSelectionColor = new Color3(Radix.pc / 1.1, Radix.pc / 1.3, Radix.sc);
            this._xzPlaneSelectionColor = new Color3(Radix.pc / 1.1, Radix.sc, Radix.pc / 1.3);
            this._yzPlaneSelectionColor = new Color3(Radix.sc, Radix.pc / 1.3, Radix.pc / 1.1);

            var materials = [];
            materials.push({ name: "arrowX", color: this.xArrowColor });
            materials.push({ name: "arrowY", color: this.yArrowColor });
            materials.push({ name: "arrowZ", color: this.zArrowColor });
            materials.push({ name: "planeXY", color: this.xyPlaneSelectionColor });
            materials.push({ name: "planeXZ", color: this.xzPlaneSelectionColor });
            materials.push({ name: "planeYZ", color: this.yzPlaneSelectionColor });
            materials.push({ name: "rotationX", color: this.xArrowColor.clone() });
            materials.push({ name: "rotationY", color: this.yArrowColor.clone() });
            materials.push({ name: "rotationZ", color: this.zArrowColor.clone() });

            this._materials = [];
            for (var matData of materials) {
                var mtl = new StandardMaterial(matData.name + "RadixMaterial", this._scene);
                mtl.diffuseColor = matData.color;

                this._materials[matData.name] = mtl;
            }

            this._features = features;
            this._rootMesh = new Mesh("radixRoot", this._scene);
            this._rootMesh.renderingGroupId = 1;

            this.constructGraphicalObjects();
        }

        /**
         * make an intersection test between a point position in the viwport and the Radix, return the feature that is intersected, if any.
         * only the closer Radix Feature is picked.
         * @param pos the viewport position to create the picking ray from.
         */
        intersect(pos: Vector2): RadixFeatures {
            let hit = RadixFeatures.None;
            let closest = Number.MAX_VALUE;

            // Arrows
            if (this.hasFeature(RadixFeatures.ArrowX)) {
                let dist = this.intersectMeshes(pos, "arrowX", closest);
                if (dist < closest) {
                    closest = dist;
                    hit = RadixFeatures.ArrowX;
                }
            }

            if (this.hasFeature(RadixFeatures.ArrowY)) {
                let dist = this.intersectMeshes(pos, "arrowY", closest);
                if (dist < closest) {
                    closest = dist;
                    hit = RadixFeatures.ArrowY;
                }
            }

            if (this.hasFeature(RadixFeatures.ArrowZ)) {
                let dist = this.intersectMeshes(pos, "arrowZ", closest);
                if (dist < closest) {
                    closest = dist;
                    hit = RadixFeatures.ArrowZ;
                }
            }

            // Planes
            if (this.hasFeature(RadixFeatures.PlaneSelectionXY)) {
                let dist = this.intersectMeshes(pos, "planeXY", closest);
                if (dist < closest) {
                    closest = dist;
                    hit = RadixFeatures.PlaneSelectionXY;
                }
            }

            if (this.hasFeature(RadixFeatures.PlaneSelectionXZ)) {
                let dist = this.intersectMeshes(pos, "planeXZ", closest);
                if (dist < closest) {
                    closest = dist;
                    hit = RadixFeatures.PlaneSelectionXZ;
                }
            }

            if (this.hasFeature(RadixFeatures.PlaneSelectionYZ)) {
                let dist = this.intersectMeshes(pos, "planeYZ", closest);
                if (dist < closest) {
                    closest = dist;
                    hit = RadixFeatures.PlaneSelectionYZ;
                }
            }

            // Rotation
            if (this.hasFeature(RadixFeatures.RotationX)) {
                let dist = this.intersectMeshes(pos, "rotationX", closest);
                if (dist < closest) {
                    closest = dist;
                    hit = RadixFeatures.RotationX;
                }
            }

            if (this.hasFeature(RadixFeatures.RotationY)) {
                let dist = this.intersectMeshes(pos, "rotationY", closest);
                if (dist < closest) {
                    closest = dist;
                    hit = RadixFeatures.RotationY;
                }
            }

            if (this.hasFeature(RadixFeatures.RotationZ)) {
                let dist = this.intersectMeshes(pos, "rotationZ", closest);
                if (dist < closest) {
                    closest = dist;
                    hit = RadixFeatures.RotationZ;
                }
            }
            return hit;
        }

        /**
         * Set the world coordinate of where the Axis should be displayed
         * @param position the position
         * @param rotation the rotation quaternion
         * @param scale the scale (should be uniform)
         */
        setWorld(position: Vector3, rotation: Quaternion, scale: Vector3) {
            this._rootMesh.position = position;
            this._rootMesh.rotationQuaternion = rotation;
            this._rootMesh.scaling = scale;
        }

        /**
         * Display the Radix on screen
         */
        show() {
            this.setVisibleState(this._rootMesh, true);
        }

        /**
         * Hide the Radix from the screen
         */
        hide() {
            this.setVisibleState(this._rootMesh, false);
        }

        private setVisibleState(mesh: AbstractMesh, state: boolean) {
            mesh.isVisible = state;
            mesh.getChildMeshes(true).forEach(m => this.setVisibleState(m, state));
        }

        private intersectMeshes(pos: Vector2, startName: string, currentClosest: number): number {
            let meshes = this._rootMesh.getChildMeshes(true, m => m.name.indexOf(startName) === 0);
            for (var mesh of meshes) {
                var ray = this._scene.createPickingRay(pos.x, pos.y, mesh.getWorldMatrix(), this._scene.activeCamera);
                var pi = mesh.intersects(ray, false);
                if (pi.hit && pi.distance < currentClosest) {
                    currentClosest = pi.distance;
                }
            }
            return currentClosest;
        }

        private constructGraphicalObjects() {
            var hp = Math.PI / 2;
            if (this.hasFeature(RadixFeatures.ArrowX)) {
                this.constructArrow(RadixFeatures.ArrowX, "arrowX", Matrix.RotationZ(-hp));
            }
            if (this.hasFeature(RadixFeatures.ArrowY)) {
                this.constructArrow(RadixFeatures.ArrowY, "arrowY", Matrix.Identity());
            }
            if (this.hasFeature(RadixFeatures.ArrowZ)) {
                this.constructArrow(RadixFeatures.ArrowZ, "arrowZ", Matrix.RotationX(hp));
            }

            if (this.hasFeature(RadixFeatures.PlaneSelectionXY)) {
                this.constructPlaneSelection(RadixFeatures.PlaneSelectionXY, "planeXY", Matrix.Identity());
            }

            if (this.hasFeature(RadixFeatures.PlaneSelectionXZ)) {
                this.constructPlaneSelection(RadixFeatures.PlaneSelectionXZ, "planeXZ", Matrix.RotationX(hp));
            }

            if (this.hasFeature(RadixFeatures.PlaneSelectionYZ)) {
                this.constructPlaneSelection(RadixFeatures.PlaneSelectionYZ, "planeYZ", Matrix.RotationY(-hp));
            }

            if (this.hasFeature(RadixFeatures.RotationX)) {
                this.constructRotation(RadixFeatures.RotationX, "rotationX", Matrix.RotationZ(-hp));
            }

            if (this.hasFeature(RadixFeatures.RotationY)) {
                this.constructRotation(RadixFeatures.RotationY, "rotationY", Matrix.Identity());
            }

            if (this.hasFeature(RadixFeatures.RotationZ)) {
                this.constructRotation(RadixFeatures.RotationZ, "rotationZ", Matrix.RotationX(hp));
            }

        }

        private constructArrow(feature: RadixFeatures, name: string, transform: Matrix) {
            let mtl = this.getMaterial(name);
            let hasRot;

            switch (feature) {
                case RadixFeatures.ArrowX:
                    hasRot = this.hasFeature(RadixFeatures.RotationX);
                    break;
                case RadixFeatures.ArrowY:
                    hasRot = this.hasFeature(RadixFeatures.RotationY);
                    break;
                case RadixFeatures.ArrowZ:
                    hasRot = this.hasFeature(RadixFeatures.RotationZ);
                    break;
            }

            let rotation = Quaternion.FromRotationMatrix(transform);

            let points = new Array<number>();
            points.push(0, hasRot ? this._coneLength : 0, 0);
            points.push(0, this._arrowLength - this._coneLength, 0);

            let wireMesh = new LinesMesh(name + "Wire", this._scene);
            wireMesh.rotationQuaternion = rotation;
            wireMesh.parent = this._rootMesh;
            wireMesh.color = mtl.diffuseColor;
            wireMesh.renderingGroupId = 1;
            wireMesh.intersectionThreshold = this.wireSelectionThreshold;
            wireMesh.isPickable = false;

            var vd = new VertexData();
            vd.positions = points;
            vd.indices = [0, 1];
            vd.applyToMesh(wireMesh);

            let arrow = Mesh.CreateCylinder(name + "Cone", this._coneLength, 0, this._coneRadius, 18, 1, this._scene, false);
            arrow.position = Vector3.TransformCoordinates(new Vector3(0, this._arrowLength - (this._coneLength / 2), 0), transform);
            arrow.rotationQuaternion = rotation;
            arrow.material = mtl;
            arrow.parent = this._rootMesh;
            arrow.renderingGroupId = 1;
            arrow.isPickable = false;
            this.addSymbolicMeshToLit(arrow);
        }

        private constructPlaneSelection(feature: RadixFeatures, name: string, transform: Matrix) {
            let mtl = this.getMaterial(name);

            let points = new Array<Vector3>();

            points.push(new Vector3(this._arrowLength - this._planeSelectionLength, this._arrowLength, 0));
            points.push(new Vector3(this._arrowLength, this._arrowLength, 0));
            points.push(new Vector3(this._arrowLength, this._arrowLength - this._planeSelectionLength, 0));

            let wireMesh = Mesh.CreateLines(name + "Plane", points, this._scene);
            wireMesh.parent = this._rootMesh;
            wireMesh.color = mtl.diffuseColor;
            wireMesh.rotationQuaternion = Quaternion.FromRotationMatrix(transform);
            wireMesh.renderingGroupId = 1;
            wireMesh.intersectionThreshold = this.wireSelectionThreshold;
            wireMesh.isPickable = false;
        }

        private constructRotation(feature: RadixFeatures, name: string, transform: Matrix) {
            let mtl = this.getMaterial(name);

            var rotCyl = Mesh.CreateCylinder(name + "Cylinder", this._coneLength, this._coneRadius, this._coneRadius, 18, 1, this._scene, false);
            rotCyl.material = mtl;
            rotCyl.position = Vector3.TransformCoordinates(new Vector3(0, this._coneLength / 2, 0), transform);
            rotCyl.rotationQuaternion = Quaternion.FromRotationMatrix(transform);
            rotCyl.parent = this._rootMesh;
            rotCyl.renderingGroupId = 1;
            rotCyl.isPickable = false;
            this.addSymbolicMeshToLit(rotCyl);
        }

        private addSymbolicMeshToLit(mesh: AbstractMesh) {
            this._light1.includedOnlyMeshes.push(mesh);
            this._light2.includedOnlyMeshes.push(mesh);
            this._scene.lights.map(l => { if ((l !== this._light1) && (l !== this._light2)) l.excludedMeshes.push(mesh) });
        }

        private hasFeature(value: RadixFeatures): boolean {
            return (this._features & value) !== 0;
        }

        private hasHighlightedFeature(value: RadixFeatures): boolean {
            return (this._highlighted & value) !== 0;
        }

        private updateMaterial(name: string, color: Color3) {
            let mtl = this.getMaterial(name);
            if (mtl) {
                mtl.diffuseColor = color;
            }
        }

        private updateMaterialFromHighlighted(feature: RadixFeatures, highlighted: RadixFeatures, name: string) {
            if (!this.hasFeature(feature)) {
                return;
            }

            if ((this._highlighted & feature) !== (highlighted & feature)) {
                let mtl = this.getMaterial(name);
                if ((highlighted&feature) !== 0) {
                    mtl.diffuseColor.r *= 1.8;
                    mtl.diffuseColor.g *= 1.8;
                    mtl.diffuseColor.b *= 1.8;
                } else {
                    mtl.diffuseColor.r /= 1.8;
                    mtl.diffuseColor.g /= 1.8;
                    mtl.diffuseColor.b /= 1.8;
                }
            }
        }

        private getMaterial(name: string): StandardMaterial {
            var mtl = <StandardMaterial>this._materials[name];
            return mtl;
        }

        private _arrowLength: number;
        private _coneLength: number;
        private _coneRadius: number;
        private _planeSelectionLength: number;

        private _light1: PointLight;
        private _light2: PointLight;
        private _rootMesh: Mesh;
        private _features: RadixFeatures;
        private _scene: Scene;
        private _materials;
        private _wireSelectionThreshold: number;
        private _xArrowColor: Color3;
        private _yArrowColor: Color3;
        private _zArrowColor: Color3;
        private _xyPlaneSelectionColor: Color3;
        private _xzPlaneSelectionColor: Color3;
        private _yzPlaneSelectionColor: Color3;
        private _highlighted: RadixFeatures;
    }
}