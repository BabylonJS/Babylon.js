module BABYLON {
    export class LensFlare {
        public color: Color3;
        public texture: Texture;

        private _system: LensFlareSystem;

        constructor(public size: number, public position: number, color, imgUrl: string, system: LensFlareSystem) {
            this.color = color || new Color3(1, 1, 1);
            this.texture = imgUrl ? new Texture(imgUrl, system.getScene(), true) : null;
            this._system = system;

            system.lensFlares.push(this);
        }

        public dispose = function(): void {
            if (this.texture) {
                this.texture.dispose();
            }

            // Remove from scene
            var index = this._system.lensFlares.indexOf(this);
            this._system.lensFlares.splice(index, 1);
        };
    }
} 