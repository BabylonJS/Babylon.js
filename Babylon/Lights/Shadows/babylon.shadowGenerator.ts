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
                var world = mesh.getWorldMatrix();
                var engine = this._scene.getEngine();

                if (this.isReady(mesh)) {
                    engine.enableEffect(this._effect);

                    // Bones
                    if (mesh.skeleton && mesh.isVerticesDataPresent(BABYLON.VertexBuffer.MatricesIndicesKind) && mesh.isVerticesDataPresent(BABYLON.VertexBuffer.MatricesWeightsKind)) {
                        this._effect.setMatrix("world", world);
                        this._effect.setMatrix("viewProjection", this.getTransformMatrix());

                        this._effect.setMatrices("mBones", mesh.skeleton.getTransformMatrices());
                    } else {
                        world.multiplyToRef(this.getTransformMatrix(), this._worldViewProjection);
                        this._effect.setMatrix("worldViewProjection", this._worldViewProjection);
                    }

                    // Bind and draw
                    mesh.bindAndDraw(subMesh, this._effect, false);
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

        public isReady(mesh: Mesh): boolean {
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
        }

        public getShadowMap(): RenderTargetTexture {
            return this._shadowMap;
        }

        public getLight() : DirectionalLight{
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