module BABYLON {
    export class OutlineRenderer {
        private _scene: Scene;
        private _effect: Effect;
        private _cachedDefines: string;

        constructor(scene: Scene) {
            this._scene = scene;
        }

        public render(subMesh: SubMesh, batch: _InstancesBatch) {
            var scene = this._scene;
            var engine = this._scene.getEngine();

            var hardwareInstancedRendering = (engine.getCaps().instancedArrays !== null) && (batch.visibleInstances !== null);

            if (!this.isReady(subMesh, hardwareInstancedRendering)) {
                return;
            }

            var mesh = subMesh.getRenderingMesh();
            var material = subMesh.getMaterial();

            engine.enableEffect(this._effect);
            this._effect.setFloat("offset", mesh.outlineWidth);
            this._effect.setColor3("color", mesh.outlineColor);
            this._effect.setMatrix("viewProjection", scene.getTransformMatrix());

            // Bones
            var useBones = mesh.skeleton && mesh.isVerticesDataPresent(BABYLON.VertexBuffer.MatricesIndicesKind) && mesh.isVerticesDataPresent(BABYLON.VertexBuffer.MatricesWeightsKind);
            if (useBones) {
                this._effect.setMatrices("mBones", mesh.skeleton.getTransformMatrices());
            }

            mesh._bind(subMesh, this._effect, Material.TriangleFillMode);

            // Alpha test
            if (material && material.needAlphaTesting()) {
                var alphaTexture = material.getAlphaTestTexture();
                this._effect.setTexture("diffuseSampler", alphaTexture);
                this._effect.setMatrix("diffuseMatrix", alphaTexture.getTextureMatrix());
            }


            if (hardwareInstancedRendering) {
                mesh._renderWithInstances(subMesh, Material.TriangleFillMode, batch, this._effect, engine);
            } else {
                if (batch.renderSelf[subMesh._id]) {
                    this._effect.setMatrix("world", mesh.getWorldMatrix());

                    // Draw
                    mesh._draw(subMesh, Material.TriangleFillMode);
                }

                if (batch.visibleInstances[subMesh._id]) {
                    for (var instanceIndex = 0; instanceIndex < batch.visibleInstances[subMesh._id].length; instanceIndex++) {
                        var instance = batch.visibleInstances[subMesh._id][instanceIndex];

                        this._effect.setMatrix("world", instance.getWorldMatrix());

                        // Draw
                        mesh._draw(subMesh, Material.TriangleFillMode);
                    }
                }
            }
        }

        public isReady(subMesh: SubMesh, useInstances: boolean): boolean {
            var defines = [];
            var attribs = [VertexBuffer.PositionKind, VertexBuffer.NormalKind];

            var mesh = subMesh.getMesh();
            var material = subMesh.getMaterial();

            // Alpha test
            if (material && material.needAlphaTesting()) {
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
                this._effect = this._scene.getEngine().createEffect("outline",
                    attribs,
                    ["world", "mBones", "viewProjection", "diffuseMatrix", "offset", "color"],
                    ["diffuseSampler"], join);
            }

            return this._effect.isReady();
        }
    }
} 