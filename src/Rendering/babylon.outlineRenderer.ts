module BABYLON {
    export class OutlineRenderer {
        private _scene: Scene;
        private _effect: Effect;
        private _cachedDefines: string;

        constructor(scene: Scene) {
            this._scene = scene;
        }

        public render(subMesh: SubMesh, batch: _InstancesBatch, useOverlay: boolean = false) {
            var scene = this._scene;
            var engine = this._scene.getEngine();

            var hardwareInstancedRendering = (engine.getCaps().instancedArrays !== null) && (batch.visibleInstances[subMesh._id] !== null) && (batch.visibleInstances[subMesh._id] !== undefined);

            if (!this.isReady(subMesh, hardwareInstancedRendering)) {
                return;
            }

            var mesh = subMesh.getRenderingMesh();
            var material = subMesh.getMaterial();

            engine.enableEffect(this._effect);
            this._effect.setFloat("offset", useOverlay ? 0 : mesh.outlineWidth);
            this._effect.setColor4("color", useOverlay ? mesh.overlayColor : mesh.outlineColor, useOverlay ? mesh.overlayAlpha : 1.0);
            this._effect.setMatrix("viewProjection", scene.getTransformMatrix());

            // Bones
            if (mesh.useBones && mesh.computeBonesUsingShaders) {
                this._effect.setMatrices("mBones", mesh.skeleton.getTransformMatrices(mesh));
            }

            mesh._bind(subMesh, this._effect, Material.TriangleFillMode);

            // Alpha test
            if (material && material.needAlphaTesting()) {
                var alphaTexture = material.getAlphaTestTexture();
                this._effect.setTexture("diffuseSampler", alphaTexture);
                this._effect.setMatrix("diffuseMatrix", alphaTexture.getTextureMatrix());
            }

            mesh._processRendering(subMesh, this._effect, Material.TriangleFillMode, batch, hardwareInstancedRendering,
                (isInstance, world) => { this._effect.setMatrix("world", world)});
        }

        public isReady(subMesh: SubMesh, useInstances: boolean): boolean {
            var defines = [];
            var attribs = [VertexBuffer.PositionKind, VertexBuffer.NormalKind];

            var mesh = subMesh.getMesh();
            var material = subMesh.getMaterial();

            // Alpha test
            if (material && material.needAlphaTesting()) {
                defines.push("#define ALPHATEST");
                if (mesh.isVerticesDataPresent(VertexBuffer.UVKind)) {
                    attribs.push(VertexBuffer.UVKind);
                    defines.push("#define UV1");
                }
                if (mesh.isVerticesDataPresent(VertexBuffer.UV2Kind)) {
                    attribs.push(VertexBuffer.UV2Kind);
                    defines.push("#define UV2");
                }
            }

            // Bones
            if (mesh.useBones && mesh.computeBonesUsingShaders) {
                attribs.push(VertexBuffer.MatricesIndicesKind);
                attribs.push(VertexBuffer.MatricesWeightsKind);
                if (mesh.numBoneInfluencers > 4) {
                    attribs.push(VertexBuffer.MatricesIndicesExtraKind);
                    attribs.push(VertexBuffer.MatricesWeightsExtraKind);
                }
                defines.push("#define NUM_BONE_INFLUENCERS " + mesh.numBoneInfluencers);
                defines.push("#define BonesPerMesh " + (mesh.skeleton.bones.length + 1));
            } else {
                defines.push("#define NUM_BONE_INFLUENCERS 0");
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
            if (this._cachedDefines !== join) {
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