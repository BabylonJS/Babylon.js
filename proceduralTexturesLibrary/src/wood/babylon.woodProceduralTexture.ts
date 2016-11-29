/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON {
	export class WoodProceduralTexture extends ProceduralTexture {
        private _ampScale: number = 100.0;
        private _woodColor: Color3 = new Color3(0.32, 0.17, 0.09);

        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean) {
            super(name, size, "woodProceduralTexture", scene, fallbackTexture, generateMipMaps);
            this.updateShaderUniforms();
        }

        public updateShaderUniforms() {
            this.setFloat("ampScale", this._ampScale);
            this.setColor3("woodColor", this._woodColor);
        }

        public get ampScale(): number {
            return this._ampScale;
        }

        public set ampScale(value: number) {
            this._ampScale = value;
            this.updateShaderUniforms();
        }

        public get woodColor(): Color3 {
            return this._woodColor;
        }

        public set woodColor(value: Color3) {
            this._woodColor = value;
            this.updateShaderUniforms();
        }
    }
}