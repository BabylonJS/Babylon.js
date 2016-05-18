module BABYLON {
    export class RefractionPostProcess extends PostProcess {
        private _refRexture: Texture;
        constructor(name: string, refractionTextureUrl: string, public color: Color3, public depth: number, public colorLevel: number, ratio: number, camera: Camera, samplingMode?: number, engine?: Engine, reusable?: boolean) {
            super(name, "refraction", ["baseColor", "depth", "colorLevel"], ["refractionSampler"], ratio, camera, samplingMode, engine, reusable);

            this.onActivateObservable.add((cam: Camera) => {
                this._refRexture = this._refRexture || new Texture(refractionTextureUrl, cam.getScene());
            });

            this.onApplyObservable.add((effect: Effect) => {
                effect.setColor3("baseColor", this.color);
                effect.setFloat("depth", this.depth);
                effect.setFloat("colorLevel", this.colorLevel);

                effect.setTexture("refractionSampler", this._refRexture);
            });
        }

        // Methods
        public dispose(camera: Camera): void {
            if (this._refRexture) {
                this._refRexture.dispose();
            }

            super.dispose(camera);
        }
    }
}