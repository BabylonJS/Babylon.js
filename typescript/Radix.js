var Sandbox;
(function (Sandbox) {
    var Color3 = BABYLON.Color3;
    var StandardMaterial = BABYLON.StandardMaterial;
    var Matrix = BABYLON.Matrix;
    var Mesh = BABYLON.Mesh;
    var Vector3 = BABYLON.Vector3;
    var Quaternion = BABYLON.Quaternion;
    var VertexData = BABYLON.VertexData;
    var LinesMesh = BABYLON.LinesMesh;
    /**
     * This class create the visual geometry to display a manipulation radix in a viewport.
     * It also implements the logic to handler intersection, hover on feature.
     */
    var Radix = (function () {
        /**
         * Create a new Radix instance. The length/radius members are optionals and the default value should suit most cases
         * @param scene the owner Scene
         * @param features the feature the radix must display
         * @param arrowLength the length of a row of an axis, include the rotation cylinder (if any), but always exclude the arrow cone
         * @param coneLength the length of the arrow cone. this is also the length taken for the rotation cylinder (if any)
         * @param coneRadius the radius of the arrow cone
         * @param planeSelectionLength the length of the selection plane
         */
        function Radix(scene, features, arrowLength, coneLength, coneRadius, planeSelectionLength) {
            if (features === void 0) { features = 7 /* ArrowsXYZ */ | 112 /* AllPlanesSelection */ | 1792 /* Rotations */; }
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
            for (var _i = 0, materials_1 = materials; _i < materials_1.length; _i++) {
                var matData = materials_1[_i];
                var mtl = new StandardMaterial(matData.name + "RadixMaterial", this._scene);
                mtl.diffuseColor = matData.color;
                this._materials[matData.name] = mtl;
            }
            this._features = features;
            this._rootMesh = new Mesh("radixRoot", this._scene);
            this._rootMesh.renderingGroupId = 1;
            this.constructGraphicalObjects();
        }
        Object.defineProperty(Radix.prototype, "wireSelectionThreshold", {
            /**
             * Set/get the Wire Selection Threshold, set a bigger value to improve tolerance while picking a wire mesh
             */
            get: function () {
                return this._wireSelectionThreshold;
            },
            set: function (value) {
                this._wireSelectionThreshold = value;
                var meshes = this._rootMesh.getChildMeshes(true, function (m) { return m instanceof LinesMesh; });
                for (var _i = 0, meshes_1 = meshes; _i < meshes_1.length; _i++) {
                    var mesh = meshes_1[_i];
                    var lm = mesh;
                    if (lm) {
                        lm.intersectionThreshold = value;
                    }
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Radix.prototype, "xArrowColor", {
            /**
             * Get/set the colors of the X Arrow
             */
            get: function () {
                return this._xArrowColor;
            },
            set: function (value) {
                this._xArrowColor = value;
                this.updateMaterial("arrowX", value);
                this.updateMaterial("rotationX", value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Radix.prototype, "yArrowColor", {
            /**
             * Get/set the colors of the Y Arrow
             */
            get: function () {
                return this._yArrowColor;
            },
            set: function (value) {
                this._yArrowColor = value;
                this.updateMaterial("arrowY", value);
                this.updateMaterial("rotationY", value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Radix.prototype, "zArrowColor", {
            /**
             * Get/set the colors of the Z Arrow
             */
            get: function () {
                return this._zArrowColor;
            },
            set: function (value) {
                this._zArrowColor = value;
                this.updateMaterial("arrowZ", value);
                this.updateMaterial("rotationZ", value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Radix.prototype, "xyPlaneSelectionColor", {
            /**
             * Get/set the colors of the XY Plane selection anchor
             */
            get: function () {
                return this._xyPlaneSelectionColor;
            },
            set: function (value) {
                this._xyPlaneSelectionColor = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Radix.prototype, "xzPlaneSelectionColor", {
            /**
             * Get/set the colors of the XZ Plane selection anchor
             */
            get: function () {
                return this._xzPlaneSelectionColor;
            },
            set: function (value) {
                this._xzPlaneSelectionColor = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Radix.prototype, "yzPlaneSelectionColor", {
            /**
             * Get/set the colors of the YZ Plane selection anchor
             */
            get: function () {
                return this._yzPlaneSelectionColor;
            },
            set: function (value) {
                this._yzPlaneSelectionColor = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Radix.prototype, "highlighted", {
            /**
             * Get/set the feature of the Radix that are/must be highlighted
             * @returns {}
             */
            get: function () {
                return this._highlighted;
            },
            set: function (value) {
                this.updateMaterialFromHighlighted(1 /* ArrowX */, value, "arrowX");
                this.updateMaterialFromHighlighted(2 /* ArrowY */, value, "arrowY");
                this.updateMaterialFromHighlighted(4 /* ArrowZ */, value, "arrowZ");
                this.updateMaterialFromHighlighted(16 /* PlaneSelectionXY */, value, "planeXY");
                this.updateMaterialFromHighlighted(32 /* PlaneSelectionXZ */, value, "planeXZ");
                this.updateMaterialFromHighlighted(64 /* PlaneSelectionYZ */, value, "planeYZ");
                this.updateMaterialFromHighlighted(256 /* RotationX */, value, "rotationX");
                this.updateMaterialFromHighlighted(512 /* RotationY */, value, "rotationY");
                this.updateMaterialFromHighlighted(1024 /* RotationZ */, value, "rotationZ");
                this._highlighted = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Radix.prototype, "features", {
            /**
             * Get the Radix Features that were selected upon creation
             */
            get: function () {
                return this._features;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * make an intersection test between a point position in the viwport and the Radix, return the feature that is intersected, if any.
         * only the closer Radix Feature is picked.
         * @param pos the viewport position to create the picking ray from.
         */
        Radix.prototype.intersect = function (pos) {
            var hit = 0 /* None */;
            var closest = Number.MAX_VALUE;
            // Arrows
            if (this.hasFeature(1 /* ArrowX */)) {
                var dist = this.intersectMeshes(pos, "arrowX", closest);
                if (dist < closest) {
                    closest = dist;
                    hit = 1 /* ArrowX */;
                }
            }
            if (this.hasFeature(2 /* ArrowY */)) {
                var dist = this.intersectMeshes(pos, "arrowY", closest);
                if (dist < closest) {
                    closest = dist;
                    hit = 2 /* ArrowY */;
                }
            }
            if (this.hasFeature(4 /* ArrowZ */)) {
                var dist = this.intersectMeshes(pos, "arrowZ", closest);
                if (dist < closest) {
                    closest = dist;
                    hit = 4 /* ArrowZ */;
                }
            }
            // Planes
            if (this.hasFeature(16 /* PlaneSelectionXY */)) {
                var dist = this.intersectMeshes(pos, "planeXY", closest);
                if (dist < closest) {
                    closest = dist;
                    hit = 16 /* PlaneSelectionXY */;
                }
            }
            if (this.hasFeature(32 /* PlaneSelectionXZ */)) {
                var dist = this.intersectMeshes(pos, "planeXZ", closest);
                if (dist < closest) {
                    closest = dist;
                    hit = 32 /* PlaneSelectionXZ */;
                }
            }
            if (this.hasFeature(64 /* PlaneSelectionYZ */)) {
                var dist = this.intersectMeshes(pos, "planeYZ", closest);
                if (dist < closest) {
                    closest = dist;
                    hit = 64 /* PlaneSelectionYZ */;
                }
            }
            // Rotation
            if (this.hasFeature(256 /* RotationX */)) {
                var dist = this.intersectMeshes(pos, "rotationX", closest);
                if (dist < closest) {
                    closest = dist;
                    hit = 256 /* RotationX */;
                }
            }
            if (this.hasFeature(512 /* RotationY */)) {
                var dist = this.intersectMeshes(pos, "rotationY", closest);
                if (dist < closest) {
                    closest = dist;
                    hit = 512 /* RotationY */;
                }
            }
            if (this.hasFeature(1024 /* RotationZ */)) {
                var dist = this.intersectMeshes(pos, "rotationZ", closest);
                if (dist < closest) {
                    closest = dist;
                    hit = 1024 /* RotationZ */;
                }
            }
            return hit;
        };
        /**
         * Set the world coordinate of where the Axis should be displayed
         * @param position the position
         * @param rotation the rotation quaternion
         * @param scale the scale (should be uniform)
         */
        Radix.prototype.setWorld = function (position, rotation, scale) {
            this._rootMesh.position = position;
            this._rootMesh.rotationQuaternion = rotation;
            this._rootMesh.scaling = scale;
        };
        /**
         * Display the Radix on screen
         */
        Radix.prototype.show = function () {
            this.setVisibleState(this._rootMesh, true);
        };
        /**
         * Hide the Radix from the screen
         */
        Radix.prototype.hide = function () {
            this.setVisibleState(this._rootMesh, false);
        };
        Radix.prototype.setVisibleState = function (mesh, state) {
            var _this = this;
            mesh.isVisible = state;
            mesh.getChildMeshes(true).forEach(function (m) { return _this.setVisibleState(m, state); });
        };
        Radix.prototype.intersectMeshes = function (pos, startName, currentClosest) {
            var meshes = this._rootMesh.getChildMeshes(true, function (m) { return m.name.indexOf(startName) === 0; });
            for (var _i = 0, meshes_2 = meshes; _i < meshes_2.length; _i++) {
                var mesh = meshes_2[_i];
                var ray = this._scene.createPickingRay(pos.x, pos.y, mesh.getWorldMatrix(), this._scene.activeCamera);
                var pi = mesh.intersects(ray, false);
                if (pi.hit && pi.distance < currentClosest) {
                    currentClosest = pi.distance;
                }
            }
            return currentClosest;
        };
        Radix.prototype.constructGraphicalObjects = function () {
            var hp = Math.PI / 2;
            if (this.hasFeature(1 /* ArrowX */)) {
                this.constructArrow(1 /* ArrowX */, "arrowX", Matrix.RotationZ(-hp));
            }
            if (this.hasFeature(2 /* ArrowY */)) {
                this.constructArrow(2 /* ArrowY */, "arrowY", Matrix.Identity());
            }
            if (this.hasFeature(4 /* ArrowZ */)) {
                this.constructArrow(4 /* ArrowZ */, "arrowZ", Matrix.RotationX(hp));
            }
            if (this.hasFeature(16 /* PlaneSelectionXY */)) {
                this.constructPlaneSelection(16 /* PlaneSelectionXY */, "planeXY", Matrix.Identity());
            }
            if (this.hasFeature(32 /* PlaneSelectionXZ */)) {
                this.constructPlaneSelection(32 /* PlaneSelectionXZ */, "planeXZ", Matrix.RotationX(hp));
            }
            if (this.hasFeature(64 /* PlaneSelectionYZ */)) {
                this.constructPlaneSelection(64 /* PlaneSelectionYZ */, "planeYZ", Matrix.RotationY(-hp));
            }
            if (this.hasFeature(256 /* RotationX */)) {
                this.constructRotation(256 /* RotationX */, "rotationX", Matrix.RotationZ(-hp));
            }
            if (this.hasFeature(512 /* RotationY */)) {
                this.constructRotation(512 /* RotationY */, "rotationY", Matrix.Identity());
            }
            if (this.hasFeature(1024 /* RotationZ */)) {
                this.constructRotation(1024 /* RotationZ */, "rotationZ", Matrix.RotationX(hp));
            }
        };
        Radix.prototype.constructArrow = function (feature, name, transform) {
            var mtl = this.getMaterial(name);
            var hasRot;
            switch (feature) {
                case 1 /* ArrowX */:
                    hasRot = this.hasFeature(256 /* RotationX */);
                    break;
                case 2 /* ArrowY */:
                    hasRot = this.hasFeature(512 /* RotationY */);
                    break;
                case 4 /* ArrowZ */:
                    hasRot = this.hasFeature(1024 /* RotationZ */);
                    break;
            }
            var rotation = Quaternion.FromRotationMatrix(transform);
            var points = new Array();
            points.push(0, hasRot ? this._coneLength : 0, 0);
            points.push(0, this._arrowLength - this._coneLength, 0);
            var wireMesh = new LinesMesh(name + "Wire", this._scene);
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
            var arrow = Mesh.CreateCylinder(name + "Cone", this._coneLength, 0, this._coneRadius, 18, 1, this._scene, false);
            arrow.position = Vector3.TransformCoordinates(new Vector3(0, this._arrowLength - (this._coneLength / 2), 0), transform);
            arrow.rotationQuaternion = rotation;
            arrow.material = mtl;
            arrow.parent = this._rootMesh;
            arrow.renderingGroupId = 1;
            arrow.isPickable = false;
            this.addSymbolicMeshToLit(arrow);
        };
        Radix.prototype.constructPlaneSelection = function (feature, name, transform) {
            var mtl = this.getMaterial(name);
            var points = new Array();
            points.push(new Vector3(this._arrowLength - this._planeSelectionLength, this._arrowLength, 0));
            points.push(new Vector3(this._arrowLength, this._arrowLength, 0));
            points.push(new Vector3(this._arrowLength, this._arrowLength - this._planeSelectionLength, 0));
            var wireMesh = Mesh.CreateLines(name + "Plane", points, this._scene);
            wireMesh.parent = this._rootMesh;
            wireMesh.color = mtl.diffuseColor;
            wireMesh.rotationQuaternion = Quaternion.FromRotationMatrix(transform);
            wireMesh.renderingGroupId = 1;
            wireMesh.intersectionThreshold = this.wireSelectionThreshold;
            wireMesh.isPickable = false;
        };
        Radix.prototype.constructRotation = function (feature, name, transform) {
            var mtl = this.getMaterial(name);
            var rotCyl = Mesh.CreateCylinder(name + "Cylinder", this._coneLength, this._coneRadius, this._coneRadius, 18, 1, this._scene, false);
            rotCyl.material = mtl;
            rotCyl.position = Vector3.TransformCoordinates(new Vector3(0, this._coneLength / 2, 0), transform);
            rotCyl.rotationQuaternion = Quaternion.FromRotationMatrix(transform);
            rotCyl.parent = this._rootMesh;
            rotCyl.renderingGroupId = 1;
            rotCyl.isPickable = false;
            this.addSymbolicMeshToLit(rotCyl);
        };
        Radix.prototype.addSymbolicMeshToLit = function (mesh) {
            var _this = this;
            this._light1.includedOnlyMeshes.push(mesh);
            this._light2.includedOnlyMeshes.push(mesh);
            this._scene.lights.map(function (l) { if ((l !== _this._light1) && (l !== _this._light2))
                l.excludedMeshes.push(mesh); });
        };
        Radix.prototype.hasFeature = function (value) {
            return (this._features & value) !== 0;
        };
        Radix.prototype.hasHighlightedFeature = function (value) {
            return (this._highlighted & value) !== 0;
        };
        Radix.prototype.updateMaterial = function (name, color) {
            var mtl = this.getMaterial(name);
            if (mtl) {
                mtl.diffuseColor = color;
            }
        };
        Radix.prototype.updateMaterialFromHighlighted = function (feature, highlighted, name) {
            if (!this.hasFeature(feature)) {
                return;
            }
            if ((this._highlighted & feature) !== (highlighted & feature)) {
                var mtl = this.getMaterial(name);
                if ((highlighted & feature) !== 0) {
                    mtl.diffuseColor.r *= 1.8;
                    mtl.diffuseColor.g *= 1.8;
                    mtl.diffuseColor.b *= 1.8;
                }
                else {
                    mtl.diffuseColor.r /= 1.8;
                    mtl.diffuseColor.g /= 1.8;
                    mtl.diffuseColor.b /= 1.8;
                }
            }
        };
        Radix.prototype.getMaterial = function (name) {
            var mtl = this._materials[name];
            return mtl;
        };
        Radix.pc = 0.6;
        Radix.sc = 0.2;
        return Radix;
    }());
    Sandbox.Radix = Radix;
})(Sandbox || (Sandbox = {}));
//# sourceMappingURL=Radix.js.map