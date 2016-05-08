/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON {
    var maxSimultaneousLights = 4;

    class TriPlanarMaterialDefines extends MaterialDefines {
        public DIFFUSEX = false;
        public DIFFUSEY = false;
        public DIFFUSEZ = false;
        
        public BUMPX = false;
        public BUMPY = false;
        public BUMPZ = false;
        
        public CLIPPLANE = false;
        public ALPHATEST = false;
        public POINTSIZE = false;
        public FOG = false;
        public SPECULARTERM = false;
        public NORMAL = false;
        public VERTEXCOLOR = false;
        public VERTEXALPHA = false;
        public NUM_BONE_INFLUENCERS = 0;
        public BONES = false;
        public BONES4 = false;
        public BonesPerMesh = 0;
        public INSTANCES = false;

        constructor() {
            super();
            this._keys = Object.keys(this);
        }
    }

    export class TriPlanarMaterial extends Material {
        @serializeAsTexture()
        public mixTexture: BaseTexture;
        
        @serializeAsTexture()
        public diffuseTextureX: Texture;
        
        @serializeAsTexture()
        public diffuseTextureY: Texture;
        
        @serializeAsTexture()
        public diffuseTextureZ: Texture;
        
        @serializeAsTexture()
        public normalTextureX: Texture;
        
        @serializeAsTexture()
        public normalTextureY: Texture;
        
        @serializeAsTexture()
        public normalTextureZ: Texture;
        
        @serialize()
        public tileSize: number = 1;
        
        @serializeAsColor3()
        public diffuseColor = new Color3(1, 1, 1);
        
        @serializeAsColor3()
        public specularColor = new Color3(0.2, 0.2, 0.2);
        
        @serialize()
        public specularPower = 64;
        
        @serialize()
        public disableLighting = false;
        
        @serialize()
        public maxSimultaneousLights = 4;

        private _worldViewProjectionMatrix = Matrix.Zero();
        private _renderId: number;

        private _defines = new TriPlanarMaterialDefines();
        private _cachedDefines = new TriPlanarMaterialDefines();

        constructor(name: string, scene: Scene) {
            super(name, scene);

            this._cachedDefines.BonesPerMesh = -1;
        }

        public needAlphaBlending(): boolean {
            return (this.alpha < 1.0);
        }

        public needAlphaTesting(): boolean {
            return false;
        }

        public getAlphaTestTexture(): BaseTexture {
            return null;
        }

        // Methods   
        private _checkCache(scene: Scene, mesh?: AbstractMesh, useInstances?: boolean): boolean {
            if (!mesh) {
                return true;
            }

            if (this._defines.INSTANCES !== useInstances) {
                return false;
            }

            if (mesh._materialDefines && mesh._materialDefines.isEqual(this._defines)) {
                return true;
            }

            return false;
        }

        public isReady(mesh?: AbstractMesh, useInstances?: boolean): boolean {
            if (this.checkReadyOnlyOnce) {
                if (this._wasPreviouslyReady) {
                    return true;
                }
            }

            var scene = this.getScene();

            if (!this.checkReadyOnEveryCall) {
                if (this._renderId === scene.getRenderId()) {
                    if (this._checkCache(scene, mesh, useInstances)) {
                        return true;
                    }
                }
            }

            var engine = scene.getEngine();
            var needNormals = false;

            this._defines.reset();

            // Textures
            if (scene.texturesEnabled) {
                if (StandardMaterial.DiffuseTextureEnabled) {
                    var textures = [this.diffuseTextureX, this.diffuseTextureY, this.diffuseTextureZ];
                    var textureDefines = ["DIFFUSEX", "DIFFUSEY", "DIFFUSEZ"];
                    
                    for (var i=0; i < textures.length; i++) {
                        if (textures[i]) {
                            if (!textures[i].isReady()) {
                                return false;
                            } else {
                                this._defines[textureDefines[i]] = true;
                            }
                        }
                    }
                }
                if (StandardMaterial.BumpTextureEnabled) {
                    var textures = [this.normalTextureX, this.normalTextureY, this.normalTextureZ];
                    var textureDefines = ["BUMPX", "BUMPY", "BUMPZ"];
                    
                    for (var i=0; i < textures.length; i++) {
                        if (textures[i]) {
                            if (!textures[i].isReady()) {
                                return false;
                            } else {
                                this._defines[textureDefines[i]] = true;
                            }
                        }
                    }
                }
            }

            // Effect
            if (scene.clipPlane) {
                this._defines.CLIPPLANE = true;
            }

            if (engine.getAlphaTesting()) {
                this._defines.ALPHATEST = true;
            }

            // Point size
            if (this.pointsCloud || scene.forcePointsCloud) {
                this._defines.POINTSIZE = true;
            }

            // Fog
            if (scene.fogEnabled && mesh && mesh.applyFog && scene.fogMode !== Scene.FOGMODE_NONE && this.fogEnabled) {
                this._defines.FOG = true;
            }

            // Lights
            if (scene.lightsEnabled && !this.disableLighting) {
                needNormals = MaterialHelper.PrepareDefinesForLights(scene, mesh, this._defines, this.maxSimultaneousLights);
            }

            // Attribs
            if (mesh) {
                if (needNormals && mesh.isVerticesDataPresent(VertexBuffer.NormalKind)) {
                    this._defines.NORMAL = true;
                }
                if (mesh.useVertexColors && mesh.isVerticesDataPresent(VertexBuffer.ColorKind)) {
                    this._defines.VERTEXCOLOR = true;

                    if (mesh.hasVertexAlpha) {
                        this._defines.VERTEXALPHA = true;
                    }
                }
                
                if (mesh.useBones && mesh.computeBonesUsingShaders) {
                    this._defines.NUM_BONE_INFLUENCERS = mesh.numBoneInfluencers;
                    this._defines.BonesPerMesh = (mesh.skeleton.bones.length + 1);
                }

                // Instances
                if (useInstances) {
                    this._defines.INSTANCES = true;
                }
            }

            // Get correct effect      
            if (!this._defines.isEqual(this._cachedDefines)) {
                this._defines.cloneTo(this._cachedDefines);

                scene.resetCachedMaterial();

                // Fallbacks
                var fallbacks = new EffectFallbacks();             
                if (this._defines.FOG) {
                    fallbacks.addFallback(1, "FOG");
                }

                MaterialHelper.HandleFallbacksForShadows(this._defines, fallbacks, this.maxSimultaneousLights);
             
                if (this._defines.NUM_BONE_INFLUENCERS > 0) {
                    fallbacks.addCPUSkinningFallback(0, mesh);
                }

                //Attributes
                var attribs = [VertexBuffer.PositionKind];

                if (this._defines.NORMAL) {
                    attribs.push(VertexBuffer.NormalKind);
                }

                if (this._defines.VERTEXCOLOR) {
                    attribs.push(VertexBuffer.ColorKind);
                }

                MaterialHelper.PrepareAttributesForBones(attribs, mesh, this._defines, fallbacks);
                MaterialHelper.PrepareAttributesForInstances(attribs, this._defines);

                // Legacy browser patch
                var shaderName = "triplanar";
                var join = this._defines.toString();
                var uniforms = ["world", "view", "viewProjection", "vEyePosition", "vLightsType", "vDiffuseColor", "vSpecularColor",
                    "vFogInfos", "vFogColor", "pointSize",
                    "mBones",
                    "vClipPlane",
                    "tileSize"
                ];
                var samplers = ["diffuseSamplerX", "diffuseSamplerY", "diffuseSamplerZ",
                    "normalSamplerX", "normalSamplerY", "normalSamplerZ"
                ];
                
                MaterialHelper.PrepareUniformsAndSamplersList(uniforms, samplers, this._defines, this.maxSimultaneousLights);
                
                this._effect = scene.getEngine().createEffect(shaderName,
                    attribs, uniforms, samplers,
                    join, fallbacks, this.onCompiled, this.onError, { maxSimultaneousLights: this.maxSimultaneousLights });
            }
            if (!this._effect.isReady()) {
                return false;
            }

            this._renderId = scene.getRenderId();
            this._wasPreviouslyReady = true;

            if (mesh) {
                if (!mesh._materialDefines) {
                    mesh._materialDefines = new TriPlanarMaterialDefines();
                }

                this._defines.cloneTo(mesh._materialDefines);
            }

            return true;
        }

        public bindOnlyWorldMatrix(world: Matrix): void {
            this._effect.setMatrix("world", world);
        }

        public bind(world: Matrix, mesh?: Mesh): void {
            var scene = this.getScene();

            // Matrices        
            this.bindOnlyWorldMatrix(world);
            this._effect.setMatrix("viewProjection", scene.getTransformMatrix());

            // Bones
            MaterialHelper.BindBonesParameters(mesh, this._effect);
            
            this._effect.setFloat("tileSize", this.tileSize);

            if (scene.getCachedMaterial() !== this) {
                // Textures        
                if (this.diffuseTextureX) {
                    this._effect.setTexture("diffuseSamplerX", this.diffuseTextureX);
                }
                if (this.diffuseTextureY) {
                    this._effect.setTexture("diffuseSamplerY", this.diffuseTextureY);
                }
                if (this.diffuseTextureZ) {
                    this._effect.setTexture("diffuseSamplerZ", this.diffuseTextureZ);
                }
                if (this.normalTextureX) {
                    this._effect.setTexture("normalSamplerX", this.normalTextureX);
                }
                if (this.normalTextureY) {
                    this._effect.setTexture("normalSamplerY", this.normalTextureY);
                }
                if (this.normalTextureZ) {
                    this._effect.setTexture("normalSamplerZ", this.normalTextureZ);
                }
                // Clip plane
                MaterialHelper.BindClipPlane(this._effect, scene);

                // Point size
                if (this.pointsCloud) {
                    this._effect.setFloat("pointSize", this.pointSize);
                }

                this._effect.setVector3("vEyePosition", scene._mirroredCameraPosition ? scene._mirroredCameraPosition : scene.activeCamera.position);                
            }

            this._effect.setColor4("vDiffuseColor", this.diffuseColor, this.alpha * mesh.visibility);
            
            if (this._defines.SPECULARTERM) {
                this._effect.setColor4("vSpecularColor", this.specularColor, this.specularPower);
            }

            if (scene.lightsEnabled && !this.disableLighting) {
                MaterialHelper.BindLights(scene, mesh, this._effect, this._defines, this.maxSimultaneousLights);
            }

            // View
            if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== Scene.FOGMODE_NONE) {
                this._effect.setMatrix("view", scene.getViewMatrix());
            }

            // Fog
            MaterialHelper.BindFogParameters(scene, mesh, this._effect);

            super.bind(world, mesh);
        }

        public getAnimatables(): IAnimatable[] {
            var results = [];

            if (this.mixTexture && this.mixTexture.animations && this.mixTexture.animations.length > 0) {
                results.push(this.mixTexture);
            }

            return results;
        }

        public dispose(forceDisposeEffect?: boolean): void {
            if (this.mixTexture) {
                this.mixTexture.dispose();
            }

            super.dispose(forceDisposeEffect);
        }
        
        public clone(name: string): TriPlanarMaterial {
            return SerializationHelper.Clone(() => new TriPlanarMaterial(name, this.getScene()), this);
        }

        public serialize(): any {
            var serializationObject = SerializationHelper.Serialize(this);
            serializationObject.customType = "BABYLON.TriPlanarMaterial";
            return serializationObject;
        }

        // Statics
        public static Parse(source: any, scene: Scene, rootUrl: string): TriPlanarMaterial {
            return SerializationHelper.Parse(() => new TriPlanarMaterial(source.name, scene), source, scene, rootUrl);
        }
    }
} 

