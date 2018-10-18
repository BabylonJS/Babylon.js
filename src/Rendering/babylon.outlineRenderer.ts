module BABYLON {
    export interface Scene {
        /** @hidden */
        _outlineRenderer: OutlineRenderer;

        /**
         * Gets the outline renderer associated with the scene
         * @returns a OutlineRenderer
         */
        getOutlineRenderer(): OutlineRenderer;
    }

    /**
     * Gets the outline renderer associated with the scene
     * @returns a OutlineRenderer
     */
    Scene.prototype.getOutlineRenderer = function(): OutlineRenderer {
        if (!this._outlineRenderer) {
            this._outlineRenderer = new OutlineRenderer(this);
        }
        return this._outlineRenderer;
    };

    export interface AbstractMesh {
        /** @hidden (Backing field) */
        _renderOutline: boolean;
        /**
         * Gets or sets a boolean indicating if the outline must be rendered as well
         * @see https://www.babylonjs-playground.com/#10WJ5S#3
         */
        renderOutline: boolean;

        /** @hidden (Backing field) */
        _renderOverlay: boolean;
        /**
         * Gets or sets a boolean indicating if the overlay must be rendered as well
         * @see https://www.babylonjs-playground.com/#10WJ5S#2
         */
        renderOverlay: boolean;
    }

    Object.defineProperty(AbstractMesh.prototype, "renderOutline", {
        get: function(this: AbstractMesh) {
            return this._renderOutline;
        },
        set: function(this: AbstractMesh, value: boolean) {
            if (value) {
                // Lazy Load the component.
                this.getScene().getOutlineRenderer();
            }
            this._renderOutline = value;
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(AbstractMesh.prototype, "renderOverlay", {
        get: function(this: AbstractMesh) {
            return this._renderOverlay;
        },
        set: function(this: AbstractMesh, value: boolean) {
            if (value) {
                // Lazy Load the component.
                this.getScene().getOutlineRenderer();
            }
            this._renderOverlay = value;
        },
        enumerable: true,
        configurable: true
    });

    /**
     * This class is responsible to draw bothe outline/overlay of meshes.
     * It should not be used directly but through the available method on mesh.
     */
    export class OutlineRenderer implements ISceneComponent {
        /**
         * The name of the component. Each component must have a unique name.
         */
        public name = SceneComponentConstants.NAME_OUTLINERENDERER;

        /**
         * The scene the component belongs to.
         */
        public scene: Scene;

        /**
         * Defines a zOffset to prevent zFighting between the overlay and the mesh.
         */
        public zOffset = 1;

        private _engine: Engine;
        private _effect: Effect;
        private _cachedDefines: string;
        private _savedDepthWrite: boolean;

        /**
         * Instantiates a new outline renderer. (There could be only one per scene).
         * @param scene Defines the scene it belongs to
         */
        constructor(scene: Scene) {
            this.scene = scene;
            this._engine = scene.getEngine();
            this.scene._addComponent(this);
        }

        /**
         * Register the component to one instance of a scene.
         */
        public register(): void {
            this.scene._beforeRenderingMeshStage.registerStep(SceneComponentConstants.STEP_BEFORERENDERINGMESH_OUTLINE, this, this._beforeRenderingMesh);
            this.scene._afterRenderingMeshStage.registerStep(SceneComponentConstants.STEP_AFTERRENDERINGMESH_OUTLINE, this, this._afterRenderingMesh);
        }

        /**
         * Rebuilds the elements related to this component in case of
         * context lost for instance.
         */
        public rebuild(): void {
            // Nothing to do here.
        }

        /**
         * Disposes the component and the associated ressources.
         */
        public dispose(): void {
            // Nothing to do here.
        }

        /**
         * Renders the outline in the canvas.
         * @param subMesh Defines the sumesh to render
         * @param batch Defines the batch of meshes in case of instances
         * @param useOverlay Defines if the rendering is for the overlay or the outline
         */
        public render(subMesh: SubMesh, batch: _InstancesBatch, useOverlay: boolean = false): void {
            var scene = this.scene;
            var engine = scene.getEngine();

            var hardwareInstancedRendering = (engine.getCaps().instancedArrays) && (batch.visibleInstances[subMesh._id] !== null) && (batch.visibleInstances[subMesh._id] !== undefined);

            if (!this.isReady(subMesh, hardwareInstancedRendering)) {
                return;
            }

            var mesh = subMesh.getRenderingMesh();
            var material = subMesh.getMaterial();

            if (!material || !scene.activeCamera) {
                return;
            }

            engine.enableEffect(this._effect);

            // Logarithmic depth
            if ((<any> material).useLogarithmicDepth)
            {
                this._effect.setFloat("logarithmicDepthConstant", 2.0 / (Math.log(scene.activeCamera.maxZ + 1.0) / Math.LN2));
            }

            this._effect.setFloat("offset", useOverlay ? 0 : mesh.outlineWidth);
            this._effect.setColor4("color", useOverlay ? mesh.overlayColor : mesh.outlineColor, useOverlay ? mesh.overlayAlpha : material.alpha);
            this._effect.setMatrix("viewProjection", scene.getTransformMatrix());

            // Bones
            if (mesh.useBones && mesh.computeBonesUsingShaders && mesh.skeleton) {
                this._effect.setMatrices("mBones", mesh.skeleton.getTransformMatrices(mesh));
            }

            mesh._bind(subMesh, this._effect, Material.TriangleFillMode);

            // Alpha test
            if (material && material.needAlphaTesting()) {
                var alphaTexture = material.getAlphaTestTexture();
                if (alphaTexture) {
                    this._effect.setTexture("diffuseSampler", alphaTexture);
                    this._effect.setMatrix("diffuseMatrix", alphaTexture.getTextureMatrix());
                }
            }

            engine.setZOffset(-this.zOffset);

            mesh._processRendering(subMesh, this._effect, Material.TriangleFillMode, batch, hardwareInstancedRendering,
                (isInstance, world) => { this._effect.setMatrix("world", world); });

            engine.setZOffset(0);
        }

        /**
         * Returns whether or not the outline renderer is ready for a given submesh.
         * All the dependencies e.g. submeshes, texture, effect... mus be ready
         * @param subMesh Defines the submesh to check readyness for
         * @param useInstances Defines wheter wee are trying to render instances or not
         * @returns true if ready otherwise false
         */
        public isReady(subMesh: SubMesh, useInstances: boolean): boolean {
            var defines = [];
            var attribs = [VertexBuffer.PositionKind, VertexBuffer.NormalKind];

            var mesh = subMesh.getMesh();
            var material = subMesh.getMaterial();

            if (material) {
                // Alpha test
                if (material.needAlphaTesting())
                {
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
                //Logarithmic depth
                if ((<any> material).useLogarithmicDepth)
                {
                    defines.push("#define LOGARITHMICDEPTH");
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
                defines.push("#define BonesPerMesh " + (mesh.skeleton ? mesh.skeleton.bones.length + 1 : 0));
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
                this._effect = this.scene.getEngine().createEffect("outline",
                    attribs,
                    ["world", "mBones", "viewProjection", "diffuseMatrix", "offset", "color", "logarithmicDepthConstant"],
                    ["diffuseSampler"], join);
            }

            return this._effect.isReady();
        }

        private _beforeRenderingMesh(mesh: AbstractMesh, subMesh: SubMesh, batch: _InstancesBatch): void {
            // Outline - step 1
            this._savedDepthWrite = this._engine.getDepthWrite();
            if (mesh.renderOutline) {
                this._engine.setDepthWrite(false);
                this.render(subMesh, batch);
                this._engine.setDepthWrite(this._savedDepthWrite);
            }
        }

        private _afterRenderingMesh(mesh: AbstractMesh, subMesh: SubMesh, batch: _InstancesBatch): void {
            // Outline - step 2
            if (mesh.renderOutline && this._savedDepthWrite) {
                this._engine.setDepthWrite(true);
                this._engine.setColorWrite(false);
                this.render(subMesh, batch);
                this._engine.setColorWrite(true);
            }

            // Overlay
            if (mesh.renderOverlay) {
                var currentMode = this._engine.getAlphaMode();
                this._engine.setAlphaMode(Engine.ALPHA_COMBINE);
                this.render(subMesh, batch, true);
                this._engine.setAlphaMode(currentMode);
            }
        }
    }
}