module BABYLON {
    export class WoodProceduralTexture extends ProceduralTexture {
        private _ampScale: number = 100.0;
        private _woodColor: BABYLON.Color3 = new BABYLON.Color3(0.32, 0.17, 0.09);

        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean) {
            super(name, size, "wood", scene, fallbackTexture, generateMipMaps);
            this.updateShaderUniforms();
            this.refreshRate = 0;
        }

        public updateShaderUniforms() {
            this.setFloat("ampScale", this._ampScale);
            this.setColor3("woodColor", this._woodColor);
        }

        public get ampScale(): number {
            return this._ampScale;
        }

        public set ampScale(value: number) {
            this._ampScale = value;
            this.updateShaderUniforms();
        }

        public get woodColor(): BABYLON.Color3 {
            return this._woodColor;
        }

        public set woodColor(value: BABYLON.Color3) {
            this._woodColor = value;
            this.updateShaderUniforms();
        }
    }

    export class FireProceduralTexture extends ProceduralTexture {
        private _time: number = 0.0;
        private _speed: BABYLON.Vector2 = new BABYLON.Vector2(0.5, 0.3);
        private _shift: number = 1.6;
        private _alpha: number = 0.0;
        private _autoGenerateTime: boolean = true;
        private _fireColors: BABYLON.Color3[];

        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean) {
            super(name, size, "fire", scene, fallbackTexture, generateMipMaps);
            this._fireColors = FireProceduralTexture.RedFireColors;
            this.updateShaderUniforms();
            this.refreshRate = 1;
        }

        public updateShaderUniforms() {
            this.setFloat("iGlobalTime", this._time);
            this.setVector2("speed", this._speed);
            this.setFloat("shift", this._shift);
            this.setFloat("alpha", this._alpha);
            this.setColor3("c1", this._fireColors[0]);
            this.setColor3("c2", this._fireColors[1]);
            this.setColor3("c3", this._fireColors[2]);
            this.setColor3("c4", this._fireColors[3]);
            this.setColor3("c5", this._fireColors[4]);
            this.setColor3("c6", this._fireColors[5]);
        }

        public render(useCameraPostProcess?: boolean) {
            if (this._autoGenerateTime) {
                this._time += this.getScene().getAnimationRatio() * 0.03;
                this.updateShaderUniforms();
            }
            super.render(useCameraPostProcess);
        }

        public static get PurpleFireColors(): BABYLON.Color3[] {
            return [
                new BABYLON.Color3(0.5, 0.0, 1.0),
                new BABYLON.Color3(0.9, 0.0, 1.0),
                new BABYLON.Color3(0.2, 0.0, 1.0),
                new BABYLON.Color3(1.0, 0.9, 1.0),
                new BABYLON.Color3(0.1, 0.1, 1.0),
                new BABYLON.Color3(0.9, 0.9, 1.0)
            ];
        }

        public static get GreenFireColors(): BABYLON.Color3[] {
            return [
                new BABYLON.Color3(0.5, 1.0, 0.0),
                new BABYLON.Color3(0.5, 1.0, 0.0),
                new BABYLON.Color3(0.3, 0.4, 0.0),
                new BABYLON.Color3(0.5, 1.0, 0.0),
                new BABYLON.Color3(0.2, 0.0, 0.0),
                new BABYLON.Color3(0.5, 1.0, 0.0)
            ];
        }

        public static get RedFireColors(): BABYLON.Color3[] {
            return [
                new BABYLON.Color3(0.5, 0.0, 0.1),
                new BABYLON.Color3(0.9, 0.0, 0.0),
                new BABYLON.Color3(0.2, 0.0, 0.0),
                new BABYLON.Color3(1.0, 0.9, 0.0),
                new BABYLON.Color3(0.1, 0.1, 0.1),
                new BABYLON.Color3(0.9, 0.9, 0.9)
            ];
        }

        public static get BlueFireColors(): BABYLON.Color3[] {
            return [
                new BABYLON.Color3(0.1, 0.0, 0.5),
                new BABYLON.Color3(0.0, 0.0, 0.5),
                new BABYLON.Color3(0.1, 0.0, 0.2),
                new BABYLON.Color3(0.0, 0.0, 1.0),
                new BABYLON.Color3(0.1, 0.2, 0.3),
                new BABYLON.Color3(0.0, 0.2, 0.9)
            ];
        }

        public get fireColors(): BABYLON.Color3[] {
            return this._fireColors;
        }

        public set fireColors(value: BABYLON.Color3[]) {
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

    export class CloudProceduralTexture extends ProceduralTexture {
        private _skyColor: BABYLON.Color3 = new BABYLON.Color3(0.15, 0.68, 1.0);
        private _cloudColor: BABYLON.Color3 = new BABYLON.Color3(1, 1, 1);

        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean) {
            super(name, size, "cloud", scene, fallbackTexture, generateMipMaps);
            this.updateShaderUniforms();
            this.refreshRate = 0;
        }

        public updateShaderUniforms() {
            this.setColor3("skyColor", this._skyColor);
            this.setColor3("cloudColor", this._cloudColor);
        }

        public get skyColor(): BABYLON.Color3 {
            return this._skyColor;
        }

        public set skyColor(value: BABYLON.Color3) {
            this._skyColor = value;
            this.updateShaderUniforms();
        }

        public get cloudColor(): BABYLON.Color3 {
            return this._cloudColor;
        }

        public set cloudColor(value: BABYLON.Color3) {
            this._cloudColor = value;
            this.updateShaderUniforms();
        }
    }

    export class GrassProceduralTexture extends ProceduralTexture {
        private _herb1: BABYLON.Color3 = new BABYLON.Color3(0.29, 0.38, 0.02);
        private _herb2: BABYLON.Color3 = new BABYLON.Color3(0.36, 0.49, 0.09);
        private _herb3: BABYLON.Color3 = new BABYLON.Color3(0.51, 0.6, 0.28);
        private _dirt: BABYLON.Color3 = new BABYLON.Color3(0.6, 0.46, 0.13);
        private _ground: BABYLON.Color3 = new BABYLON.Color3(1, 1, 1);

        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean) {
            super(name, size, "grass", scene, fallbackTexture, generateMipMaps);
            this.updateShaderUniforms();
            this.refreshRate = 0;
        }

        public updateShaderUniforms() {
            this.setColor3("herb1", this._herb1);
            this.setColor3("herb2", this._herb2);
            this.setColor3("herb3", this._herb2);
            this.setColor3("dirt", this._dirt);
            this.setColor3("ground", this._ground);
        }

        public get herb1(): BABYLON.Color3 {
            return this._herb1;
        }

        public set herb1(value: BABYLON.Color3) {
            this._herb1 = value;
            this.updateShaderUniforms();
        }

        public get herb2(): BABYLON.Color3 {
            return this._herb2;
        }

        public set herb2(value: BABYLON.Color3) {
            this._herb2 = value;
            this.updateShaderUniforms();
        }

        public get herb3(): BABYLON.Color3 {
            return this._herb3;
        }

        public set herb3(value: BABYLON.Color3) {
            this._herb3 = value;
            this.updateShaderUniforms();
        }

        public get dirt(): BABYLON.Color3 {
            return this._dirt;
        }

        public set dirt(value: BABYLON.Color3) {
            this._dirt = value;
            this.updateShaderUniforms();
        }

        public get ground(): BABYLON.Color3 {
            return this._ground;
        }

        public set ground(value: BABYLON.Color3) {
            this._ground = value;
            this.updateShaderUniforms();
        }
    }

    export class RoadProceduralTexture extends ProceduralTexture {
        private _macadamColor: BABYLON.Color3 = new BABYLON.Color3(0.53, 0.53, 0.53);

        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean) {
            super(name, size, "road", scene, fallbackTexture, generateMipMaps);
            this.updateShaderUniforms();
            this.refreshRate = 0;
        }

        public updateShaderUniforms() {
            this.setColor3("macadamColor", this._macadamColor);
        }

        public get macadamColor(): BABYLON.Color3 {
            return this._macadamColor;
        }

        public set macadamColor(value: BABYLON.Color3) {
            this._macadamColor = value;
            this.updateShaderUniforms();
        }
    }

    export class BrickProceduralTexture extends ProceduralTexture {
        private _numberOfBricksHeight: number = 15;
        private _numberOfBricksWidth: number = 5;
        private _jointColor: BABYLON.Color3 = new BABYLON.Color3(0.72, 0.72, 0.72);
        private _brickColor: BABYLON.Color3 = new BABYLON.Color3(0.77, 0.47, 0.40);

        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean) {
            super(name, size, "brick", scene, fallbackTexture, generateMipMaps);
            this.updateShaderUniforms();
            this.refreshRate = 0;
        }

        public updateShaderUniforms() {
            this.setFloat("numberOfBricksHeight", this._numberOfBricksHeight);
            this.setFloat("numberOfBricksWidth", this._numberOfBricksWidth);
            this.setColor3("brick", this._brickColor);
            this.setColor3("joint", this._jointColor);
        }

        public get numberOfBricksHeight(): number {
            return this._numberOfBricksHeight;
        }

        public set cloudColor(value: number) {
            this._numberOfBricksHeight = value;
            this.updateShaderUniforms();
        }

        public get numberOfBricksWidth(): number {
            return this._numberOfBricksWidth;
        }

        public set numberOfBricksWidth(value: number) {
            this._numberOfBricksHeight = value;
            this.updateShaderUniforms();
        }

        public get jointColor(): BABYLON.Color3 {
            return this._jointColor;
        }

        public set jointColor(value: BABYLON.Color3) {
            this._jointColor = value;
            this.updateShaderUniforms();
        }

        public get brickColor(): BABYLON.Color3 {
            return this._brickColor;
        }

        public set brickColor(value: BABYLON.Color3) {
            this._brickColor = value;
            this.updateShaderUniforms();
        }
    }

    export class MarbleProceduralTexture extends ProceduralTexture {
        private _numberOfTilesHeight: number = 3;
        private _numberOfTilesWidth: number = 3;
        private _amplitude: number = 9.0;
        private _marbleColor: BABYLON.Color3 = new BABYLON.Color3(0.77, 0.47, 0.40);
        private _jointColor: BABYLON.Color3 = new BABYLON.Color3(0.72, 0.72, 0.72);

        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean) {
            super(name, size, "marble", scene, fallbackTexture, generateMipMaps);
            this.updateShaderUniforms();
            this.refreshRate = 0;
        }

        public updateShaderUniforms() {
            this.setFloat("numberOfBricksHeight", this._numberOfTilesHeight);
            this.setFloat("numberOfBricksWidth", this._numberOfTilesWidth);
            this.setFloat("amplitude", this._amplitude);
            this.setColor3("brick", this._marbleColor);
            this.setColor3("joint", this._jointColor);
        }

        public get numberOfTilesHeight(): number {
            return this._numberOfTilesHeight;
        }

        public set numberOfTilesHeight(value: number) {
            this._numberOfTilesHeight = value;
            this.updateShaderUniforms();
        }

        public get numberOfTilesWidth(): number {
            return this._numberOfTilesWidth;
        }

        public set numberOfTilesWidth(value: number) {
            this._numberOfTilesWidth = value;
            this.updateShaderUniforms();
        }

        public get jointColor(): BABYLON.Color3 {
            return this._jointColor;
        }

        public set jointColor(value: BABYLON.Color3) {
            this._jointColor = value;
            this.updateShaderUniforms();
        }

        public get marbleColor(): BABYLON.Color3 {
            return this._marbleColor;
        }

        public set marbleColor(value: BABYLON.Color3) {
            this._marbleColor = value;
            this.updateShaderUniforms();
        }
    }
}