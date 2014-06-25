module BABYLON {
    export class ShadowGenerator {
        // Members
        public useVarianceShadowMap = true;

        private _light: DirectionalLight;
        private _scene: Scene;
        private _shadowMap: RenderTargetTexture;
        private _darkness = 0;
        private _transparencyShadow = false;
        private _effect: Effect;

        private _viewMatrix = BABYLON.Matrix.Zero();
        private _projectionMatrix = BABYLON.Matrix.Zero();
        private _transformMatrix = BABYLON.Matrix.Zero();
        private _worldViewProjection = BABYLON.Matrix.Zero();
        private _cachedPosition: Vector3;
        private _cachedDirection: Vector3;
        private _cachedDefines: string;

        constructor(mapSize: number, light: DirectionalLight) {
            this._light = light;
            this._scene = light.getScene();

            light._shadowGenerator = this;

            // Render target
            this._shadowMap = new BABYLON.RenderTargetTexture(light.name + "_shadowMap", mapSize, this._scene, false);
            this._shadowMap.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
            this._shadowMap.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
            this._shadowMap.renderParticles = false;

            // Custom render function
            var renderSubMesh = (subMesh: SubMesh): void => {
                var mesh = subMesh.getRenderingMesh();
                var scene = this._scene;
                var engine = scene.getEngine();

                // Culling
                engine.setState(subMesh.getMaterial().backFaceCulling);

                // Managing instances
                var batch = mesh._getInstancesRenderList();

                if (batch.mustReturn) {
                    return;
                }

                var hardwareInstancedRendering = (engine.getCaps().instancedArrays !== null) && (batch.visibleInstances !== null);

                if (this.isReady(mesh, hardwareInstancedRendering)) {
                    engine.enableEffect(this._effect);
                    mesh._bind(subMesh, this._effect, false);

                    this._effect.setMatrix("viewProjection", this.getTransformMatrix());

                    // Alpha test
                    if (mesh.material && mesh.material.needAlphaTesting()) {
                        var alphaTexture = mesh.material.getAlphaTestTexture();
                        this._effect.setTexture("diffuseSampler", alphaTexture);
                        this._effect.setMatrix("diffuseMatrix", alphaTexture.getTextureMatrix());
                    }

                    // Bones
                    var useBones = mesh.skeleton && mesh.isVerticesDataPresent(BABYLON.VertexBuffer.MatricesIndicesKind) && mesh.isVerticesDataPresent(BABYLON.VertexBuffer.MatricesWeightsKind);

                    if (useBones) {
                        this._effect.setMatrices("mBones", mesh.skeleton.getTransformMatrices());
                    }

                    if (hardwareInstancedRendering) {
                        mesh._renderWithInstances(subMesh, false, batch, this._effect, engine);
                    } else {
                        if (batch.renderSelf) {
                            this._effect.setMatrix("world", mesh.getWorldMatrix());

                            // Draw
                            mesh._draw(subMesh, true);
                        }

                        if (batch.visibleInstances) {
                            for (var instanceIndex = 0; instanceIndex < batch.visibleInstances.length; instanceIndex++) {
                                var instance = batch.visibleInstances[instanceIndex];

                                this._effect.setMatrix("world", instance.getWorldMatrix());

                                // Draw
                                mesh._draw(subMesh, true);
                            }
                        }
                    }
                } else {
                    // Need to reset refresh rate of the shadowMap
                    this._shadowMap.resetRefreshCounter();
                }
            };

            this._shadowMap.customRenderFunction = (opaqueSubMeshes: SmartArray<SubMesh>, alphaTestSubMeshes: SmartArray<SubMesh>, transparentSubMeshes: SmartArray<SubMesh>): void => {
                var index;

                for (index = 0; index < opaqueSubMeshes.length; index++) {
                    renderSubMesh(opaqueSubMeshes.data[index]);
                }

                for (index = 0; index < alphaTestSubMeshes.length; index++) {
                    renderSubMesh(alphaTestSubMeshes.data[index]);
                }

                if (this._transparencyShadow) {
                    for (index = 0; index < transparentSubMeshes.length; index++) {
                        renderSubMesh(transparentSubMeshes.data[index]);
                    }
                }
            };

        }

        public isReady(mesh: Mesh, useInstances: boolean): boolean {
            var defines = [];

            if (this.useVarianceShadowMap) {
                defines.push("#define VSM");
            }

            var attribs = [BABYLON.VertexBuffer.PositionKind];

            // Alpha test
            if (mesh.material && mesh.material.needAlphaTesting()) {
                defines.push("#define ALPHATEST");
                if (mesh.isVerticesDataPresent(BABYLON.VertexBuffer.UVKind)) {
                    attribs.push(BABYLON.VertexBuffer.UVKind);
                    defines.push("#define UV1");
                }
                if (mesh.isVerticesDataPresent(BABYLON.VertexBuffer.UV2Kind)) {
                    attribs.push(BABYLON.VertexBuffer.UV2Kind);
                    defines.push("#define UV2");
                }
            }

            // Bones
            if (mesh.skeleton && mesh.isVerticesDataPresent(BABYLON.VertexBuffer.MatricesIndicesKind) && mesh.isVerticesDataPresent(BABYLON.VertexBuffer.MatricesWeightsKind)) {
                attribs.push(BABYLON.VertexBuffer.MatricesIndicesKind);
                attribs.push(BABYLON.VertexBuffer.MatricesWeightsKind);
                defines.push("#define BONES");
                defines.push("#define BonesPerMesh " + (mesh.skeleton.bones.length + 1));
            }

            // Instances
            if (useInstances) {
                defines.push("#define INSTANCES");
                attribs.push("world0");
                attribs.push("world1");
                attribs.push("world2");
                attribs.push("world3");
            }

            // Get correct effect      
            var join = defines.join("\n");
            if (this._cachedDefines != join) {
                this._cachedDefines = join;
                this._effect = this._scene.getEngine().createEffect("shadowMap",
                    attribs,
                    ["world", "mBones", "viewProjection", "diffuseMatrix"],
                    ["diffuseSampler"], join);
            }

            return this._effect.isReady();
        }

        public getShadowMap(): RenderTargetTexture {
            return this._shadowMap;
        }

        public getLight(): DirectionalLight {
            return this._light;
        }

        // Methods
        public getTransformMatrix(): Matrix {
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
        }

        public getDarkness(): number {
            return this._darkness;
        }

        public setDarkness(darkness: number): void {
            if (darkness >= 1.0)
                this._darkness = 1.0;
            else if (darkness <= 0.0)
                this._darkness = 0.0;
            else
                this._darkness = darkness;
        }

        public setTransparencyShadow(hasShadow: boolean): void {
            this._transparencyShadow = hasShadow;
        }

        public dispose(): void {
            this._shadowMap.dispose();
        }
    }
} 