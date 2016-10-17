module BABYLON {
    /**
    * Creates a refraction texture used by refraction channel of the standard material.
    * @param name the texture name
    * @param size size of the underlying texture
    * @param scene root scene
    */
    export class RefractionTexture extends RenderTargetTexture {
        public refractionPlane = new Plane(0, 1, 0, 1);
        public depth = 2.0;

        constructor(name: string, size: number, scene: Scene, generateMipMaps?: boolean) {
            super(name, size, scene, generateMipMaps, true);

            this.onBeforeRenderObservable.add(() => {
                scene.clipPlane = this.refractionPlane;
            });

            this.onAfterRenderObservable.add(() => {
                delete scene.clipPlane;
            });
        }

        public clone(): RefractionTexture {
            var textureSize = this.getSize();
            var newTexture = new RefractionTexture(this.name, textureSize.width, this.getScene(), this._generateMipMaps);

            // Base texture
            newTexture.hasAlpha = this.hasAlpha;
            newTexture.level = this.level;

            // Refraction Texture
            newTexture.refractionPlane = this.refractionPlane.clone();
            newTexture.renderList = this.renderList.slice(0);
            newTexture.depth = this.depth;

            return newTexture;
        }

        public serialize(): any {
            if (!this.name) {
                return null;
            }

            var serializationObject = super.serialize();

            serializationObject.mirrorPlane = this.refractionPlane.asArray();
            serializationObject.depth = this.depth;

            return serializationObject;
        }
    }
} 