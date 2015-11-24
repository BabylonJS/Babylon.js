  /// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON {
 export class StarfieldProceduralTexture extends ProceduralTexture {
        private _time = 1;
        private _alpha = 0.5;
        private _beta = 0.8;
        private _zoom = 0.8;

        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean) {
            super(name, size, "starfieldProceduralTexture", scene, fallbackTexture, generateMipMaps);
            this.updateShaderUniforms();
        }

        public updateShaderUniforms() {
            this.setFloat("time", this._time);      
            this.setFloat("alpha", this._alpha);  
            this.setFloat("beta", this._beta);  
            this.setFloat("zoom", this._zoom); 
        }

        public get time(): number {
            return this._time;
        }

        public set time(value: number) {
            this._time = value;
            this.updateShaderUniforms();
        }      
        
        public get alpha(): number {
            return this._alpha;
        }

        public set alpha(value: number) {
            this._alpha = value;
            this.updateShaderUniforms();
        }    

        public get beta(): number {
            return this._beta;
        }

        public set beta(value: number) {
            this._beta = value;
            this.updateShaderUniforms();
        } 

        public get zoom(): number {
            return this._zoom;
        }

        public set zoom(value: number) {
            this._zoom = value;
            this.updateShaderUniforms();
        } 
    }
}