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
            this._keys = Object.keys(this);
        }
    }
    
    export class SkyMaterial extends Material {
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
        
        private _defines = new SkyMaterialDefines();
        private _cachedDefines = new SkyMaterialDefines();

        constructor(name: string, scene: Scene) {
            super(name, scene);
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
            this._defines.reset();

            // Effect
            if (scene.clipPlane) {
                this._defines.CLIPPLANE = true;
            }

            // Point size
            if (this.pointsCloud || scene.forcePointsCloud) {
                this._defines.POINTSIZE = true;
            }

            // Fog
            if (scene.fogEnabled && mesh && mesh.applyFog && scene.fogMode !== Scene.FOGMODE_NONE && this.fogEnabled) {
                this._defines.FOG = true;
            }
            
            // Attribs
            if (mesh) {
                if (mesh.useVertexColors && mesh.isVerticesDataPresent(VertexBuffer.ColorKind)) {
                    this._defines.VERTEXCOLOR = true;

                    if (mesh.hasVertexAlpha) {
                        this._defines.VERTEXALPHA = true;
                    }
                }
            }

            // Get correct effect      
            if (!this._defines.isEqual(this._cachedDefines) || !this._effect) {
                this._defines.cloneTo(this._cachedDefines);
                
                scene.resetCachedMaterial();
                
                // Fallbacks
                var fallbacks = new EffectFallbacks();             
                if (this._defines.FOG) {
                    fallbacks.addFallback(1, "FOG");
                }
                
                //Attributes
                var attribs = [VertexBuffer.PositionKind];

                if (this._defines.VERTEXCOLOR) {
                    attribs.push(VertexBuffer.ColorKind);
                }

                // Legacy browser patch
                var shaderName = "sky";
                
                var join = this._defines.toString();
                this._effect = scene.getEngine().createEffect(shaderName,
                    attribs,
                    ["world", "viewProjection", "view",
                        "vFogInfos", "vFogColor", "pointSize", "vClipPlane",
                        "luminance", "turbidity", "rayleigh", "mieCoefficient", "mieDirectionalG", "sunPosition",
                        "cameraPosition"
                    ],
                    [],
                    join, fallbacks, this.onCompiled, this.onError);
            }
            
            if (!this._effect.isReady()) {
                return false;
            }

            this._renderId = scene.getRenderId();
            this._wasPreviouslyReady = true;

            if (mesh) {
                if (!mesh._materialDefines) {
                    mesh._materialDefines = new SkyMaterialDefines();
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

            if (scene.getCachedMaterial() !== this) {
                // Clip plane
                if (scene.clipPlane) {
                    var clipPlane = scene.clipPlane;
                    this._effect.setFloat4("vClipPlane", clipPlane.normal.x, clipPlane.normal.y, clipPlane.normal.z, clipPlane.d);
                }

                // Point size
                if (this.pointsCloud) {
                    this._effect.setFloat("pointSize", this.pointSize);
                }               
            }

            // View
            if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== Scene.FOGMODE_NONE) {
                this._effect.setMatrix("view", scene.getViewMatrix());
            }
            
            // Fog
            MaterialHelper.BindFogParameters(scene, mesh, this._effect);
            
            // Sky
            var camera = scene.activeCamera;
            if (camera) {
                var cameraWorldMatrix = camera.getWorldMatrix();
                this._cameraPosition.x = cameraWorldMatrix.m[12];
                this._cameraPosition.y = cameraWorldMatrix.m[13];
                this._cameraPosition.z = cameraWorldMatrix.m[14];
                this._effect.setVector3("cameraPosition", this._cameraPosition);
            }
            
            if (this.luminance > 0) {
                this._effect.setFloat("luminance", this.luminance);
            }
            
			this._effect.setFloat("turbidity", this.turbidity);
			this._effect.setFloat("rayleigh", this.rayleigh);
			this._effect.setFloat("mieCoefficient", this.mieCoefficient);
			this._effect.setFloat("mieDirectionalG", this.mieDirectionalG);
            
            if (!this.useSunPosition) {
                var theta = Math.PI * (this.inclination - 0.5);
                var phi = 2 * Math.PI * (this.azimuth - 0.5);
                
                this.sunPosition.x = this.distance * Math.cos(phi);
                this.sunPosition.y = this.distance * Math.sin(phi) * Math.sin(theta);
                this.sunPosition.z = this.distance * Math.sin(phi) * Math.cos(theta);
            }
            
			this._effect.setVector3("sunPosition", this.sunPosition);

            super.bind(world, mesh);
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

        // Statics
        public static Parse(source: any, scene: Scene, rootUrl: string): SkyMaterial {
            return SerializationHelper.Parse(() => new SkyMaterial(source.name, scene), source, scene, rootUrl);
        }
    }
} 

