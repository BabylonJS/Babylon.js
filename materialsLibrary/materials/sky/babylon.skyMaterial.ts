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
        public luminance: number = 1.0;
		public turbidity: number = 10.0;
		public rayleigh: number = 2.0;
		public mieCoefficient: number = 0.005;
		public mieDirectionalG: number = 0.8;
        
        public distance: number = 500;
        public inclination: number = 0.49;
		public azimuth: number = 0.25;
        
        // Private members
        private _sunPosition: Vector3 = Vector3.Zero();
        
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
                    ["world", "viewProjection",
                        "vFogInfos", "vFogColor", "pointSize", "vClipPlane",
                        "luminance", "turbidity", "rayleigh", "mieCoefficient", "mieDirectionalG", "sunPosition"
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
            if (scene.fogEnabled && mesh.applyFog && scene.fogMode !== Scene.FOGMODE_NONE) {
                this._effect.setFloat4("vFogInfos", scene.fogMode, scene.fogStart, scene.fogEnd, scene.fogDensity);
                this._effect.setColor3("vFogColor", scene.fogColor);
            }
            
            // Sky
            this._effect.setFloat("luminance", this.luminance);
			this._effect.setFloat("turbidity", this.turbidity);
			this._effect.setFloat("rayleigh", this.rayleigh);
			this._effect.setFloat("mieCoefficient", this.mieCoefficient);
			this._effect.setFloat("mieDirectionalG", this.mieDirectionalG);
            
            var theta = Math.PI * (this.inclination - 0.5);
			var phi = 2 * Math.PI * (this.azimuth - 0.5);
            
            this._sunPosition.x = this.distance * Math.cos( phi );
			this._sunPosition.y = this.distance * Math.sin( phi ) * Math.sin( theta );
			this._sunPosition.z = this.distance * Math.sin( phi ) * Math.cos( theta );
            
			this._effect.setVector3("sunPosition", this._sunPosition);

            super.bind(world, mesh);
        }

        public getAnimatables(): IAnimatable[] {
            return [];
        }

        public dispose(forceDisposeEffect?: boolean): void {
            super.dispose(forceDisposeEffect);
        }

        public clone(name: string): SkyMaterial {
            var newMaterial = new SkyMaterial(name, this.getScene());

            // Base material
            this.copyTo(newMaterial);
            
            newMaterial.luminance = this.luminance;
            newMaterial.turbidity = this.turbidity;
            newMaterial.rayleigh = this.rayleigh;
            newMaterial.mieCoefficient = this.mieCoefficient;
            newMaterial.mieDirectionalG = this.mieDirectionalG;
            newMaterial.distance = this.distance;
            newMaterial.inclination = this.inclination;
            newMaterial.azimuth = this.azimuth;
            
            return newMaterial;
        }
		
		public serialize(): any {
		
            var serializationObject = super.serialize();
            serializationObject.customType = "BABYLON.SkyMaterial";
            
            serializationObject.luminance = this.luminance;
            serializationObject.turbidity = this.turbidity;
            serializationObject.rayleigh = this.rayleigh;
            serializationObject.mieCoefficient = this.mieCoefficient;
            serializationObject.mieDirectionalG = this.mieDirectionalG;
            serializationObject.distance = this.distance;
            serializationObject.inclination = this.inclination;
            serializationObject.azimuth = this.azimuth;

            return serializationObject;
        }

        public static Parse(source: any, scene: Scene, rootUrl: string): SkyMaterial {
            var material = new SkyMaterial(source.name, scene);

            material.alpha = source.alpha;
            material.id = source.id;
            
            Tags.AddTagsTo(material, source.tags);
            material.backFaceCulling = source.backFaceCulling;
            material.wireframe = source.wireframe;

            if (source.checkReadyOnlyOnce) {
                material.checkReadyOnlyOnce = source.checkReadyOnlyOnce;
            }
            
            material.luminance = source.luminance;
            material.turbidity = source.turbidity;
            material.rayleigh = source.rayleigh;
            material.mieCoefficient = source.mieCoefficient;
            material.mieDirectionalG = source.mieDirectionalG;
            material.distance = source.distance;
            material.inclination = source.inclination;
            material.azimuth = source.azimuth;

            return material;
        }
    }
} 

