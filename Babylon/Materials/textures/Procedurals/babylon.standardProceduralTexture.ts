module BABYLON {
    export class WoodProceduralTexture extends ProceduralTexture {

        private _ampScale: number = 0.03;
        private _ringScale: number = 5;
        private _woodColor1: BABYLON.Color3 = new BABYLON.Color3(0.80, 0.55, 0.01);
        private _woodColor2: BABYLON.Color3 = new BABYLON.Color3(0.60, 0.41, 0.0);

        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture,  generateMipMaps?: boolean) {
            super(name, size, "wood", scene, fallbackTexture, generateMipMaps);

            this.updateShaderUniforms();

            // Use 0 to render just once, 1 to render on every frame, 2 to render every two frames and so on...
            this.refreshRate = 0;

        }

        public updateShaderUniforms() {
            this.setFloat("ampScale", this._ampScale);
            this.setFloat("ringScale", this._ringScale);
            this.setColor3("woodColor1", this._woodColor1);
            this.setColor3("woodColor2", this._woodColor2);
        }

        public get ampScale(): number {
            return this._ampScale;
        }

        public set ampScale(value: number) {
            this._ampScale = value;
            this.updateShaderUniforms();
        }

        public get ringScale(): number {
            return this._ringScale;
        }

        public set ringScale(value: number) {
            this._ringScale = value;
            this.updateShaderUniforms();
        }

        public get woodColor1(): BABYLON.Color3 {
            return this._woodColor1;
        }

        public set woodColor1(value: BABYLON.Color3) {
            this._woodColor1 = value;
            this.updateShaderUniforms();
        }

        public get woodColor2(): BABYLON.Color3 {
            return this._woodColor2;
        }

        public set woodColor2(value: BABYLON.Color3) {
            this._woodColor2 = value;
            this.updateShaderUniforms();
        }

    }

    export class FireProceduralTexture extends ProceduralTexture {

        private _time: number = 0.0;
        private _speed: BABYLON.Vector2 = new BABYLON.Vector2(0.5, 0.3);
        private _shift: number = 1.6;
        private _alpha: number = 1.0;
        private _autoGenerateTime: boolean = true;

        private _fireColors: number[][];

        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean) {
            super(name, size, "fire", scene, fallbackTexture, generateMipMaps);

            this._fireColors = FireProceduralTexture.RedFireColors;
            this.updateShaderUniforms();

            // Use 0 to render just once, 1 to render on every frame, 2 to render every two frames and so on...
            this.refreshRate = 1;

        }

        public updateShaderUniforms() {

            this.setFloat("iGlobalTime", this._time);
            this.setVector2("speed", this._speed);
            this.setFloat("shift", this._shift);
            this.setFloat("alpha", this._alpha);

            this.setColor3("c1", new BABYLON.Color3(this._fireColors[0][0], this._fireColors[0][1], this._fireColors[0][2]));
            this.setColor3("c2", new BABYLON.Color3(this._fireColors[1][0], this._fireColors[1][1], this._fireColors[1][2]));
            this.setColor3("c3", new BABYLON.Color3(this._fireColors[2][0], this._fireColors[2][1], this._fireColors[2][2]));
            this.setColor3("c4", new BABYLON.Color3(this._fireColors[3][0], this._fireColors[3][1], this._fireColors[3][2]));
            this.setColor3("c5", new BABYLON.Color3(this._fireColors[4][0], this._fireColors[4][1], this._fireColors[4][2]));
            this.setColor3("c6", new BABYLON.Color3(this._fireColors[5][0], this._fireColors[5][1], this._fireColors[5][2]));

        }

        public render(useCameraPostProcess?: boolean) {

            if (this._autoGenerateTime) {
                this._time += this.getScene().getAnimationRatio() * 0.03;
                this.updateShaderUniforms();
            }

            super.render(useCameraPostProcess);
        }

        public static get PurpleFireColors(): number[][] {
            return [
                [0.5, 0.0, 1.0],
                [0.9, 0.0, 1.0],
                [0.2, 0.0, 1.0],
                [1.0, 0.9, 1.0],
                [0.1, 0.1, 1.0],
                [0.9, 0.9, 1.0]
            ];
        }

        public static get GreenFireColors(): number[][] {
            return [
                [0.5, 1.0, 0.0],
                [0.5, 1.0, 0.0],
                [0.3, 0.4, 0.0],
                [0.5, 1.0, 0.0],
                [0.2, 0.0, 0.0],
                [0.5, 1.0, 0.0]
            ];
        }

        public static get RedFireColors(): number[][] {
            return [
                [0.5, 0.0, 0.1],
                [0.9, 0.0, 0.0],
                [0.2, 0.0, 0.0],
                [1.0, 0.9, 0.0],
                [0.1, 0.1, 0.1],
                [0.9, 0.9, 0.9]
            ];
        }

        public static get BlueFireColors(): number[][] {
            return [
                [0.1, 0.0, 0.5],
                [0.0, 0.0, 0.5],
                [0.1, 0.0, 0.2],
                [0.0, 0.0, 1.0],
                [0.1, 0.2, 0.3],
                [0.0, 0.2, 0.9]
            ];
        }
       

        public get fireColors(): number[][] {
            return this._fireColors;
        }

        public set fireColors(value: number[][]) {
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

        public get speed(): BABYLON.Vector2 {
            return this._speed;
        }

        public set speed(value: BABYLON.Vector2) {
            this._speed = value;
            this.updateShaderUniforms();
        }

        public get shift(): number {
            return this._shift;
        }

        public set shift(value: number) {
            this._shift = value;
            this.updateShaderUniforms();
        }

        public get alpha(): number {
            return this._alpha;
        }

        public set alpha(value: number) {
            this._alpha = value;
            this.updateShaderUniforms();
        }

    }
}