 /// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON {
    export class MarbleProceduralTexture extends ProceduralTexture {
        private _numberOfTilesHeight: number = 3;
        private _numberOfTilesWidth: number = 3;
        private _amplitude: number = 9.0;
        private _marbleColor = new Color3(0.77, 0.47, 0.40);
        private _jointColor = new Color3(0.72, 0.72, 0.72);

        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean) {
            super(name, size, "marbletexture", scene, fallbackTexture, generateMipMaps);
            this.updateShaderUniforms();
            this.refreshRate = 0;
        }

        public updateShaderUniforms() {
            this.setFloat("numberOfTilesHeight", this._numberOfTilesHeight);
            this.setFloat("numberOfTilesWidth", this._numberOfTilesWidth);
            this.setFloat("amplitude", this._amplitude);
            this.setColor3("marbleColor", this._marbleColor);
            this.setColor3("jointColor", this._jointColor);
        }

        public get numberOfTilesHeight(): number {
            return this._numberOfTilesHeight;
        }

        public set numberOfTilesHeight(value: number) {
            this._numberOfTilesHeight = value;
            this.updateShaderUniforms();
        }

        public get numberOfTilesWidth(): number {
            return this._numberOfTilesWidth;
        }

        public set numberOfTilesWidth(value: number) {
            this._numberOfTilesWidth = value;
            this.updateShaderUniforms();
        }

        public get jointColor(): Color3 {
            return this._jointColor;
        }

        public set jointColor(value: Color3) {
            this._jointColor = value;
            this.updateShaderUniforms();
        }

        public get marbleColor(): Color3 {
            return this._marbleColor;
        }

        public set marbleColor(value: Color3) {
            this._marbleColor = value;
            this.updateShaderUniforms();
        }
    }
}