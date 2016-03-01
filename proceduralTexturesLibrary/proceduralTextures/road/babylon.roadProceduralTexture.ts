 /// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON {
    export class RoadProceduralTexture extends ProceduralTexture {
        private _roadColor = new Color3(0.53, 0.53, 0.53);

        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean) {
            super(name, size, "roadProceduralTexture", scene, fallbackTexture, generateMipMaps);
            this.updateShaderUniforms();
        }

        public updateShaderUniforms() {
            this.setColor3("roadColor", this._roadColor);
        }

        public get roadColor(): Color3 {
            return this._roadColor;
        }

        public set roadColor(value: Color3) {
            this._roadColor = value;
            this.updateShaderUniforms();
        }
    }
}