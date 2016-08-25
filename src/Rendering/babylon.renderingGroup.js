var BABYLON;
(function (BABYLON) {
    var RenderingGroup = (function () {
        /**
         * Creates a new rendering group.
         * @param index The rendering group index
         * @param opaqueSortCompareFn The opaque sort comparison function. If null no order is applied
         * @param alphaTestSortCompareFn The alpha test sort comparison function. If null no order is applied
         * @param transparentSortCompareFn The transparent sort comparison function. If null back to front + alpha index sort is applied
         */
        function RenderingGroup(index, scene, opaqueSortCompareFn, alphaTestSortCompareFn, transparentSortCompareFn) {
            if (opaqueSortCompareFn === void 0) { opaqueSortCompareFn = null; }
            if (alphaTestSortCompareFn === void 0) { alphaTestSortCompareFn = null; }
            if (transparentSortCompareFn === void 0) { transparentSortCompareFn = null; }
            this.index = index;
            this._opaqueSubMeshes = new BABYLON.SmartArray(256);
            this._transparentSubMeshes = new BABYLON.SmartArray(256);
            this._alphaTestSubMeshes = new BABYLON.SmartArray(256);
            this._scene = scene;
            this.opaqueSortCompareFn = opaqueSortCompareFn;
            this.alphaTestSortCompareFn = alphaTestSortCompareFn;
            this.transparentSortCompareFn = transparentSortCompareFn;
        }
        Object.defineProperty(RenderingGroup.prototype, "opaqueSortCompareFn", {
            /**
             * Set the opaque sort comparison function.
             * If null the sub meshes will be render in the order they were created
             */
            set: function (value) {
                this._opaqueSortCompareFn = value;
                if (value) {
                    this._renderOpaque = this.renderOpaqueSorted;
                }
                else {
                    this._renderOpaque = RenderingGroup.renderUnsorted;
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RenderingGroup.prototype, "alphaTestSortCompareFn", {
            /**
             * Set the alpha test sort comparison function.
             * If null the sub meshes will be render in the order they were created
             */
            set: function (value) {
                this._alphaTestSortCompareFn = value;
                if (value) {
                    this._renderAlphaTest = this.renderAlphaTestSorted;
                }
                else {
                    this._renderAlphaTest = RenderingGroup.renderUnsorted;
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(RenderingGroup.prototype, "transparentSortCompareFn", {
            /**
             * Set the transparent sort comparison function.
             * If null the sub meshes will be render in the order they were created
             */
            set: function (value) {
                if (value) {
                    this._transparentSortCompareFn = value;
                }
                else {
                    this._transparentSortCompareFn = RenderingGroup.defaultTransparentSortCompare;
                }
                this._renderTransparent = this.renderTransparentSorted;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Render all the sub meshes contained in the group.
         * @param customRenderFunction Used to override the default render behaviour of the group.
         * @returns true if rendered some submeshes.
         */
        RenderingGroup.prototype.render = function (customRenderFunction) {
            if (customRenderFunction) {
                customRenderFunction(this._opaqueSubMeshes, this._alphaTestSubMeshes, this._transparentSubMeshes);
                return true;
            }
            if (this._opaqueSubMeshes.length === 0 && this._alphaTestSubMeshes.length === 0 && this._transparentSubMeshes.length === 0) {
                if (this.onBeforeTransparentRendering) {
                    this.onBeforeTransparentRendering();
                }
                return false;
            }
            var engine = this._scene.getEngine();
            // Opaque
            this._renderOpaque(this._opaqueSubMeshes);
            // Alpha test
            engine.setAlphaTesting(true);
            this._renderAlphaTest(this._alphaTestSubMeshes);
            engine.setAlphaTesting(false);
            if (this.onBeforeTransparentRendering) {
                this.onBeforeTransparentRendering();
            }
            // Transparent
            this._renderTransparent(this._transparentSubMeshes);
            engine.setAlphaMode(BABYLON.Engine.ALPHA_DISABLE);
            return true;
        };
        /**
         * Renders the opaque submeshes in the order from the opaqueSortCompareFn.
         * @param subMeshes The submeshes to render
         */
        RenderingGroup.prototype.renderOpaqueSorted = function (subMeshes) {
            return RenderingGroup.renderSorted(subMeshes, this._opaqueSortCompareFn, this._scene.activeCamera.globalPosition, false);
        };
        /**
         * Renders the opaque submeshes in the order from the alphatestSortCompareFn.
         * @param subMeshes The submeshes to render
         */
        RenderingGroup.prototype.renderAlphaTestSorted = function (subMeshes) {
            return RenderingGroup.renderSorted(subMeshes, this._alphaTestSortCompareFn, this._scene.activeCamera.globalPosition, false);
        };
        /**
         * Renders the opaque submeshes in the order from the transparentSortCompareFn.
         * @param subMeshes The submeshes to render
         */
        RenderingGroup.prototype.renderTransparentSorted = function (subMeshes) {
            return RenderingGroup.renderSorted(subMeshes, this._transparentSortCompareFn, this._scene.activeCamera.globalPosition, true);
        };
        /**
         * Renders the submeshes in a specified order.
         * @param subMeshes The submeshes to sort before render
         * @param sortCompareFn The comparison function use to sort
         * @param cameraPosition The camera position use to preprocess the submeshes to help sorting
         * @param transparent Specifies to activate blending if true
         */
        RenderingGroup.renderSorted = function (subMeshes, sortCompareFn, cameraPosition, transparent) {
            var subIndex = 0;
            var subMesh;
            for (; subIndex < subMeshes.length; subIndex++) {
                subMesh = subMeshes.data[subIndex];
                subMesh._alphaIndex = subMesh.getMesh().alphaIndex;
                subMesh._distanceToCamera = subMesh.getBoundingInfo().boundingSphere.centerWorld.subtract(cameraPosition).length();
            }
            var sortedArray = subMeshes.data.slice(0, subMeshes.length);
            sortedArray.sort(sortCompareFn);
            for (subIndex = 0; subIndex < sortedArray.length; subIndex++) {
                subMesh = sortedArray[subIndex];
                subMesh.render(transparent);
            }
        };
        /**
         * Renders the submeshes in the order they were dispatched (no sort applied).
         * @param subMeshes The submeshes to render
         */
        RenderingGroup.renderUnsorted = function (subMeshes) {
            for (var subIndex = 0; subIndex < subMeshes.length; subIndex++) {
                var submesh = subMeshes.data[subIndex];
                submesh.render(false);
            }
        };
        /**
         * Build in function which can be applied to ensure meshes of a special queue (opaque, alpha test, transparent)
         * are rendered back to front if in the same alpha index.
         *
         * @param a The first submesh
         * @param b The second submesh
         * @returns The result of the comparison
         */
        RenderingGroup.defaultTransparentSortCompare = function (a, b) {
            // Alpha index first
            if (a._alphaIndex > b._alphaIndex) {
                return 1;
            }
            if (a._alphaIndex < b._alphaIndex) {
                return -1;
            }
            // Then distance to camera
            return RenderingGroup.backToFrontSortCompare(a, b);
        };
        /**
         * Build in function which can be applied to ensure meshes of a special queue (opaque, alpha test, transparent)
         * are rendered back to front.
         *
         * @param a The first submesh
         * @param b The second submesh
         * @returns The result of the comparison
         */
        RenderingGroup.backToFrontSortCompare = function (a, b) {
            // Then distance to camera
            if (a._distanceToCamera < b._distanceToCamera) {
                return 1;
            }
            if (a._distanceToCamera > b._distanceToCamera) {
                return -1;
            }
            return 0;
        };
        /**
         * Build in function which can be applied to ensure meshes of a special queue (opaque, alpha test, transparent)
         * are rendered front to back (prevent overdraw).
         *
         * @param a The first submesh
         * @param b The second submesh
         * @returns The result of the comparison
         */
        RenderingGroup.frontToBackSortCompare = function (a, b) {
            // Then distance to camera
            if (a._distanceToCamera < b._distanceToCamera) {
                return -1;
            }
            if (a._distanceToCamera > b._distanceToCamera) {
                return 1;
            }
            return 0;
        };
        /**
         * Resets the different lists of submeshes to prepare a new frame.
         */
        RenderingGroup.prototype.prepare = function () {
            this._opaqueSubMeshes.reset();
            this._transparentSubMeshes.reset();
            this._alphaTestSubMeshes.reset();
        };
        /**
         * Inserts the submesh in its correct queue depending on its material.
         * @param subMesh The submesh to dispatch
         */
        RenderingGroup.prototype.dispatch = function (subMesh) {
            var material = subMesh.getMaterial();
            var mesh = subMesh.getMesh();
            if (material.needAlphaBlending() || mesh.visibility < 1.0 || mesh.hasVertexAlpha) {
                this._transparentSubMeshes.push(subMesh);
            }
            else if (material.needAlphaTesting()) {
                this._alphaTestSubMeshes.push(subMesh);
            }
            else {
                this._opaqueSubMeshes.push(subMesh); // Opaque
            }
        };
        return RenderingGroup;
    })();
    BABYLON.RenderingGroup = RenderingGroup;
})(BABYLON || (BABYLON = {}));
