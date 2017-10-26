/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON {
    class SkyMaterialDefines extends MaterialDefines {
        public CLIPPLANE = false;
        public POINTSIZE = false;
        public FOG = false;
        public VERTEXCOLOR = false;
        public VERTEXALPHA = false;

        constructor() {
            super();
            this.rebuild();
        }
    }
    
    export class SkyMaterial extends PushMaterial {
        // Public members
        @serialize()
        public luminance: number = 1.0;
        
        @serialize()
		public turbidity: number = 10.0;
        
        @serialize()
		public rayleigh: number = 2.0;
		
        @serialize()
        public mieCoefficient: number = 0.005;
		
        @serialize()
        public mieDirectionalG: number = 0.8;
        
        @serialize()
        public distance: number = 500;
        
        @serialize()
        public inclination: number = 0.49;
		
        @serialize()
        public azimuth: number = 0.25;
        
        @serializeAsVector3()
        public sunPosition: Vector3 = new Vector3(0, 100, 0);
        
        @serialize()
        public useSunPosition: boolean = false;
        
        // Private members
        private _cameraPosition: Vector3 = Vector3.Zero();
        
        private _renderId: number;        

        constructor(name: string, scene: Scene) {
            super(name, scene);
        }

        public needAlphaBlending(): boolean {
            return (this.alpha < 1.0);
        }

        public needAlphaTesting(): boolean {
            return false;
        }

        public getAlphaTestTexture(): Nullable<BaseTexture> {
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
                subMesh._materialDefines = new SkyMaterialDefines();
            }

            var defines = <SkyMaterialDefines>subMesh._materialDefines;
            var scene = this.getScene();

            if (!this.checkReadyOnEveryCall && subMesh.effect) {
                if (this._renderId === scene.getRenderId()) {
                    return true;
                }
            }

            MaterialHelper.PrepareDefinesForMisc(mesh, scene, false, this.pointsCloud, this.fogEnabled, defines);
            
            // Attribs
            MaterialHelper.PrepareDefinesForAttributes(mesh, defines, true, false);

            // Get correct effect      
            if (defines.isDirty) {
                defines.markAsProcessed();
                
                scene.resetCachedMaterial();
                
                // Fallbacks
                var fallbacks = new EffectFallbacks();             
                if (defines.FOG) {
                    fallbacks.addFallback(1, "FOG");
                }
                
                //Attributes
                var attribs = [VertexBuffer.PositionKind];

                if (defines.VERTEXCOLOR) {
                    attribs.push(VertexBuffer.ColorKind);
                }

                var shaderName = "sky";
                
                var join = defines.toString();
                subMesh.setEffect(scene.getEngine().createEffect(shaderName,
                    attribs,
                    ["world", "viewProjection", "view",
                        "vFogInfos", "vFogColor", "pointSize", "vClipPlane",
                        "luminance", "turbidity", "rayleigh", "mieCoefficient", "mieDirectionalG", "sunPosition",
                        "cameraPosition"
                    ],
                    [],
                    join, fallbacks, this.onCompiled, this.onError), defines);
            }
            
            if (!subMesh.effect || !subMesh.effect.isReady()) {
                return false;
            }

            this._renderId = scene.getRenderId();
            this._wasPreviouslyReady = true;

            return true;
        }

        public bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void {
            var scene = this.getScene();

            var defines = <SkyMaterialDefines>subMesh._materialDefines;
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
                // Clip plane
                if (scene.clipPlane) {
                    var clipPlane = scene.clipPlane;
                    this._activeEffect.setFloat4("vClipPlane", clipPlane.normal.x, clipPlane.normal.y, clipPlane.normal.z, clipPlane.d);
                }

                // Point size
                if (this.pointsCloud) {
                    this._activeEffect.setFloat("pointSize", this.pointSize);
                }               
            }

            // View
            if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== Scene.FOGMODE_NONE) {
                this._activeEffect.setMatrix("view", scene.getViewMatrix());
            }
            
            // Fog
            MaterialHelper.BindFogParameters(scene, mesh, this._activeEffect);
            
            // Sky
            var camera = scene.activeCamera;
            if (camera) {
                var cameraWorldMatrix = camera.getWorldMatrix();
                this._cameraPosition.x = cameraWorldMatrix.m[12];
                this._cameraPosition.y = cameraWorldMatrix.m[13];
                this._cameraPosition.z = cameraWorldMatrix.m[14];
                this._activeEffect.setVector3("cameraPosition", this._cameraPosition);
            }
            
            if (this.luminance > 0) {
                this._activeEffect.setFloat("luminance", this.luminance);
            }
            
			this._activeEffect.setFloat("turbidity", this.turbidity);
			this._activeEffect.setFloat("rayleigh", this.rayleigh);
			this._activeEffect.setFloat("mieCoefficient", this.mieCoefficient);
			this._activeEffect.setFloat("mieDirectionalG", this.mieDirectionalG);
            
            if (!this.useSunPosition) {
                var theta = Math.PI * (this.inclination - 0.5);
                var phi = 2 * Math.PI * (this.azimuth - 0.5);
                
                this.sunPosition.x = this.distance * Math.cos(phi);
                this.sunPosition.y = this.distance * Math.sin(phi) * Math.sin(theta);
                this.sunPosition.z = this.distance * Math.sin(phi) * Math.cos(theta);
            }
            
			this._activeEffect.setVector3("sunPosition", this.sunPosition);

            this._afterBind(mesh, this._activeEffect);
        }

        public getAnimatables(): IAnimatable[] {
            return [];
        }

        public dispose(forceDisposeEffect?: boolean): void {
            super.dispose(forceDisposeEffect);
        }

        public clone(name: string): SkyMaterial {
            return SerializationHelper.Clone<SkyMaterial>(() => new SkyMaterial(name, this.getScene()), this);
        }
        
        public serialize(): any {
            var serializationObject = SerializationHelper.Serialize(this);
            serializationObject.customType  = "BABYLON.SkyMaterial";
            return serializationObject;
        }

        public getClassName(): string {
            return "SkyMaterial";
        }            

        // Statics
        public static Parse(source: any, scene: Scene, rootUrl: string): SkyMaterial {
            return SerializationHelper.Parse(() => new SkyMaterial(source.name, scene), source, scene, rootUrl);
        }
    }
} 

