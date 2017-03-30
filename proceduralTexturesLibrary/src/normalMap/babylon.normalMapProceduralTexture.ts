/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON {
    export class NormalMapProceduralTexture extends ProceduralTexture {
        private _baseTexture: Texture;

        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean) {
            super(name, size, "normalMapProceduralTexture", scene, fallbackTexture, generateMipMaps);
            this.updateShaderUniforms();
        }

        public updateShaderUniforms() {
            this.setTexture("baseSampler", this._baseTexture);
            this.setFloat("size", this.getRenderSize());
        }

        public render(useCameraPostProcess?: boolean) {
            super.render(useCameraPostProcess);
        }

        public resize(size: any, generateMipMaps: any): void {
            super.resize(size, generateMipMaps);

            // We need to update the "size" uniform
            this.updateShaderUniforms();
        }

        public get baseTexture(): Texture {
            return this._baseTexture;
        }

        public set baseTexture(texture: Texture) {
            this._baseTexture = texture;
            this.updateShaderUniforms();
        }
    }
}
