/// <reference path="../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    /**
     * Class used to render controls with fluent desgin
     */
    export class FluentMaterial extends PushMaterial {    
        @serializeAsTexture("emissiveTexture")
        private _emissiveTexture: BaseTexture;
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public emissiveTexture: BaseTexture;

        private _renderId: number;

        constructor(name: string, scene: Scene) {
            super(name, scene);
        }

        public needAlphaBlending(): boolean {
            return false;
        }

        public needAlphaTesting(): boolean {
            return false;
        }

        public getAlphaTestTexture(): Nullable<BaseTexture> {
            return null;
        } 
        
        public isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean {
            if (this.isFrozen) {
                if (this._wasPreviouslyReady && subMesh.effect) {
                    return true;
                }
            }

            var scene = this.getScene();

            if (!this.checkReadyOnEveryCall && subMesh.effect) {
                if (this._renderId === scene.getRenderId()) {
                    return true;
                }
            }

            var engine = scene.getEngine();

            scene.resetCachedMaterial();

            //Attributes
            var attribs = [VertexBuffer.PositionKind];
            attribs.push(VertexBuffer.NormalKind);
            attribs.push(VertexBuffer.UVKind);

            var shaderName = "fluent";

            var uniforms = ["world", "viewProjection", "emissiveMatrix"];

            var samplers = ["emissiveSampler"]
            var uniformBuffers = new Array<string>();

            MaterialHelper.PrepareUniformsAndSamplersList(<EffectCreationOptions>{
                uniformsNames: uniforms,
                uniformBuffersNames: uniformBuffers,
                samplers: samplers,
                defines: "",
                maxSimultaneousLights: 4
            });            

            subMesh.setEffect(scene.getEngine().createEffect(shaderName,
                <EffectCreationOptions>{
                    attributes: attribs,
                    uniformsNames: uniforms,
                    uniformBuffersNames: uniformBuffers,
                    samplers: samplers,
                    defines: "",
                    fallbacks: null,
                    onCompiled: this.onCompiled,
                    onError: this.onError,
                    indexParameters: { maxSimultaneousLights: 4 }
                }, engine));

                if (!subMesh.effect || !subMesh.effect.isReady()) {
                return false;
            }

            this._renderId = scene.getRenderId();
            this._wasPreviouslyReady = true;

            return true;
        }

        public bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void {
            var scene = this.getScene();

            var effect = subMesh.effect;
            if (!effect) {
                return;
            }
            this._activeEffect = effect;

            // Matrices        
            this.bindOnlyWorldMatrix(world);
            this._activeEffect.setMatrix("viewProjection", scene.getTransformMatrix());


            if (this._mustRebind(scene, effect)) {
                // Textures        
                if (this._emissiveTexture && StandardMaterial.DiffuseTextureEnabled) {
                    this._activeEffect.setTexture("emissiveSampler", this._emissiveTexture);

                    this._activeEffect.setMatrix("emissiveMatrix", this._emissiveTexture.getTextureMatrix());
                }                
            }

            this._afterBind(mesh, this._activeEffect);
        }    

        public getActiveTextures(): BaseTexture[] {
            var activeTextures = super.getActiveTextures();

            if (this._emissiveTexture) {
                activeTextures.push(this._emissiveTexture);
            }

            return activeTextures;
        }        

        public hasTexture(texture: BaseTexture): boolean {
            if (super.hasTexture(texture)) {
                return true;
            }

            if (this._emissiveTexture === texture) {
                return true;
            }

            return false;
        }        
        
        public dispose(forceDisposeEffect?: boolean): void {
            if (this._emissiveTexture) {
                this._emissiveTexture.dispose();
            }

            super.dispose(forceDisposeEffect);
        }

        public clone(name: string): FluentMaterial {
            return SerializationHelper.Clone(() => new FluentMaterial(name, this.getScene()), this);
        }

        public serialize(): any {
            var serializationObject = SerializationHelper.Serialize(this);
            serializationObject.customType = "BABYLON.GUI.FluentMaterial";
            return serializationObject;
        }

        public getClassName(): string {
            return "FluentMaterial";
        }

        // Statics
        public static Parse(source: any, scene: Scene, rootUrl: string): FluentMaterial {
            return SerializationHelper.Parse(() => new FluentMaterial(source.name, scene), source, scene, rootUrl);
        }
    }
}