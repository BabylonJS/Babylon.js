/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON {
    class ShadowOnlyMaterialDefines extends MaterialDefines {
        public CLIPPLANE = false;
        public POINTSIZE = false;
        public FOG = false;
        public NORMAL = false;
        public NUM_BONE_INFLUENCERS = 0;
        public BonesPerMesh = 0;
        public INSTANCES = false;

        constructor() {
            super();
            this.rebuild();
        }
    }

    export class ShadowOnlyMaterial extends PushMaterial {
        @serialize()

        private _worldViewProjectionMatrix = Matrix.Zero();
        private _scaledDiffuse = new Color3();
        private _renderId: number;

        constructor(name: string, scene: Scene) {
            super(name, scene);
        }

        public needAlphaBlending(): boolean {
            return true;
        }

        public needAlphaTesting(): boolean {
            return false;
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
                subMesh._materialDefines = new ShadowOnlyMaterialDefines();
            }

            var defines = <ShadowOnlyMaterialDefines>subMesh._materialDefines;
            var scene = this.getScene();

            if (!this.checkReadyOnEveryCall && subMesh.effect) {
                if (this._renderId === scene.getRenderId()) {
                    return true;
                }
            }

            var engine = scene.getEngine();

            MaterialHelper.PrepareDefinesForFrameBoundValues(scene, engine, defines, useInstances);

            MaterialHelper.PrepareDefinesForMisc(mesh, scene, false, this.pointsCloud, this.fogEnabled, defines);

            defines._needNormals = MaterialHelper.PrepareDefinesForLights(scene, mesh, defines, false, 1);

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

                MaterialHelper.HandleFallbacksForShadows(defines, fallbacks, 1);
                
                if (defines.NUM_BONE_INFLUENCERS > 0) {
                    fallbacks.addCPUSkinningFallback(0, mesh);
                }

                //Attributes
                var attribs = [VertexBuffer.PositionKind];

                if (defines.NORMAL) {
                    attribs.push(VertexBuffer.NormalKind);
                }

                MaterialHelper.PrepareAttributesForBones(attribs, mesh, defines, fallbacks);
                MaterialHelper.PrepareAttributesForInstances(attribs, defines);

                var shaderName = "shadowOnly";
                var join = defines.toString();
                var uniforms = ["world", "view", "viewProjection", "vEyePosition", "vLightsType",
                                "vFogInfos", "vFogColor", "pointSize",
                                "mBones",
                                "vClipPlane", "depthValues"
                ];
                var samplers = [];
                
                var uniformBuffers = [];

                MaterialHelper.PrepareUniformsAndSamplersList(<EffectCreationOptions>{
                    uniformsNames: uniforms, 
                    uniformBuffersNames: uniformBuffers,
                    samplers: samplers, 
                    defines: defines, 
                    maxSimultaneousLights: 1
                });
                
                subMesh.setEffect(scene.getEngine().createEffect(shaderName,
                    <EffectCreationOptions>{
                        attributes: attribs,
                        uniformsNames: uniforms,
                        uniformBuffersNames: uniformBuffers,
                        samplers: samplers,
                        defines: join,
                        fallbacks: fallbacks,
                        onCompiled: this.onCompiled,
                        onError: this.onError,
                        indexParameters: { maxSimultaneousLights: 1 }
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

            var defines = <ShadowOnlyMaterialDefines>subMesh._materialDefines;
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
                // Clip plane
                MaterialHelper.BindClipPlane(this._activeEffect, scene);

                // Point size
                if (this.pointsCloud) {
                    this._activeEffect.setFloat("pointSize", this.pointSize);
                }

                this._activeEffect.setVector3("vEyePosition", scene._mirroredCameraPosition ? scene._mirroredCameraPosition : scene.activeCamera.position);                
            }

            // Lights
            if (scene.lightsEnabled) {
                MaterialHelper.BindLights(scene, mesh, this._activeEffect, defines, 1);          
            }

            // View
            if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== Scene.FOGMODE_NONE) {
                this._activeEffect.setMatrix("view", scene.getViewMatrix());
            }

            // Fog
            MaterialHelper.BindFogParameters(scene, mesh, this._activeEffect);

            this._afterBind(mesh, this._activeEffect);
        }

        public clone(name: string): ShadowOnlyMaterial {
            return SerializationHelper.Clone<ShadowOnlyMaterial>(() => new ShadowOnlyMaterial(name, this.getScene()), this);
        }
        
        public serialize(): any {
            var serializationObject = SerializationHelper.Serialize(this);
            serializationObject.customType = "BABYLON.ShadowOnlyMaterial";
            return serializationObject;
        }

        // Statics
        public static Parse(source: any, scene: Scene, rootUrl: string): ShadowOnlyMaterial {
            return SerializationHelper.Parse(() => new ShadowOnlyMaterial(source.name, scene), source, scene, rootUrl);
        }
    }
} 

