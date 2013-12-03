"use strict";

var BABYLON = BABYLON || {};

(function () {
    BABYLON.ShadowGenerator = function (mapSize, light) {
        this._light = light;
        this._scene = light.getScene();

        light._shadowGenerator = this;

        // Render target
        this._shadowMap = new BABYLON.RenderTargetTexture(light.name + "_shadowMap", mapSize, this._scene, false);
        this._shadowMap.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
        this._shadowMap.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
        this._shadowMap.renderParticles = false;
                
        // Custom render function
        var that = this;

        var renderSubMesh = function (subMesh) {
            var mesh = subMesh.getMesh();
            var world = mesh.getWorldMatrix();
            var engine = that._scene.getEngine();

            if (that.isReady(mesh)) {
                engine.enableEffect(that._effect);
                
                // Bones
                if (mesh.skeleton && mesh.isVerticesDataPresent(BABYLON.VertexBuffer.MatricesIndicesKind) && mesh.isVerticesDataPresent(BABYLON.VertexBuffer.MatricesWeightsKind)) {
                    that._effect.setMatrix("world", world);
                    that._effect.setMatrix("viewProjection", that.getTransformMatrix());

                    that._effect.setMatrices("mBones", mesh.skeleton.getTransformMatrices());
                } else {
                    world.multiplyToRef(that.getTransformMatrix(), that._worldViewProjection);
                    that._effect.setMatrix("worldViewProjection", that._worldViewProjection);
                }

                // Bind and draw
                mesh.bindAndDraw(subMesh, that._effect, false);
            }
        };

        this._shadowMap.customRenderFunction = function (opaqueSubMeshes, alphaTestSubMeshes) {
            var index;
            
            for (index = 0; index < opaqueSubMeshes.length; index++) {
                renderSubMesh(opaqueSubMeshes.data[index]);
            }
            
            for (index = 0; index < alphaTestSubMeshes.length; index++) {
                renderSubMesh(alphaTestSubMeshes.data[index]);
            }
        };
        
        // Internals
        this._viewMatrix = BABYLON.Matrix.Zero();
        this._projectionMatrix = BABYLON.Matrix.Zero();
        this._transformMatrix = BABYLON.Matrix.Zero();
        this._worldViewProjection = BABYLON.Matrix.Zero();
    };
    
    // Members
    BABYLON.ShadowGenerator.prototype.useVarianceShadowMap = true;
    
    // Properties
    BABYLON.ShadowGenerator.prototype.isReady = function (mesh) {
        var defines = [];
        
        if (this.useVarianceShadowMap) {
            defines.push("#define VSM");
        }
        
        var attribs = [BABYLON.VertexBuffer.PositionKind];
        if (mesh.skeleton && mesh.isVerticesDataPresent(BABYLON.VertexBuffer.MatricesIndicesKind) && mesh.isVerticesDataPresent(BABYLON.VertexBuffer.MatricesWeightsKind)) {
            attribs.push(BABYLON.VertexBuffer.MatricesIndicesKind);
            attribs.push(BABYLON.VertexBuffer.MatricesWeightsKind);
            defines.push("#define BONES");
            defines.push("#define BonesPerMesh " + mesh.skeleton.bones.length);
        }

        // Get correct effect      
        var join = defines.join("\n");
        if (this._cachedDefines != join) {
            this._cachedDefines = join;
            this._effect = this._scene.getEngine().createEffect("shadowMap",
                attribs,
                ["world", "mBones", "viewProjection", "worldViewProjection"],
                [], join);
        }

        return this._effect.isReady();
    };
    
    BABYLON.ShadowGenerator.prototype.getShadowMap = function () {
        return this._shadowMap;
    };
    
    BABYLON.ShadowGenerator.prototype.getLight = function () {
        return this._light;
    };
    
    // Methods
    BABYLON.ShadowGenerator.prototype.getTransformMatrix = function () {
        var lightPosition = this._light.position;
        var lightDirection = this._light.direction;
        
        if (this._light._computeTransformedPosition()) {
            lightPosition = this._light._transformedPosition;
        }

        if (!this._cachedPosition || !this._cachedDirection || !lightPosition.equals(this._cachedPosition) || !lightDirection.equals(this._cachedDirection)) {

            this._cachedPosition = lightPosition.clone();
            this._cachedDirection = lightDirection.clone();

            var activeCamera = this._scene.activeCamera;

            BABYLON.Matrix.LookAtLHToRef(lightPosition, this._light.position.add(lightDirection), BABYLON.Vector3.Up(), this._viewMatrix);
            BABYLON.Matrix.PerspectiveFovLHToRef(Math.PI / 2.0, 1.0, activeCamera.minZ, activeCamera.maxZ, this._projectionMatrix);

            this._viewMatrix.multiplyToRef(this._projectionMatrix, this._transformMatrix);
        }

        return this._transformMatrix;
    };

    BABYLON.ShadowGenerator.prototype.dispose = function() {
        this._shadowMap.dispose();
    };
})();