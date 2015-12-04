 /// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON {
    export class CloudProceduralTexture extends ProceduralTexture {
        private _skyColor = new Color4(0.15, 0.68, 1.0, 1.0);
        private _cloudColor = new Color4(1, 1, 1, 1.0);
    
        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean) {
            super(name, size, "cloudProceduralTexture", scene, fallbackTexture, generateMipMaps);
            this.updateShaderUniforms();
            this.refreshRate = 0;
        }
    
        public updateShaderUniforms() {
            this.setColor4("skyColor", this._skyColor);
            this.setColor4("cloudColor", this._cloudColor);
        }
    
        public get skyColor(): Color4 {
            return this._skyColor;
        }
    
        public set skyColor(value: Color4) {
            this._skyColor = value;
            this.updateShaderUniforms();
        }
    
        public get cloudColor(): Color4 {
            return this._cloudColor;
        }
    
        public set cloudColor(value: Color4) {
            this._cloudColor = value;
            this.updateShaderUniforms();
        }
    }
}