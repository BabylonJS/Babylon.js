import { serialize, serializeAsVector2, SerializationHelper } from "babylonjs/Misc/decorators";
import { Vector2 } from "babylonjs/Maths/math.vector";
import { Color3 } from 'babylonjs/Maths/math.color';
import { Texture } from "babylonjs/Materials/Textures/texture";
import { ProceduralTexture } from "babylonjs/Materials/Textures/Procedurals/proceduralTexture";
import { Scene } from "babylonjs/scene";
import { _TypeStore } from 'babylonjs/Misc/typeStore';

import "./fireProceduralTexture.fragment";

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
        let scene = this.getScene();
        if (this._autoGenerateTime && scene) {
            this._time += scene.getAnimationRatio() * 0.03;
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

    @serialize()
    public get autoGenerateTime(): boolean {
        return this._autoGenerateTime;
    }

    public set autoGenerateTime(value: boolean) {
        this._autoGenerateTime = value;
    }

    public get fireColors(): Color3[] {
        return this._fireColors;
    }

    public set fireColors(value: Color3[]) {
        this._fireColors = value;
        this.updateShaderUniforms();
    }

    @serialize()
    public get time(): number {
        return this._time;
    }

    public set time(value: number) {
        this._time = value;
        this.updateShaderUniforms();
    }

    @serializeAsVector2()
    public get speed(): Vector2 {
        return this._speed;
    }

    public set speed(value: Vector2) {
        this._speed = value;
        this.updateShaderUniforms();
    }

    @serialize()
    public get alphaThreshold(): number {
        return this._alphaThreshold;
    }

    public set alphaThreshold(value: number) {
        this._alphaThreshold = value;
        this.updateShaderUniforms();
    }

    /**
     * Serializes this fire procedural texture
     * @returns a serialized fire procedural texture object
     */
    public serialize(): any {
        var serializationObject = SerializationHelper.Serialize(this, super.serialize());
        serializationObject.customType = "BABYLON.FireProceduralTexture";

        serializationObject.fireColors = [];
        for (var i = 0; i < this._fireColors.length; i++) {
            serializationObject.fireColors.push(this._fireColors[i].asArray());
        }

        return serializationObject;
    }

    /**
     * Creates a Fire Procedural Texture from parsed fire procedural texture data
     * @param parsedTexture defines parsed texture data
     * @param scene defines the current scene
     * @param rootUrl defines the root URL containing fire procedural texture information
     * @returns a parsed Fire Procedural Texture
     */
    public static Parse(parsedTexture: any, scene: Scene, rootUrl: string): FireProceduralTexture {
        var texture = SerializationHelper.Parse(() => new FireProceduralTexture(parsedTexture.name, parsedTexture._size, scene, undefined, parsedTexture._generateMipMaps), parsedTexture, scene, rootUrl);

        var colors: Color3[] = [];
        for (var i = 0; i < parsedTexture.fireColors.length; i++) {
            colors.push(Color3.FromArray(parsedTexture.fireColors[i]));
        }

        texture.fireColors = colors;

        return texture;
    }
}

_TypeStore.RegisteredTypes["BABYLON.FireProceduralTexture"] = FireProceduralTexture;