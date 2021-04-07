import { Constants } from "../Engines/constants";
import { SerializationHelper, serialize } from "../Misc/decorators";
import { IStencilState } from "../States/IStencilState";

declare type Scene = import("../scene").Scene;

export class MaterialStencilStates implements IStencilState {

    public constructor() {
        this.reset();
    }

    public reset() {
        this.enabled = false;
        this.mask = 0xFF;

        this.func = Constants.ALWAYS;
        this.funcRef = 1;
        this.funcMask = 0xFF;

        this.opStencilFail = Constants.KEEP;
        this.opDepthFail = Constants.KEEP;
        this.opStencilDepthPass = Constants.REPLACE;
    }

    private _func: number;
    @serialize()
    public get func(): number {
        return this._func;
    }

    public set func(value: number) {
        this._func = value;
    }

    private _funcRef: number;
    @serialize()
    public get funcRef(): number {
        return this._funcRef;
    }

    public set funcRef(value: number) {
        this._funcRef = value;
    }

    private _funcMask: number;
    @serialize()
    public get funcMask(): number {
        return this._funcMask;
    }

    public set funcMask(value: number) {
        this._funcMask = value;
    }

    private _opStencilFail: number;
    @serialize()
    public get opStencilFail(): number {
        return this._opStencilFail;
    }

    public set opStencilFail(value: number) {
        this._opStencilFail = value;
    }

    private _opDepthFail: number;
    @serialize()
    public get opDepthFail(): number {
        return this._opDepthFail;
    }

    public set opDepthFail(value: number) {
        this._opDepthFail = value;
    }

    private _opStencilDepthPass: number;
    @serialize()
    public get opStencilDepthPass(): number {
        return this._opStencilDepthPass;
    }

    public set opStencilDepthPass(value: number) {
        this._opStencilDepthPass = value;
    }

    private _mask: number;
    @serialize()
    public get mask(): number {
        return this._mask;
    }

    public set mask(value: number) {
        this._mask = value;
    }

    private _enabled: boolean;
    @serialize()
    public get enabled(): boolean {
        return this._enabled;
    }

    public set enabled(value: boolean) {
        this._enabled = value;
    }

    /**
    * Get the current class name, useful for serialization or dynamic coding.
    * @returns "MaterialStencilStates"
    */
     public getClassName(): string {
        return "MaterialStencilStates";
    }

    /**
     * Makes a duplicate of the current configuration into another one.
     * @param clearCoatConfiguration define the config where to copy the info
     */
     public copyTo(stencilStates: MaterialStencilStates): void {
        SerializationHelper.Clone(() => stencilStates, this);
    }

    /**
     * Serializes this clear coat configuration.
     * @returns - An object with the serialized config.
     */
    public serialize(): any {
        return SerializationHelper.Serialize(this);
    }

    /**
     * Parses a anisotropy Configuration from a serialized object.
     * @param source - Serialized object.
     * @param scene Defines the scene we are parsing for
     * @param rootUrl Defines the rootUrl to load from
     */
    public parse(source: any, scene: Scene, rootUrl: string): void {
        SerializationHelper.Parse(() => this, source, scene, rootUrl);
    }
}
