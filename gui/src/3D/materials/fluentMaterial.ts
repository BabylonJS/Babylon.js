/// <reference path="../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {

    /** @hidden */
    export class FluentMaterialDefines extends MaterialDefines {
        public INNERGLOW = false;
        public BORDER = false;
    
        constructor() {
            super();
            this.rebuild();
        }
    }

    /**
     * Class used to render controls with fluent desgin
     */
    export class FluentMaterial extends PushMaterial {    

        /**
         * Gets or sets inner glow intensity. A value of 0 means no glow (default is 0.5)
         */
        @serialize()
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public innerGlowColorIntensity = 0.5;

        /**
         * Gets or sets the inner glow color (white by default)
         */
        @serializeAsColor3()
        public innerGlowColor = new Color3(1.0, 1.0, 1.0);

        /**
         * Gets or sets alpha value (default is 1.0)
         */
        @serialize()
        public alpha = 1.0;        

        /**
         * Gets or sets the albedo color (Default is Color3(0.3, 0.35, 0.4))
         */
        @serializeAsColor3()
        public albedoColor = new Color3(0.3, 0.35, 0.4);

        /**
         * Gets or sets a boolean indicating if borders must be rendered (default is false)
         */
        @serialize()
        @expandToProperty("_markAllSubMeshesAsTexturesDirty")
        public renderBorders = false;        

        /**
         * Gets or sets border width (default is 0.5)
         */
        @serialize()
        public borderWidth = 0.5;      
        
        /**
         * Gets or sets a value indicating the smoothing value applied to border edges (0.02 by default)
         */
        @serialize()
        public edgeSmoothingValue = 0.02;       
        
        /**
         * Gets or sets the minimum value that can be applied to border width (default is 0.1)
         */
        @serialize()
        public borderMinValue = 0.1;        
        
        /**
         * Creates a new Fluent material
         * @param name defines the name of the material
         * @param scene defines the hosting scene
         */
        constructor(name: string, scene: Scene) {
            super(name, scene);
        }

        public needAlphaBlending(): boolean {
            return this.alpha !== 1.0;
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

            if (!subMesh._materialDefines) {
                subMesh._materialDefines = new FluentMaterialDefines();
            }

            var scene = this.getScene();
            var defines = <FluentMaterialDefines>subMesh._materialDefines;
            if (!this.checkReadyOnEveryCall && subMesh.effect) {
                if (defines._renderId === scene.getRenderId()) {
                    return true;
                }
            }            

            if (defines._areTexturesDirty) {
                defines.INNERGLOW = this.innerGlowColorIntensity > 0;
                defines.BORDER = this.renderBorders;
            }

            var engine = scene.getEngine();
            // Get correct effect      
            if (defines.isDirty) {
                defines.markAsProcessed();
                scene.resetCachedMaterial();

                //Attributes
                var attribs = [VertexBuffer.PositionKind];
                attribs.push(VertexBuffer.NormalKind);
                attribs.push(VertexBuffer.UVKind);

                var shaderName = "fluent";

                var uniforms = ["world", "viewProjection", "innerGlowColor", "albedoColor", "borderWidth", "edgeSmoothingValue", "scaleFactor", "borderMinValue"];

                var samplers = new Array<String>();
                var uniformBuffers = new Array<string>();

                MaterialHelper.PrepareUniformsAndSamplersList(<EffectCreationOptions>{
                    uniformsNames: uniforms,
                    uniformBuffersNames: uniformBuffers,
                    samplers: samplers,
                    defines: defines,
                    maxSimultaneousLights: 4
                });            

                var join = defines.toString();
                subMesh.setEffect(scene.getEngine().createEffect(shaderName,
                    <EffectCreationOptions>{
                        attributes: attribs,
                        uniformsNames: uniforms,
                        uniformBuffersNames: uniformBuffers,
                        samplers: samplers,
                        defines: join,
                        fallbacks: null,
                        onCompiled: this.onCompiled,
                        onError: this.onError,
                        indexParameters: { maxSimultaneousLights: 4 }
                    }, engine));            
                
            }

            if (!subMesh.effect || !subMesh.effect.isReady()) {
                return false;
            }

            defines._renderId = scene.getRenderId();
            this._wasPreviouslyReady = true;

            return true;
        }

        public bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void {
            var scene = this.getScene();

            var defines = <FluentMaterialDefines>subMesh._materialDefines;
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


            if (this._mustRebind(scene, effect)) {   
                this._activeEffect.setColor4("albedoColor", this.albedoColor, this.alpha);

                if (defines.INNERGLOW) {
                    this._activeEffect.setColor4("innerGlowColor", this.innerGlowColor, this.innerGlowColorIntensity);
                }

                if (defines.BORDER) {
                    this._activeEffect.setFloat("borderWidth", this.borderWidth);
                    this._activeEffect.setFloat("edgeSmoothingValue", this.edgeSmoothingValue);
                    this._activeEffect.setFloat("borderMinValue", this.borderMinValue);

                    this._activeEffect.setVector3("scaleFactor", mesh.getBoundingInfo().boundingBox.extendSizeWorld);
                }
            }

            this._afterBind(mesh, this._activeEffect);
        }    

        public getActiveTextures(): BaseTexture[] {
            var activeTextures = super.getActiveTextures();

            return activeTextures;
        }        

        public hasTexture(texture: BaseTexture): boolean {
            if (super.hasTexture(texture)) {
                return true;
            }

            return false;
        }        
        
        public dispose(forceDisposeEffect?: boolean): void {
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