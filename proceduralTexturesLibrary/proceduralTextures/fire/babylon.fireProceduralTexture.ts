/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON {
 export class FireProceduralTexture extends ProceduralTexture {
        private _time: number = 0.0;
        private _speed = new Vector2(0.5, 0.3);
        private _autoGenerateTime: boolean = true;
        private _fireColors: Color3[];
        private _alphaThreshold: number = 0.5;

        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean) {
            super(name, size, "fireProceduralTexture", scene, fallbackTexture, generateMipMaps);
            this._fireColors = FireProceduralTexture.RedFireColors;
            this.updateShaderUniforms();
            this.refreshRate = 1;
        }

        public updateShaderUniforms() {
            this.setFloat("time", this._time);
            this.setVector2("speed", this._speed);
            this.setColor3("c1", this._fireColors[0]);
            this.setColor3("c2", this._fireColors[1]);
            this.setColor3("c3", this._fireColors[2]);
            this.setColor3("c4", this._fireColors[3]);
            this.setColor3("c5", this._fireColors[4]);
            this.setColor3("c6", this._fireColors[5]);
            this.setFloat("alphaThreshold", this._alphaThreshold);
        }

        public render(useCameraPostProcess?: boolean) {
            if (this._autoGenerateTime) {
                this._time += this.getScene().getAnimationRatio() * 0.03;
                this.updateShaderUniforms();
            }
            super.render(useCameraPostProcess);
        }

        public static get PurpleFireColors(): Color3[] {
            return [
                new Color3(0.5, 0.0, 1.0),
                new Color3(0.9, 0.0, 1.0),
                new Color3(0.2, 0.0, 1.0),
                new Color3(1.0, 0.9, 1.0),
                new Color3(0.1, 0.1, 1.0),
                new Color3(0.9, 0.9, 1.0)
            ];
        }

        public static get GreenFireColors(): Color3[] {
            return [
                new Color3(0.5, 1.0, 0.0),
                new Color3(0.5, 1.0, 0.0),
                new Color3(0.3, 0.4, 0.0),
                new Color3(0.5, 1.0, 0.0),
                new Color3(0.2, 0.0, 0.0),
                new Color3(0.5, 1.0, 0.0)
            ];
        }

        public static get RedFireColors(): Color3[] {
            return [
                new Color3(0.5, 0.0, 0.1),
                new Color3(0.9, 0.0, 0.0),
                new Color3(0.2, 0.0, 0.0),
                new Color3(1.0, 0.9, 0.0),
                new Color3(0.1, 0.1, 0.1),
                new Color3(0.9, 0.9, 0.9)
            ];
        }

        public static get BlueFireColors(): Color3[] {
            return [
                new Color3(0.1, 0.0, 0.5),
                new Color3(0.0, 0.0, 0.5),
                new Color3(0.1, 0.0, 0.2),
                new Color3(0.0, 0.0, 1.0),
                new Color3(0.1, 0.2, 0.3),
                new Color3(0.0, 0.2, 0.9)
            ];
        }

        public get fireColors(): Color3[] {
            return this._fireColors;
        }

        public set fireColors(value: Color3[]) {
            this._fireColors = value;
            this.updateShaderUniforms();
        }

        public get time(): number {
            return this._time;
        }

        public set time(value: number) {
            this._time = value;
            this.updateShaderUniforms();
        }

        public get speed(): Vector2 {
            return this._speed;
        }

        public set speed(value: Vector2) {
            this._speed = value;
            this.updateShaderUniforms();
        }

        public get alphaThreshold(): number {
            return this._alphaThreshold;
        }

        public set alphaThreshold(value: number) {
            this._alphaThreshold = value;
            this.updateShaderUniforms();
        }
    }
}