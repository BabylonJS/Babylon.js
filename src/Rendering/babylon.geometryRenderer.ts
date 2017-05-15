module BABYLON {
    export class GeometryRenderer {
        private _scene: Scene;
        private _multiRenderTarget: MultiRenderTarget;
        private _effect: Effect;

        private _viewMatrix = Matrix.Zero();
        private _projectionMatrix = Matrix.Zero();
        private _transformMatrix = Matrix.Zero();
        private _worldViewProjection = Matrix.Zero();

        private _cachedDefines: string;

        constructor(scene: Scene, type: number = Engine.TEXTURETYPE_FLOAT) {
            this._scene = scene;
            var engine = scene.getEngine();

            // Render target
            this._multiRenderTarget = new MultiRenderTarget("gBuffer", { width: engine.getRenderWidth(), height: engine.getRenderHeight() }, 2, this._scene, { generateMipMaps : [true], generateDepthTexture: true });
            // set default depth value to 1.0 (far away)
            this._multiRenderTarget.onClearObservable.add((engine: Engine) => {
                engine.clear(new Color4(1.0, 1.0, 1.0, 1.0), true, true, true);
            });

            // Custom render function
            var renderSubMesh = (subMesh: SubMesh): void => {
                var mesh = subMesh.getRenderingMesh();
                var scene = this._scene;
                var engine = scene.getEngine();

                // Culling
                engine.setState(subMesh.getMaterial().backFaceCulling);

                // Managing instances
                var batch = mesh._getInstancesRenderList(subMesh._id);

                if (batch.mustReturn) {
                    return;
                }

                var hardwareInstancedRendering = (engine.getCaps().instancedArrays !== null) && (batch.visibleInstances[subMesh._id] !== null);

                if (this.isReady(subMesh, hardwareInstancedRendering)) {
                    engine.enableEffect(this._effect);
                    mesh._bind(subMesh, this._effect, Material.TriangleFillMode);
                    var material = subMesh.getMaterial();

                    this._effect.setMatrix("viewProjection", scene.getTransformMatrix());
                    this._effect.setMatrix("view", scene.getViewMatrix());

                    this._effect.setFloat("far", scene.activeCamera.maxZ);

                    // Draw
                    mesh._processRendering(subMesh, this._effect, Material.TriangleFillMode, batch, hardwareInstancedRendering,
                        (isInstance, world) => this._effect.setMatrix("world", world));
                }
            };

            this._multiRenderTarget.customRenderFunction = (opaqueSubMeshes: SmartArray<SubMesh>, alphaTestSubMeshes: SmartArray<SubMesh>): void => {
                var index;

                for (index = 0; index < opaqueSubMeshes.length; index++) {
                    renderSubMesh(opaqueSubMeshes.data[index]);
                }

                for (index = 0; index < alphaTestSubMeshes.length; index++) {
                    // Cannot render alpha meshes this way
                    // renderSubMesh(alphaTestSubMeshes.data[index]);
                }
            };
        }

        public isReady(subMesh: SubMesh, useInstances: boolean): boolean {
            var material: any = subMesh.getMaterial();

            if (material && (material.disableDepthWrite || material.needAlphaTesting())) {
                return false;
            }

            var defines = [];

            var attribs = [VertexBuffer.PositionKind, VertexBuffer.NormalKind];

            var mesh = subMesh.getMesh();
            var scene = mesh.getScene();

            // if (mesh.isVerticesDataPresent(VertexBuffer.UVKind)) {
            //     attribs.push(VertexBuffer.UVKind);
            //     defines.push("#define UV1");
            // }

            // Get correct effect      
            var join = defines.join("\n");
            if (this._cachedDefines !== join) {
                this._cachedDefines = join;
                this._effect = this._scene.getEngine().createEffect("geometry",
                    attribs,
                    ["world", "viewProjection", "view", "far"],
                    [], join);
            }

            return this._effect.isReady();
        }

        public getGBuffer(): MultiRenderTarget {
            return this._multiRenderTarget;
        }

        // Methods
        public dispose(): void {
            this.getGBuffer().dispose();
        }
    }
} 