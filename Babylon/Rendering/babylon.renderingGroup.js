"use strict";

var BABYLON = BABYLON || {};

(function () {
    BABYLON.RenderingGroup = function (index, scene) {
        this.index = index;
        this._scene = scene;

        this._opaqueSubMeshes = new BABYLON.Tools.SmartArray(256);
        this._transparentSubMeshes = new BABYLON.Tools.SmartArray(256);
        this._alphaTestSubMeshes = new BABYLON.Tools.SmartArray(256);
    };

    // Methods
    BABYLON.RenderingGroup.prototype.render = function (customRenderFunction, beforeTransparents) {
        if (customRenderFunction) {
            customRenderFunction(this._opaqueSubMeshes, this._alphaTestSubMeshes, this._transparentSubMeshes, beforeTransparents);
            return true;
        }

        if (this._opaqueSubMeshes.length === 0 && this._alphaTestSubMeshes.length === 0 && this._transparentSubMeshes === 0) {
            return false;
        }
        var engine = this._scene.getEngine();
        // Opaque
        var subIndex;
        var submesh;
        for (subIndex = 0; subIndex < this._opaqueSubMeshes.length; subIndex++) {
            submesh = this._opaqueSubMeshes.data[subIndex];
            this._activeVertices += submesh.verticesCount;

            submesh.render();
        }

        // Alpha test
        engine.setAlphaTesting(true);
        for (subIndex = 0; subIndex < this._alphaTestSubMeshes.length; subIndex++) {
            submesh = this._alphaTestSubMeshes.data[subIndex];
            this._activeVertices += submesh.verticesCount;

            submesh.render();
        }
        engine.setAlphaTesting(false);

        if (beforeTransparents) {
            beforeTransparents();
        }

        // Transparent
        if (this._transparentSubMeshes.length) {
            // Sorting
            for (subIndex = 0; subIndex < this._transparentSubMeshes.length; subIndex++) {
                submesh = this._transparentSubMeshes.data[subIndex];
                submesh._distanceToCamera = submesh.getBoundingInfo().boundingSphere.centerWorld.subtract(this._scene.activeCamera.position).length();
            }

            var sortedArray = this._transparentSubMeshes.data.slice(0, this._transparentSubMeshes.length);

            sortedArray.sort(function (a, b) {
                if (a._distanceToCamera < b._distanceToCamera) {
                    return 1;
                }
                if (a._distanceToCamera > b._distanceToCamera) {
                    return -1;
                }

                return 0;
            });

            // Rendering
            engine.setAlphaMode(BABYLON.Engine.ALPHA_COMBINE);
            for (subIndex = 0; subIndex < sortedArray.length; subIndex++) {
                submesh = sortedArray[subIndex];
                this._activeVertices += submesh.verticesCount;

                submesh.render();
            }
            engine.setAlphaMode(BABYLON.Engine.ALPHA_DISABLE);
        }
        return true;
    };


    BABYLON.RenderingGroup.prototype.prepare = function () {
        this._opaqueSubMeshes.reset();
        this._transparentSubMeshes.reset();
        this._alphaTestSubMeshes.reset();
    };

    BABYLON.RenderingGroup.prototype.dispatch = function (subMesh) {
        var material = subMesh.getMaterial();
        var mesh = subMesh.getMesh();

        if (material.needAlphaBlending() || mesh.visibility < 1.0) { // Transparent
            if (material.alpha > 0 || mesh.visibility < 1.0) {
                this._transparentSubMeshes.push(subMesh);
            }
        } else if (material.needAlphaTesting()) { // Alpha test
            this._alphaTestSubMeshes.push(subMesh);
        } else {
            this._opaqueSubMeshes.push(subMesh); // Opaque
        }
    };
})();