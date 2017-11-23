/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON {
    export class PerlinNoiseProceduralTexture extends ProceduralTexture {
        public time: number = 0.0;
        public speed: number = 1.0;
        public translationSpeed: number = 1.0;

        private _currentTranslation: number = 0;

        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean) {
            super(name, size, "perlinNoiseProceduralTexture", scene, fallbackTexture, generateMipMaps);
            this.updateShaderUniforms();
        }

        public updateShaderUniforms() {
            this.setFloat("size", this.getRenderSize());

            let scene = this.getScene();

            if (!scene) {
                return;
            }
            var deltaTime = scene.getEngine().getDeltaTime();

            this.time += deltaTime;
            this.setFloat("time", this.time * this.speed / 1000);

            this._currentTranslation += deltaTime * this.translationSpeed / 1000.0;
            this.setFloat("translationSpeed", this._currentTranslation);
        }

        public render(useCameraPostProcess?: boolean) {
            this.updateShaderUniforms();
            super.render(useCameraPostProcess);
        }

        public resize(size: any, generateMipMaps: any): void {
            super.resize(size, generateMipMaps);
        }
    }
}
