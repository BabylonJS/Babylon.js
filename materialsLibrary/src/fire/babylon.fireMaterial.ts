/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON {

    class FireMaterialDefines extends MaterialDefines {
        public DIFFUSE = false;
        public CLIPPLANE = false;
        public ALPHATEST = false;
        public DEPTHPREPASS = false;
        public POINTSIZE = false;
        public FOG = false;
        public UV1 = false;
        public VERTEXCOLOR = false;
        public VERTEXALPHA = false;
        public BonesPerMesh = 0;
        public NUM_BONE_INFLUENCERS = 0;
        public INSTANCES = false;

        constructor() {
            super();
            this.rebuild();
        }
    }

    export class FireMaterial extends PushMaterial {
        @serializeAsTexture("diffuseTexture")
        private _diffuseTexture: BaseTexture;
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public diffuseTexture: BaseTexture;        
        
        @serializeAsTexture("distortionTexture")
        private _distortionTexture: BaseTexture;
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public distortionTexture: BaseTexture;       
        
        @serializeAsTexture("opacityTexture")
        private _opacityTexture: BaseTexture;
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public opacityTexture: BaseTexture;
        
        @serialize("diffuseColor")
        public diffuseColor = new Color3(1, 1, 1);
        
        @serialize()
        public speed = 1.0;
        
        private _scaledDiffuse = new Color3();
        private _renderId: number;
        private _lastTime: number = 0;

        constructor(name: string, scene: Scene) {
            super(name, scene);
        }

        public needAlphaBlending(): boolean {
            return false;
        }

        public needAlphaTesting(): boolean {
            return true;
        }

        public getAlphaTestTexture(): BaseTexture {
            return null;
        }

        // Methods   
        public isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean {   
            if (this.isFrozen) {
                if (this._wasPreviouslyReady && subMesh.effect) {
                    return true;
                }
            }

            if (!subMesh._materialDefines) {
                subMesh._materialDefines = new FireMaterialDefines();
            }

            var defines = <FireMaterialDefines>subMesh._materialDefines;
            var scene = this.getScene();

            if (!this.checkReadyOnEveryCall && subMesh.effect) {
                if (this._renderId === scene.getRenderId()) {
                    return true;
                }
            }

            var engine = scene.getEngine();

            // Textures
            if (defines._areTexturesDirty) {
                defines._needUVs = false;
                if (this._diffuseTexture && StandardMaterial.DiffuseTextureEnabled) {
                    if (!this._diffuseTexture.isReady()) {
                        return false;
                    } else {
                        defines._needUVs = true;
                        defines.DIFFUSE = true;
                    }
                }              
            }

            // Misc.
            if (defines._areMiscDirty) {
                defines.POINTSIZE = (this.pointsCloud || scene.forcePointsCloud);
                defines.FOG = (scene.fogEnabled && mesh.applyFog && scene.fogMode !== Scene.FOGMODE_NONE && this.fogEnabled);
            }
            
            // Values that need to be evaluated on every frame
            MaterialHelper.PrepareDefinesForFrameBoundValues(scene, engine, defines, useInstances);
            
            // Attribs
            MaterialHelper.PrepareDefinesForAttributes(mesh, defines, false, true);

            // Get correct effect      
            if (defines.isDirty) {
                defines.markAsProcessed();

                scene.resetCachedMaterial();

                // Fallbacks
                var fallbacks = new EffectFallbacks();             
                if (defines.FOG) {
                    fallbacks.addFallback(1, "FOG");
                }
                
                if (defines.NUM_BONE_INFLUENCERS > 0) {
                    fallbacks.addCPUSkinningFallback(0, mesh);
                }

                //Attributes
                var attribs = [VertexBuffer.PositionKind];

                if (defines.UV1) {
                    attribs.push(VertexBuffer.UVKind);
                }

                if (defines.VERTEXCOLOR) {
                    attribs.push(VertexBuffer.ColorKind);
                }

                MaterialHelper.PrepareAttributesForBones(attribs, mesh, defines, fallbacks);
                MaterialHelper.PrepareAttributesForInstances(attribs, defines);

                // Legacy browser patch
                var shaderName = "fire";
                
                var join = defines.toString();
                subMesh.setEffect(scene.getEngine().createEffect(shaderName,
                    <EffectCreationOptions>{
                        attributes: attribs,
                        uniformsNames: ["world", "view", "viewProjection", "vEyePosition",
                                "vFogInfos", "vFogColor", "pointSize",
                                "vDiffuseInfos", 
                                "mBones",
                                "vClipPlane", "diffuseMatrix",
                                // Fire
                                "time", "speed"
                            ],
                        uniformBuffersNames: [],
                        samplers: ["diffuseSampler",
                                // Fire
                                "distortionSampler", "opacitySampler"
                            ],
                        defines: join,
                        fallbacks: fallbacks,
                        onCompiled: this.onCompiled,
                        onError: this.onError
                    }, engine), defines);
            }
            
            if (!subMesh.effect.isReady()) {
                return false;
            }

            this._renderId = scene.getRenderId();
            this._wasPreviouslyReady = true;

            return true;
        }

        public bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void {
            var scene = this.getScene();

            var defines = <FireMaterialDefines>subMesh._materialDefines;
            if (!defines) {
                return;
            }

            var effect = subMesh.effect;
            this._activeEffect = effect;

            // Matrices
            this.bindOnlyWorldMatrix(world);
            this._activeEffect.setMatrix("viewProjection", scene.getTransformMatrix());

            // Bones
            MaterialHelper.BindBonesParameters(mesh, this._activeEffect);

            if (this._mustRebind(scene, effect)) {
                // Textures        
                if (this._diffuseTexture && StandardMaterial.DiffuseTextureEnabled) {
                    this._activeEffect.setTexture("diffuseSampler", this._diffuseTexture);

                    this._activeEffect.setFloat2("vDiffuseInfos", this._diffuseTexture.coordinatesIndex, this._diffuseTexture.level);
                    this._activeEffect.setMatrix("diffuseMatrix", this._diffuseTexture.getTextureMatrix());
                    
                    this._activeEffect.setTexture("distortionSampler", this._distortionTexture);
                    this._activeEffect.setTexture("opacitySampler", this._opacityTexture);
                }
                
                // Clip plane
                if (scene.clipPlane) {
                    var clipPlane = scene.clipPlane;
                    this._activeEffect.setFloat4("vClipPlane", clipPlane.normal.x, clipPlane.normal.y, clipPlane.normal.z, clipPlane.d);
                }

                // Point size
                if (this.pointsCloud) {
                    this._activeEffect.setFloat("pointSize", this.pointSize);
                }

                this._activeEffect.setVector3("vEyePosition", scene._mirroredCameraPosition ? scene._mirroredCameraPosition : scene.activeCamera.position);                
            }

            this._activeEffect.setColor4("vDiffuseColor", this._scaledDiffuse, this.alpha * mesh.visibility);

            // View
            if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== Scene.FOGMODE_NONE) {
                this._activeEffect.setMatrix("view", scene.getViewMatrix());
            }
            
            // Fog
            MaterialHelper.BindFogParameters(scene, mesh, this._activeEffect);
            
            // Time
            this._lastTime += scene.getEngine().getDeltaTime();
            this._activeEffect.setFloat("time", this._lastTime);
            
            // Speed
            this._activeEffect.setFloat("speed", this.speed);

            this._afterBind(mesh, this._activeEffect);
        }

        public getAnimatables(): IAnimatable[] {
            var results = [];

            if (this._diffuseTexture && this._diffuseTexture.animations && this._diffuseTexture.animations.length > 0) {
                results.push(this._diffuseTexture);
            }
            if (this._distortionTexture && this._distortionTexture.animations && this._distortionTexture.animations.length > 0) {
                results.push(this._distortionTexture);
            }
            if (this._opacityTexture && this._opacityTexture.animations && this._opacityTexture.animations.length > 0) {
                results.push(this._opacityTexture);
            }

            return results;
        }

        public getActiveTextures(): BaseTexture[] {
            var activeTextures = super.getActiveTextures();

            if (this._diffuseTexture) {
                activeTextures.push(this._diffuseTexture);
            }

            if (this._distortionTexture) {
                activeTextures.push(this._distortionTexture);
            }

            if (this._opacityTexture) {
                activeTextures.push(this._opacityTexture);
            }

            return activeTextures;
        }

        public hasTexture(texture: BaseTexture): boolean {
            if (super.hasTexture(texture)) {
                return true;
            }

            if (this._diffuseTexture === texture) {
                return true;
            }

            if (this._distortionTexture === texture) {
                return true;
            }    

            if (this._opacityTexture === texture) {
                return true;
            }            

            return false;    
        }         

        public getClassName(): string {
            return "FireMaterial";
        }        

        public dispose(forceDisposeEffect?: boolean): void {
            if (this._diffuseTexture) {
                this._diffuseTexture.dispose();
            }
            if (this._distortionTexture) {
                this._distortionTexture.dispose();
            }

            super.dispose(forceDisposeEffect);
        }

        public clone(name: string): FireMaterial {
            return SerializationHelper.Clone<FireMaterial>(() => new FireMaterial(name, this.getScene()), this);
        }
		
		public serialize(): any {
		
            var serializationObject = super.serialize();
            serializationObject.customType      = "BABYLON.FireMaterial";
            serializationObject.diffuseColor    = this.diffuseColor.asArray();
            serializationObject.speed           = this.speed;

            if (this._diffuseTexture) {
                serializationObject._diffuseTexture = this._diffuseTexture.serialize();
            }
            
			if (this._distortionTexture) {
                serializationObject._distortionTexture = this._distortionTexture.serialize();
            }
			
			if (this._opacityTexture) {
                serializationObject._opacityTexture = this._opacityTexture.serialize();
            }

            return serializationObject;
        }

        public static Parse(source: any, scene: Scene, rootUrl: string): FireMaterial {
            var material = new FireMaterial(source.name, scene);

            material.diffuseColor   = Color3.FromArray(source.diffuseColor);
            material.speed          = source.speed;

            material.alpha          = source.alpha;

            material.id             = source.id;

            Tags.AddTagsTo(material, source.tags);
            material.backFaceCulling = source.backFaceCulling;
            material.wireframe = source.wireframe;

            if (source._diffuseTexture) {
                material._diffuseTexture = Texture.Parse(source._diffuseTexture, scene, rootUrl);
            }

            if (source._distortionTexture) {
                material._distortionTexture = Texture.Parse(source._distortionTexture, scene, rootUrl);
            }
			
			if (source._opacityTexture) {
                material._opacityTexture = Texture.Parse(source._opacityTexture, scene, rootUrl);
            }

            if (source.checkReadyOnlyOnce) {
                material.checkReadyOnlyOnce = source.checkReadyOnlyOnce;
            }

            return material;
        }
    }
} 

