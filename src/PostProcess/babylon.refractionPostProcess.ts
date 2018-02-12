module BABYLON {
    export class RefractionPostProcess extends PostProcess {
        private _refTexture: Texture;
        private _ownRefractionTexture = true;

        public set refractionTexture(value: Texture) {
            if (this._refTexture && this._ownRefractionTexture) {
                this._refTexture.dispose();
            }

            this._refTexture = value;
            this._ownRefractionTexture = false;
        }

        constructor(name: string, refractionTextureUrl: string, public color: Color3, public depth: number, public colorLevel: number, options: number | PostProcessOptions, camera: Camera, samplingMode?: number, engine?: Engine, reusable?: boolean) {
            super(name, "refraction", ["baseColor", "depth", "colorLevel"], ["refractionSampler"], options, camera, samplingMode, engine, reusable);

            this.onActivateObservable.add((cam: Camera) => {
                this._refTexture = this._refTexture || new Texture(refractionTextureUrl, cam.getScene());
            });

            this.onApplyObservable.add((effect: Effect) => {
                effect.setColor3("baseColor", this.color);
                effect.setFloat("depth", this.depth);
                effect.setFloat("colorLevel", this.colorLevel);

                effect.setTexture("refractionSampler", this._refTexture);
            });
        }

        // Methods
        public dispose(camera: Camera): void {
            if (this._refTexture && this._ownRefractionTexture) {
                this._refTexture.dispose();
                (<any>this._refTexture) = null;
            }

            super.dispose(camera);
        }
    }
}