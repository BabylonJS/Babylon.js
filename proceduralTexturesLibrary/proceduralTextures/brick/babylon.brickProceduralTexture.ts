 /// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON {
	export class BrickProceduralTexture extends ProceduralTexture {
        private _numberOfBricksHeight: number = 15;
        private _numberOfBricksWidth: number = 5;
        private _jointColor = new Color3(0.72, 0.72, 0.72);
        private _brickColor = new Color3(0.77, 0.47, 0.40);

        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean) {
            super(name, size, "bricktexture", scene, fallbackTexture, generateMipMaps);
            this.updateShaderUniforms();
            this.refreshRate = 0;
        }

        public updateShaderUniforms() {
            this.setFloat("numberOfBricksHeight", this._numberOfBricksHeight);
            this.setFloat("numberOfBricksWidth", this._numberOfBricksWidth);
            this.setColor3("brickColor", this._brickColor);
            this.setColor3("jointColor", this._jointColor);
        }

        public get numberOfBricksHeight(): number {
            return this._numberOfBricksHeight;
        }

        public set numberOfBricksHeight(value: number) {
            this._numberOfBricksHeight = value;
            this.updateShaderUniforms();
        }

        public get numberOfBricksWidth(): number {
            return this._numberOfBricksWidth;
        }

        public set numberOfBricksWidth(value: number) {
            this._numberOfBricksWidth = value;
            this.updateShaderUniforms();
        }

        public get jointColor(): Color3 {
            return this._jointColor;
        }

        public set jointColor(value: Color3) {
            this._jointColor = value;
            this.updateShaderUniforms();
        }

        public get brickColor(): Color3 {
            return this._brickColor;
        }

        public set brickColor(value: Color3) {
            this._brickColor = value;
            this.updateShaderUniforms();
        }
    }	
}