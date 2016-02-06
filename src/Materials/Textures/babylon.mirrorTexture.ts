module BABYLON {
    export class MirrorTexture extends RenderTargetTexture {
        public mirrorPlane = new Plane(0, 1, 0, 1);

        private _transformMatrix = Matrix.Zero();
        private _mirrorMatrix = Matrix.Zero();
        private _savedViewMatrix: Matrix;

        constructor(name: string, size: number, scene: Scene, generateMipMaps?: boolean) {
            super(name, size, scene, generateMipMaps, true);

            this.onBeforeRender = () => {
                Matrix.ReflectionToRef(this.mirrorPlane, this._mirrorMatrix);
                this._savedViewMatrix = scene.getViewMatrix();

                this._mirrorMatrix.multiplyToRef(this._savedViewMatrix, this._transformMatrix);

                scene.setTransformMatrix(this._transformMatrix, scene.getProjectionMatrix());

                scene.clipPlane = this.mirrorPlane;

                scene.getEngine().cullBackFaces = false;

                scene._mirroredCameraPosition = Vector3.TransformCoordinates(scene.activeCamera.position, this._mirrorMatrix);
            }

            this.onAfterRender = () => {
                scene.setTransformMatrix(this._savedViewMatrix, scene.getProjectionMatrix());
                scene.getEngine().cullBackFaces = true;
                scene._mirroredCameraPosition = null;

                delete scene.clipPlane;
            }
        }

        public clone(): MirrorTexture {
            var textureSize = this.getSize();
            var newTexture = new MirrorTexture(this.name, textureSize.width, this.getScene(), this._generateMipMaps);

            // Base texture
            newTexture.hasAlpha = this.hasAlpha;
            newTexture.level = this.level;

            // Mirror Texture
            newTexture.mirrorPlane = this.mirrorPlane.clone();
            newTexture.renderList = this.renderList.slice(0);

            return newTexture;
        }

        public serialize(): any {
            if (!this.name) {
                return null;
            }

            var serializationObject = super.serialize();

            serializationObject.mirrorPlane = this.mirrorPlane.asArray();

            return serializationObject;
        }
    }

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

            this.onBeforeRender = () => {
                scene.clipPlane = this.refractionPlane;
            }

            this.onAfterRender = () => {
                delete scene.clipPlane;
            }
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