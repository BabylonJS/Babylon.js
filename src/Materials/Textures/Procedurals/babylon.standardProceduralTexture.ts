module BABYLON {
    export class WoodProceduralTexture extends ProceduralTexture {
        private _ampScale: number = 100.0;
        private _woodColor: Color3 = new Color3(0.32, 0.17, 0.09);

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

        public get woodColor(): Color3 {
            return this._woodColor;
        }

        public set woodColor(value: Color3) {
            this._woodColor = value;
            this.updateShaderUniforms();
        }
    }

    export class FireProceduralTexture extends ProceduralTexture {
        private _time: number = 0.0;
        private _speed = new Vector2(0.5, 0.3);
        private _autoGenerateTime: boolean = true;
        private _fireColors: Color3[];
        private _alphaThreshold: number = 0.5;

        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean) {
            super(name, size, "fire", scene, fallbackTexture, generateMipMaps);
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

    export class CloudProceduralTexture extends ProceduralTexture {
        private _skyColor = new Color4(0.15, 0.68, 1.0, 1.0);
        private _cloudColor = new Color4(1, 1, 1, 1.0);

        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean) {
            super(name, size, "cloud", scene, fallbackTexture, generateMipMaps);
            this.updateShaderUniforms();
            this.refreshRate = 0;
        }

        public updateShaderUniforms() {
            this.setColor4("skyColor", this._skyColor);
            this.setColor4("cloudColor", this._cloudColor);
        }

        public get skyColor(): Color4 {
            return this._skyColor;
        }

        public set skyColor(value: Color4) {
            this._skyColor = value;
            this.updateShaderUniforms();
        }

        public get cloudColor(): Color4 {
            return this._cloudColor;
        }

        public set cloudColor(value: Color4) {
            this._cloudColor = value;
            this.updateShaderUniforms();
        }
    }

    export class GrassProceduralTexture extends ProceduralTexture {
        private _grassColors: Color3[];
        private _herb1 = new Color3(0.29, 0.38, 0.02);
        private _herb2 = new Color3(0.36, 0.49, 0.09);
        private _herb3 = new Color3(0.51, 0.6, 0.28);
        private _groundColor = new Color3(1, 1, 1);

        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean) {
            super(name, size, "grass", scene, fallbackTexture, generateMipMaps);

            this._grassColors = [
                new Color3(0.29, 0.38, 0.02),
                new Color3(0.36, 0.49, 0.09),
                new Color3(0.51, 0.6, 0.28)
            ];

            this.updateShaderUniforms();
            this.refreshRate = 0;
        }

        public updateShaderUniforms() {
            this.setColor3("herb1Color", this._grassColors[0]);
            this.setColor3("herb2Color", this._grassColors[1]);
            this.setColor3("herb3Color", this._grassColors[2]);
            this.setColor3("groundColor", this._groundColor);
        }

        public get grassColors(): Color3[] {
            return this._grassColors;
        }

        public set grassColors(value: Color3[]) {
            this._grassColors = value;
            this.updateShaderUniforms();
        }

        public get groundColor(): Color3 {
            return this._groundColor;
        }

        public set groundColor(value: Color3) {
            this.groundColor = value;
            this.updateShaderUniforms();
        }
    }

    export class RoadProceduralTexture extends ProceduralTexture {
        private _roadColor = new Color3(0.53, 0.53, 0.53);

        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean) {
            super(name, size, "road", scene, fallbackTexture, generateMipMaps);
            this.updateShaderUniforms();
            this.refreshRate = 0;
        }

        public updateShaderUniforms() {
            this.setColor3("roadColor", this._roadColor);
        }

        public get roadColor(): Color3 {
            return this._roadColor;
        }

        public set roadColor(value: Color3) {
            this._roadColor = value;
            this.updateShaderUniforms();
        }
    }

    export class BrickProceduralTexture extends ProceduralTexture {
        private _numberOfBricksHeight: number = 15;
        private _numberOfBricksWidth: number = 5;
        private _jointColor = new Color3(0.72, 0.72, 0.72);
        private _brickColor = new Color3(0.77, 0.47, 0.40);

        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean) {
            super(name, size, "brick", scene, fallbackTexture, generateMipMaps);
            this.updateShaderUniforms();
            this.refreshRate = 0;
        }

        public updateShaderUniforms() {
            this.setFloat("numberOfBricksHeight", this._numberOfBricksHeight);
            this.setFloat("numberOfBricksWidth", this._numberOfBricksWidth);
            this.setColor3("brickColor", this._brickColor);
            this.setColor3("jointColor", this._jointColor);
        }

        public get numberOfBricksHeight(): number {
            return this._numberOfBricksHeight;
        }

        public set numberOfBricksHeight(value: number) {
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

        public get jointColor(): Color3 {
            return this._jointColor;
        }

        public set jointColor(value: Color3) {
            this._jointColor = value;
            this.updateShaderUniforms();
        }

        public get brickColor(): Color3 {
            return this._brickColor;
        }

        public set brickColor(value: Color3) {
            this._brickColor = value;
            this.updateShaderUniforms();
        }
    }

    export class MarbleProceduralTexture extends ProceduralTexture {
        private _numberOfTilesHeight: number = 3;
        private _numberOfTilesWidth: number = 3;
        private _amplitude: number = 9.0;
        private _marbleColor = new Color3(0.77, 0.47, 0.40);
        private _jointColor = new Color3(0.72, 0.72, 0.72);

        constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean) {
            super(name, size, "marble", scene, fallbackTexture, generateMipMaps);
            this.updateShaderUniforms();
            this.refreshRate = 0;
        }

        public updateShaderUniforms() {
            this.setFloat("numberOfTilesHeight", this._numberOfTilesHeight);
            this.setFloat("numberOfTilesWidth", this._numberOfTilesWidth);
            this.setFloat("amplitude", this._amplitude);
            this.setColor3("marbleColor", this._marbleColor);
            this.setColor3("jointColor", this._jointColor);
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

        public get jointColor(): Color3 {
            return this._jointColor;
        }

        public set jointColor(value: Color3) {
            this._jointColor = value;
            this.updateShaderUniforms();
        }

        public get marbleColor(): Color3 {
            return this._marbleColor;
        }

        public set marbleColor(value: Color3) {
            this._marbleColor = value;
            this.updateShaderUniforms();
        }
    }
}

