module BABYLON {
    export class LensFlare {
        public color: Color3;
        public texture: Nullable<Texture>;
        public alphaMode: number = Engine.ALPHA_ONEONE;

        private _system: LensFlareSystem;

        public static AddFlare(size: number, position: number, color: Color3, imgUrl: string, system: LensFlareSystem): LensFlare {
            return new LensFlare(size, position, color, imgUrl, system);
        }

        constructor(public size: number, public position: number, color: Color3, imgUrl: string, system: LensFlareSystem) {
            this.color = color || new Color3(1, 1, 1);
            this.texture = imgUrl ? new Texture(imgUrl, system.getScene(), true) : null;
            this._system = system;

            system.lensFlares.push(this);
        }

        public dispose(): void {
            if (this.texture) {
                this.texture.dispose();
            }

            // Remove from scene
            var index = this._system.lensFlares.indexOf(this);
            this._system.lensFlares.splice(index, 1);
        };
    }
} 