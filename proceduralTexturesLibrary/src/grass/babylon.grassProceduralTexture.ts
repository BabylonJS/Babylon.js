 /// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON {
    export class GrassProceduralTexture extends ProceduralTexture {
        private _grassColors: Color3[];
        private _groundColor = new Color3(1, 1, 1);

        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean) {
            super(name, size, "grassProceduralTexture", scene, fallbackTexture, generateMipMaps);

            this._grassColors = [
                new Color3(0.29, 0.38, 0.02),
                new Color3(0.36, 0.49, 0.09),
                new Color3(0.51, 0.6, 0.28)
            ];

            this.updateShaderUniforms();
        }

        public updateShaderUniforms() {
            this.setColor3("herb1Color", this._grassColors[0]);
            this.setColor3("herb2Color", this._grassColors[1]);
            this.setColor3("herb3Color", this._grassColors[2]);
            this.setColor3("groundColor", this._groundColor);
        }

        public get grassColors(): Color3[] {
            return this._grassColors;
        }

        public set grassColors(value: Color3[]) {
            this._grassColors = value;
            this.updateShaderUniforms();
        }

        public get groundColor(): Color3 {
            return this._groundColor;
        }

        public set groundColor(value: Color3) {
            this.groundColor = value;
            this.updateShaderUniforms();
        }
    }
}