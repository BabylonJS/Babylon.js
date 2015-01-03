module BABYLON {
    export class RawTexture extends Texture {
        constructor(scene: Scene, samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE) {
            super(null, scene, false, false);
        }
    }
}