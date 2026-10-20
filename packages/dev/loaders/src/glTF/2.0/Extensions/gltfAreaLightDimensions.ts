import { type IAnimatable } from "core/Animations/animatable.interface";
import { type Animation } from "core/Animations/animation.pure";
import { type RectAreaLight } from "core/Lights/rectAreaLight.pure";
import { type IEXTLightsArea_Light } from "../glTFLoaderInterfaces";

class GLTFAreaLightDimensions implements IAnimatable {
    /** Animations operating on the semantic dimensions. */
    public animations: Animation[] = [];
    private _aspect: number;
    private readonly _sizeScale: number;

    constructor(
        private readonly _light: RectAreaLight,
        source: IEXTLightsArea_Light
    ) {
        this._aspect = _light.height === 0 ? (source.rect?.aspect ?? 1) : _light.width / _light.height;
        this._sizeScale = source.type === "disk" ? Math.sqrt(Math.PI) / 2 : 1;
    }

    /** glTF size, independent of the disk's equal-area rectangle conversion. */
    public get size(): number {
        return this._light.height / this._sizeScale;
    }

    public set size(value: number) {
        const aspect = this.aspect;
        this._light.height = value * this._sizeScale;
        this._light.width = this._light.height * aspect;
    }

    /** The shape survives zero dimensions and tracks positive runtime dimensions. */
    public get aspect(): number {
        if (this._light.height !== 0) {
            this._aspect = this._light.width / this._light.height;
        }
        return this._aspect;
    }

    public set aspect(value: number) {
        this._aspect = value;
        this._light.width = this._light.height * value;
    }
}

const DimensionTargets = /*#__PURE__*/ new WeakMap<RectAreaLight, GLTFAreaLightDimensions>();

/**
 * Gets the shared loader-local animation target for semantic area-light dimensions.
 * @param source glTF area-light record containing its loaded Babylon light
 * @returns the size/aspect target, or undefined when the light was not loaded
 * @internal
 */
export function _GetAreaLightDimensions(source: IEXTLightsArea_Light): GLTFAreaLightDimensions | undefined {
    const light = source._babylonLight as RectAreaLight | undefined;
    if (!light) {
        return undefined;
    }
    let target = DimensionTargets.get(light);
    if (!target) {
        target = new GLTFAreaLightDimensions(light, source);
        DimensionTargets.set(light, target);
    }
    return target;
}
