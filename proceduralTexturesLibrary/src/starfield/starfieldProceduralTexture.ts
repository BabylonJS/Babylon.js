import { serialize, SerializationHelper } from "babylonjs/Misc/decorators";
import { Texture } from "babylonjs/Materials/Textures/texture";
import { ProceduralTexture } from "babylonjs/Materials/Textures/Procedurals/proceduralTexture";
import { Scene } from "babylonjs/scene";
import { _TypeStore } from 'babylonjs/Misc/typeStore';

import "./starfieldProceduralTexture.fragment";

export class StarfieldProceduralTexture extends ProceduralTexture {
    private _time = 1;
    private _alpha = 0.5;
    private _beta = 0.8;
    private _zoom = 0.8;
    private _formuparam = 0.53;
    private _stepsize = 0.1;
    private _tile = 0.850;
    private _brightness = 0.0015;
    private _darkmatter = 0.400;
    private _distfading = 0.730;
    private _saturation = 0.850;

    constructor(name: string, size: number, scene: Scene, fallbackTexture?: Texture, generateMipMaps?: boolean) {
        super(name, size, "starfieldProceduralTexture", scene, fallbackTexture, generateMipMaps);
        this.updateShaderUniforms();
    }

    public updateShaderUniforms() {
        this.setFloat("time", this._time);
        this.setFloat("alpha", this._alpha);
        this.setFloat("beta", this._beta);
        this.setFloat("zoom", this._zoom);
        this.setFloat("formuparam", this._formuparam);
        this.setFloat("stepsize", this._stepsize);
        this.setFloat("tile", this._tile);
        this.setFloat("brightness", this._brightness);
        this.setFloat("darkmatter", this._darkmatter);
        this.setFloat("distfading", this._distfading);
        this.setFloat("saturation", this._saturation);
    }

    @serialize()
    public get time(): number {
        return this._time;
    }

    public set time(value: number) {
        this._time = value;
        this.updateShaderUniforms();
    }

    @serialize()
    public get alpha(): number {
        return this._alpha;
    }

    public set alpha(value: number) {
        this._alpha = value;
        this.updateShaderUniforms();
    }

    @serialize()
    public get beta(): number {
        return this._beta;
    }

    public set beta(value: number) {
        this._beta = value;
        this.updateShaderUniforms();
    }

    @serialize()
    public get formuparam(): number {
        return this._formuparam;
    }

    public set formuparam(value: number) {
        this._formuparam = value;
        this.updateShaderUniforms();
    }

    @serialize()
    public get stepsize(): number {
        return this._stepsize;
    }

    public set stepsize(value: number) {
        this._stepsize = value;
        this.updateShaderUniforms();
    }

    @serialize()
    public get zoom(): number {
        return this._zoom;
    }

    public set zoom(value: number) {
        this._zoom = value;
        this.updateShaderUniforms();
    }

    @serialize()
    public get tile(): number {
        return this._tile;
    }

    public set tile(value: number) {
        this._tile = value;
        this.updateShaderUniforms();
    }

    @serialize()
    public get brightness(): number {
        return this._brightness;
    }

    public set brightness(value: number) {
        this._brightness = value;
        this.updateShaderUniforms();
    }

    @serialize()
    public get darkmatter(): number {
        return this._darkmatter;
    }

    public set darkmatter(value: number) {
        this._darkmatter = value;
        this.updateShaderUniforms();
    }

    @serialize()
    public get distfading(): number {
        return this._distfading;
    }

    public set distfading(value: number) {
        this._distfading = value;
        this.updateShaderUniforms();
    }

    @serialize()
    public get saturation(): number {
        return this._saturation;
    }

    public set saturation(value: number) {
        this._saturation = value;
        this.updateShaderUniforms();
    }

    /**
     * Serializes this starfield procedural texture
     * @returns a serialized starfield procedural texture object
     */
    public serialize(): any {
        var serializationObject = SerializationHelper.Serialize(this, super.serialize());
        serializationObject.customType = "BABYLON.StarfieldProceduralTexture";

        return serializationObject;
    }

    /**
     * Creates a Starfield Procedural Texture from parsed startfield procedural texture data
     * @param parsedTexture defines parsed texture data
     * @param scene defines the current scene
     * @param rootUrl defines the root URL containing startfield procedural texture information
     * @returns a parsed Starfield Procedural Texture
     */
    public static Parse(parsedTexture: any, scene: Scene, rootUrl: string): StarfieldProceduralTexture {
        var texture = SerializationHelper.Parse(() => new StarfieldProceduralTexture(parsedTexture.name, parsedTexture._size, scene, undefined, parsedTexture._generateMipMaps), parsedTexture, scene, rootUrl);

        return texture;
    }
}

_TypeStore.RegisteredTypes["BABYLON.StarfieldProceduralTexture"] = StarfieldProceduralTexture;