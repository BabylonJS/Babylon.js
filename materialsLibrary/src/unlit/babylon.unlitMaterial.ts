/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON {
    class UnlitMaterialDefines extends MaterialDefines {
        public DIFFUSE = false;
        public CLIPPLANE = false;
        public ALPHATEST = false;
        public ALPHATESTVALUE = 0.5;
        public ALPHABLEND = false;
        public PREMULTIPLYALPHA = false;
        public DEPTHPREPASS = false;
        public POINTSIZE = false;
        public FOG = false;
        public UV1 = false;
        public UV2 = false;
        public VERTEXCOLOR = false;
        public VERTEXALPHA = false;
        public NUM_BONE_INFLUENCERS = 0;
        public BonesPerMesh = 0;
        public INSTANCES = false;

        constructor() {
            super();
            this.rebuild();
        }
    }

    export class UnlitMaterial extends PushMaterial {
        /**
         * The diffuse texture.
         */
        @serializeAsTexture()
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public diffuseTexture: BaseTexture;

        /**
         * The diffuse color.
         */
        @serializeAsColor3("diffuse")
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public diffuseColor = new Color3(1, 1, 1);

        /**
         * Defines the alpha limits in alpha test mode.
         */
        @serialize()
        @expandToProperty("_markAllSubMeshesAsTexturesAndMiscDirty")
        public alphaCutOff = 0.4;

        /**
         * The transparency mode (OPAQUE, ALPHATEST, ALPHABLEND).
         */
        @serialize()
        @expandToProperty("_markAllSubMeshesAsTexturesAndMiscDirty")
        public transparencyMode = Material.TRANSPARENCYMODE_OPAQUE;

        private _renderId: number;

        constructor(name: string, scene: Scene) {
            super(name, scene);
        }

        /**
         * Specifies whether this material should be rendered in alpha blend mode.
         */
        public needAlphaBlending(): boolean {
            return (this.transparencyMode === Material.TRANSPARENCYMODE_ALPHABLEND || this.transparencyMode === Material.TRANSPARENCYMODE_ALPHATESTANDBLEND);
        }

        /**
         * Specifies whether this material should be rendered in alpha test mode.
         */
        public needAlphaTesting(): boolean {
            return (this.transparencyMode === Material.TRANSPARENCYMODE_ALPHATEST || this.transparencyMode === Material.TRANSPARENCYMODE_ALPHATESTANDBLEND);
        }

        /**
         * Specifies that the submesh is ready to be used.
         * @param mesh The mesh to test.
         * @param subMesh A submesh to test. 
         * @param useInstances Specifies that instances should be used.
         * @returns True if the submesh is ready or false otherwise.
         */
        public isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean {
            if (this.isFrozen) {
                if (this._wasPreviouslyReady && subMesh.effect) {
                    return true;
                }
            }

            if (!subMesh._materialDefines) {
                subMesh._materialDefines = new UnlitMaterialDefines();
            }

            const defines = <UnlitMaterialDefines>subMesh._materialDefines;
            if (!this.checkReadyOnEveryCall && subMesh.effect) {
                if (this._renderId === this.getScene().getRenderId()) {
                    return true;
                }
            }

            const scene = this.getScene();

            if (defines._areTexturesDirty) {
                defines._needUVs = false;
                if (scene.texturesEnabled) {
                    if (this.diffuseTexture && StandardMaterial.DiffuseTextureEnabled) {
                        if (!this.diffuseTexture.isReadyOrNotBlocking()) {
                            return false;
                        }
                    }
                }
            }

            const effect = this._prepareEffect(mesh, defines, this.onCompiled, this.onError, useInstances);
            if (effect) {
                scene.resetCachedMaterial();
                subMesh.setEffect(effect, defines);
            }

            if (!subMesh.effect || !subMesh.effect.isReady()) {
                return false;
            }

            this._renderId = scene.getRenderId();
            this._wasPreviouslyReady = true;

            return true;
        }

        private _prepareEffect(mesh: AbstractMesh, defines: UnlitMaterialDefines, onCompiled: Nullable<(effect: Effect) => void> = null, onError: Nullable<(effect: Effect, errors: string) => void> = null, useInstances: Nullable<boolean> = null, useClipPlane: Nullable<boolean> = null): Nullable<Effect> {
            this._prepareDefines(mesh, defines, useInstances, useClipPlane);
            if (!defines.isDirty) {
                return null;
            }

            defines.markAsProcessed();

            const scene = this.getScene();
            const engine = scene.getEngine();

            // Fallbacks
            var fallbacks = new EffectFallbacks();
            if (defines.FOG) {
                fallbacks.addFallback(1, "FOG");
            }

            if (defines.NUM_BONE_INFLUENCERS > 0) {
                fallbacks.addCPUSkinningFallback(0, mesh);
            }

            // Attributes
            var attribs = [VertexBuffer.PositionKind];

            if (defines.UV1) {
                attribs.push(VertexBuffer.UVKind);
            }

            if (defines.UV2) {
                attribs.push(VertexBuffer.UV2Kind);
            }

            if (defines.VERTEXCOLOR) {
                attribs.push(VertexBuffer.ColorKind);
            }

            MaterialHelper.PrepareAttributesForBones(attribs, mesh, defines, fallbacks);
            MaterialHelper.PrepareAttributesForInstances(attribs, defines);

            var uniforms = ["world", "view", "viewProjection", "vEyePosition", "vDiffuseColor",
                "vFogInfos", "vFogColor", "pointSize",
                "vDiffuseInfos",
                "mBones",
                "vClipPlane", "diffuseMatrix"
            ];
            var samplers = ["diffuseSampler"];
            var uniformBuffers = new Array<string>()

            MaterialHelper.PrepareUniformsAndSamplersList(<EffectCreationOptions>{
                uniformsNames: uniforms,
                uniformBuffersNames: uniformBuffers,
                samplers: samplers,
                defines: defines,
                maxSimultaneousLights: 0
            });

            var join = defines.toString();
            return engine.createEffect("unlit", <EffectCreationOptions>{
                attributes: attribs,
                uniformsNames: uniforms,
                uniformBuffersNames: uniformBuffers,
                samplers: samplers,
                defines: join,
                fallbacks: fallbacks,
                onCompiled: this.onCompiled,
                onError: this.onError
            }, engine);
        }

        private _prepareDefines(mesh: AbstractMesh, defines: UnlitMaterialDefines, useInstances: Nullable<boolean> = null, useClipPlane: Nullable<boolean> = null): void {
            const scene = this.getScene();
            const engine = scene.getEngine();

            // Textures
            if (defines._areTexturesDirty) {
                defines._needUVs = false;
                if (scene.texturesEnabled) {
                    if (this.diffuseTexture && StandardMaterial.DiffuseTextureEnabled) {
                        defines._needUVs = true;
                        defines.DIFFUSE = true;
                    }
                }
            }

            // Alpha
            defines.ALPHATESTVALUE = this.alphaCutOff;
            defines.PREMULTIPLYALPHA = (this.alphaMode === Engine.ALPHA_PREMULTIPLIED || this.alphaMode === Engine.ALPHA_PREMULTIPLIED_PORTERDUFF);
            defines.ALPHABLEND = this.needAlphaBlendingForMesh(mesh);

            // Misc
            MaterialHelper.PrepareDefinesForMisc(mesh, scene, false, this.pointsCloud, this.fogEnabled, this._shouldTurnAlphaTestOn(mesh), defines);

            // Values that need to be evaluated on every frame
            MaterialHelper.PrepareDefinesForFrameBoundValues(scene, engine, defines, useInstances ? true : false, useClipPlane);

            // Attribs
            MaterialHelper.PrepareDefinesForAttributes(mesh, defines, true, true);
        }

        /**
         * Force shader compilation
         */
        public forceCompilation(mesh: AbstractMesh, onCompiled?: (material: Material) => void, options?: Partial<{ clipPlane: boolean }>): void {
            let localOptions = {
                clipPlane: false,
                ...options
            };

            const defines = new UnlitMaterialDefines();
            const effect = this._prepareEffect(mesh, defines, undefined, undefined, undefined, localOptions.clipPlane)!;
            if (effect.isReady()) {
                if (onCompiled) {
                    onCompiled(this);
                }
            }
            else {
                effect.onCompileObservable.add(() => {
                    if (onCompiled) {
                        onCompiled(this);
                    }
                });
            }
        }

        /**
         * Binds the submesh data.
         * @param world - The world matrix.
         * @param mesh - The BJS mesh.
         * @param subMesh - A submesh of the BJS mesh.
         */
        public bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void {
            var scene = this.getScene();

            var defines = <UnlitMaterialDefines>subMesh._materialDefines;
            if (!defines) {
                return;
            }

            var effect = subMesh.effect;
            if (!effect) {
                return;
            }
            this._activeEffect = effect;

            // Matrices
            this.bindOnlyWorldMatrix(world);
            this._activeEffect.setMatrix("viewProjection", scene.getTransformMatrix());

            // Bones
            MaterialHelper.BindBonesParameters(mesh, this._activeEffect);

            if (this._mustRebind(scene, effect)) {
                // Textures
                if (this.diffuseTexture && StandardMaterial.DiffuseTextureEnabled) {
                    this._activeEffect.setTexture("diffuseSampler", this.diffuseTexture);

                    this._activeEffect.setFloat2("vDiffuseInfos", this.diffuseTexture.coordinatesIndex, this.diffuseTexture.level);
                    this._activeEffect.setMatrix("diffuseMatrix", this.diffuseTexture.getTextureMatrix());
                }

                // Clip plane
                MaterialHelper.BindClipPlane(this._activeEffect, scene);

                // Point size
                if (this.pointsCloud) {
                    this._activeEffect.setFloat("pointSize", this.pointSize);
                }

                MaterialHelper.BindEyePosition(effect, scene);
            }

            this._activeEffect.setColor4("vDiffuseColor", this.diffuseColor, this.alpha * mesh.visibility);

            // View
            if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== Scene.FOGMODE_NONE) {
                this._activeEffect.setMatrix("view", scene.getViewMatrix());
            }

            // Fog
            MaterialHelper.BindFogParameters(scene, mesh, this._activeEffect);

            this._afterBind(mesh, this._activeEffect);
        }

        /**
         * Returns the animatable textures.
         * @returns - Array of animatable textures.
         */
        public getAnimatables(): IAnimatable[] {
            var results = [];

            if (this.diffuseTexture && this.diffuseTexture.animations && this.diffuseTexture.animations.length > 0) {
                results.push(this.diffuseTexture);
            }

            return results;
        }

        /**
         * Gets the active textures from the material.
         * @returns - Array of textures.
         */
        public getActiveTextures(): BaseTexture[] {
            var activeTextures = super.getActiveTextures();

            if (this.diffuseTexture) {
                activeTextures.push(this.diffuseTexture);
            }

            return activeTextures;
        }

        /**
         * Specifies if the material uses a texture.
         * @param texture - Texture to check against the material.
         * @returns - Boolean specifying if the material uses the texture.
         */
        public hasTexture(texture: BaseTexture): boolean {
            if (super.hasTexture(texture)) {
                return true;
            }

            if (this.diffuseTexture === texture) {
                return true;
            }

            return false;
        }

        /**
         * Disposes the material.
         * @param forceDisposeEffect - Specifies if effects should be force disposed.
         */
        public dispose(forceDisposeEffect?: boolean): void {
            if (this.diffuseTexture) {
                this.diffuseTexture.dispose();
            }

            super.dispose(forceDisposeEffect);
        }

        /**
         * Makes a duplicate of the material, and gives it a new name.
         * @param name - Name to call the duplicated material.
         * @returns - Cloned material
         */
        public clone(name: string): UnlitMaterial {
            return SerializationHelper.Clone<UnlitMaterial>(() => new UnlitMaterial(name, this.getScene()), this);
        }

        /**
         * Serializes this material.
         * @returns - serialized material object.
         */
        public serialize(): any {
            var serializationObject = SerializationHelper.Serialize(this);
            serializationObject.customType = "BABYLON.UnlitMaterial";
            return serializationObject;
        }

         /**
          * Gets the class name of the material.
          * @returns - String with the class name of the material.
          */
         public getClassName(): string {
            return "UnlitMaterial";
        }

        /**
         * Creates a material from parsed material data.
         * @param parsedMaterial - Parsed material data.
         * @param scene - BJS scene.
         * @param rootUrl - Root URL containing the material information.
         * @returns - Parsed material.
         */
        public static Parse(source: any, scene: Scene, rootUrl: string): UnlitMaterial {
            return SerializationHelper.Parse(() => new UnlitMaterial(source.name, scene), source, scene, rootUrl);
        }
    }
}
