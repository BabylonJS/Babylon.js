/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON {
    var maxSimultaneousLights = 4;

    class SimpleMaterialDefines extends MaterialDefines {
        public DIFFUSE = false;
        public CLIPPLANE = false;
        public ALPHATEST = false;
        public POINTSIZE = false;
        public FOG = false;
        public LIGHT0 = false;
        public LIGHT1 = false;
        public LIGHT2 = false;
        public LIGHT3 = false;
        public SPOTLIGHT0 = false;
        public SPOTLIGHT1 = false;
        public SPOTLIGHT2 = false;
        public SPOTLIGHT3 = false;
        public HEMILIGHT0 = false;
        public HEMILIGHT1 = false;
        public HEMILIGHT2 = false;
        public HEMILIGHT3 = false;
        public DIRLIGHT0 = false;
        public DIRLIGHT1 = false;
        public DIRLIGHT2 = false;
        public DIRLIGHT3 = false;
        public POINTLIGHT0 = false;
        public POINTLIGHT1 = false;
        public POINTLIGHT2 = false;
        public POINTLIGHT3 = false;        
        public SHADOW0 = false;
        public SHADOW1 = false;
        public SHADOW2 = false;
        public SHADOW3 = false;
        public SHADOWS = false;
        public SHADOWVSM0 = false;
        public SHADOWVSM1 = false;
        public SHADOWVSM2 = false;
        public SHADOWVSM3 = false;
        public SHADOWPCF0 = false;
        public SHADOWPCF1 = false;
        public SHADOWPCF2 = false;
        public SHADOWPCF3 = false;
        public NORMAL = false;
        public UV1 = false;
        public UV2 = false;
        public VERTEXCOLOR = false;
        public VERTEXALPHA = false;
        public NUM_BONE_INFLUENCERS = 0;
        public BonesPerMesh = 0;
        public INSTANCES = false;

        constructor() {
            super();
            this._keys = Object.keys(this);
        }
    }

    export class SimpleMaterial extends Material {
        public diffuseTexture: BaseTexture;

        public diffuseColor = new Color3(1, 1, 1);
        public disableLighting = false;

        private _worldViewProjectionMatrix = Matrix.Zero();
        private _scaledDiffuse = new Color3();
        private _renderId: number;

        private _defines = new SimpleMaterialDefines();
        private _cachedDefines = new SimpleMaterialDefines();

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
            var needUVs = false;

            this._defines.reset();

            // Textures
            if (scene.texturesEnabled) {
                if (this.diffuseTexture && StandardMaterial.DiffuseTextureEnabled) {
                    if (!this.diffuseTexture.isReady()) {
                        return false;
                    } else {
                        needUVs = true;
                        this._defines.DIFFUSE = true;
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

            var lightIndex = 0;
            if (scene.lightsEnabled && !this.disableLighting) {
                needNormals = MaterialHelper.PrepareDefinesForLights(scene, mesh, this._defines);
            }

            // Attribs
            if (mesh) {
                if (needNormals && mesh.isVerticesDataPresent(VertexBuffer.NormalKind)) {
                    this._defines.NORMAL = true;
                }
                if (needUVs) {
                    if (mesh.isVerticesDataPresent(VertexBuffer.UVKind)) {
                        this._defines.UV1 = true;
                    }
                    if (mesh.isVerticesDataPresent(VertexBuffer.UV2Kind)) {
                        this._defines.UV2 = true;
                    }
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

                MaterialHelper.HandleFallbacksForShadows(this._defines, fallbacks);
                
                if (this._defines.NUM_BONE_INFLUENCERS > 0) {
                    fallbacks.addCPUSkinningFallback(0, mesh);
                }

                //Attributes
                var attribs = [VertexBuffer.PositionKind];

                if (this._defines.NORMAL) {
                    attribs.push(VertexBuffer.NormalKind);
                }

                if (this._defines.UV1) {
                    attribs.push(VertexBuffer.UVKind);
                }

                if (this._defines.UV2) {
                    attribs.push(VertexBuffer.UV2Kind);
                }

                if (this._defines.VERTEXCOLOR) {
                    attribs.push(VertexBuffer.ColorKind);
                }

                MaterialHelper.PrepareAttributesForBones(attribs, mesh, this._defines, fallbacks);
                MaterialHelper.PrepareAttributesForInstances(attribs, this._defines);

                // Legacy browser patch
                var shaderName = "simple";
                var join = this._defines.toString();
                this._effect = scene.getEngine().createEffect(shaderName,
                    attribs,
                    ["world", "view", "viewProjection", "vEyePosition", "vLightsType", "vDiffuseColor",
                        "vLightData0", "vLightDiffuse0", "vLightSpecular0", "vLightDirection0", "vLightGround0", "lightMatrix0",
                        "vLightData1", "vLightDiffuse1", "vLightSpecular1", "vLightDirection1", "vLightGround1", "lightMatrix1",
                        "vLightData2", "vLightDiffuse2", "vLightSpecular2", "vLightDirection2", "vLightGround2", "lightMatrix2",
                        "vLightData3", "vLightDiffuse3", "vLightSpecular3", "vLightDirection3", "vLightGround3", "lightMatrix3",
                        "vFogInfos", "vFogColor", "pointSize",
                        "vDiffuseInfos", 
                        "mBones",
                        "vClipPlane", "diffuseMatrix",
                        "shadowsInfo0", "shadowsInfo1", "shadowsInfo2", "shadowsInfo3", "depthValues"
                    ],
                    ["diffuseSampler",
                        "shadowSampler0", "shadowSampler1", "shadowSampler2", "shadowSampler3"
                    ],
                    join, fallbacks, this.onCompiled, this.onError);
            }
            if (!this._effect.isReady()) {
                return false;
            }

            this._renderId = scene.getRenderId();
            this._wasPreviouslyReady = true;

            if (mesh) {
                if (!mesh._materialDefines) {
                    mesh._materialDefines = new SimpleMaterialDefines();
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

            if (scene.getCachedMaterial() !== this) {
                // Textures        
                if (this.diffuseTexture && StandardMaterial.DiffuseTextureEnabled) {
                    this._effect.setTexture("diffuseSampler", this.diffuseTexture);

                    this._effect.setFloat2("vDiffuseInfos", this.diffuseTexture.coordinatesIndex, this.diffuseTexture.level);
                    this._effect.setMatrix("diffuseMatrix", this.diffuseTexture.getTextureMatrix());
                }
                // Clip plane
                if (scene.clipPlane) {
                    var clipPlane = scene.clipPlane;
                    this._effect.setFloat4("vClipPlane", clipPlane.normal.x, clipPlane.normal.y, clipPlane.normal.z, clipPlane.d);
                }

                // Point size
                if (this.pointsCloud) {
                    this._effect.setFloat("pointSize", this.pointSize);
                }

                this._effect.setVector3("vEyePosition", scene._mirroredCameraPosition ? scene._mirroredCameraPosition : scene.activeCamera.position);                
            }

            this._effect.setColor4("vDiffuseColor", this.diffuseColor, this.alpha * mesh.visibility);

            // Lights
            if (scene.lightsEnabled && !this.disableLighting) {
                MaterialHelper.BindLights(scene, mesh, this._effect, this._defines);          
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

            if (this.diffuseTexture && this.diffuseTexture.animations && this.diffuseTexture.animations.length > 0) {
                results.push(this.diffuseTexture);
            }

            return results;
        }

        public dispose(forceDisposeEffect?: boolean): void {
            if (this.diffuseTexture) {
                this.diffuseTexture.dispose();
            }

            super.dispose(forceDisposeEffect);
        }

        public clone(name: string): SimpleMaterial {
            var newMaterial = new SimpleMaterial(name, this.getScene());

            // Base material
            this.copyTo(newMaterial);

            // Simple material
            if (this.diffuseTexture && this.diffuseTexture.clone) {
                newMaterial.diffuseTexture = this.diffuseTexture.clone();
            }

            newMaterial.diffuseColor = this.diffuseColor.clone();
            return newMaterial;
        }
        
        public serialize(): any {		
            var serializationObject = super.serialize();
            serializationObject.customType      = "BABYLON.SimpleMaterial";
            serializationObject.diffuseColor    = this.diffuseColor.asArray();
            serializationObject.disableLighting = this.disableLighting;
            
            if (this.diffuseTexture) {
                serializationObject.diffuseTexture = this.diffuseTexture.serialize();
            }

            return serializationObject;
        }

        public static Parse(source: any, scene: Scene, rootUrl: string): SimpleMaterial {
            var material = new SimpleMaterial(source.name, scene);

            material.diffuseColor       = Color3.FromArray(source.diffuseColor);
            material.disableLighting    = source.disableLighting;

            material.alpha          = source.alpha;

            material.id             = source.id;

            Tags.AddTagsTo(material, source.tags);
            material.backFaceCulling = source.backFaceCulling;
            material.wireframe = source.wireframe;

            if (source.diffuseTexture) {
                material.diffuseTexture = Texture.Parse(source.diffuseTexture, scene, rootUrl);
            }

            if (source.checkReadyOnlyOnce) {
                material.checkReadyOnlyOnce = source.checkReadyOnlyOnce;
            }

            return material;
        }
    }
} 

