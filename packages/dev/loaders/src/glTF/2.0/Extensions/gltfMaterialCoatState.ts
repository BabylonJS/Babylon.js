import { type OpenPBRMaterial } from "core/Materials/PBR/openpbrMaterial";
import { type IAnimatable } from "core/Animations/animatable.interface";
import { type Animation } from "core/Animations/animation";
import { Observable } from "core/Misc/observable.pure";
import { type Color3 } from "core/Maths/math.color.pure";
import { Constants } from "core/Engines/constants";

const CoatStates = new WeakMap<OpenPBRMaterial, GLTFMaterialCoatState>();

/** Authored surface and coat properties remain animation targets after coat conversion. @internal */
export class GLTFMaterialCoatState implements IAnimatable {
    /** Animation target metadata. */
    public animations: Animation[] = [];
    /** Notifies conversions when an authored scalar changes. */
    public readonly onChangedObservable = new Observable<void>();
    /** Whether the rendered coat has been replaced by conversion. */
    public converted = false;
    /** Whether conversion owns the rendered base roughness rather than the authored scalar. */
    public specularRoughnessIsConverted = false;
    private _weight: number;
    private _roughness: number;
    private _surfaceRoughness: number;
    private _surfaceIor: number;
    private _diffuseTransmissionTint?: Color3;
    private _attenuationDistance?: number;
    private _attenuationColor?: Color3;

    /**
     * Creates a source binding for one material.
     * @param _material The rendered material.
     */
    constructor(private readonly _material: OpenPBRMaterial) {
        this._weight = _material.coatWeight;
        this._roughness = _material.coatRoughness;
        this._surfaceRoughness = _material.specularRoughness;
        this._surfaceIor = _material.specularIor;
        _material.onDisposeObservable.addOnce(() => this.onChangedObservable.clear());
    }

    /** Authored clearcoat factor. */
    public get coatWeight(): number {
        return this.converted ? this._weight : this._material.coatWeight;
    }

    public set coatWeight(value: number) {
        if (value === this.coatWeight) {
            return;
        }
        this._weight = value;
        if (!this.converted) {
            this._material.coatWeight = value;
        }
        this.onChangedObservable.notifyObservers();
    }

    /** Authored clearcoat roughness. */
    public get coatRoughness(): number {
        return this.converted ? this._roughness : this._material.coatRoughness;
    }

    public set coatRoughness(value: number) {
        if (value === this.coatRoughness) {
            return;
        }
        this._roughness = value;
        if (!this.converted) {
            this._material.coatRoughness = value;
        }
        this.onChangedObservable.notifyObservers();
    }

    /** Authored base roughness, before diffuse transmission changes the rendered base. */
    public get specularRoughness(): number {
        return this.converted ? this._surfaceRoughness : this._material.specularRoughness;
    }

    public set specularRoughness(value: number) {
        if (value === this.specularRoughness) {
            return;
        }
        this._surfaceRoughness = value;
        if (!this.specularRoughnessIsConverted) {
            this._material.specularRoughness = value;
        }
        this.onChangedObservable.notifyObservers();
    }

    /** Authored base index of refraction. */
    public get specularIor(): number {
        return this.converted ? this._surfaceIor : this._material.specularIor;
    }

    public set specularIor(value: number) {
        if (value === this.specularIor) {
            return;
        }
        this._surfaceIor = value;
        this._material.specularIor = value;
        this.onChangedObservable.notifyObservers();
    }

    /** Authored base color, including transmission tint derived from it. */
    public get baseColor(): Color3 {
        return this._material.baseColor;
    }

    public set baseColor(value: Color3) {
        this._material.baseColor = value;
        this.updateTransmissionTint();
    }

    /** Authored attenuation distance, before the nonattenuating sentinel is translated. */
    public get transmissionDepth(): number {
        return this._attenuationDistance ?? this._material.transmissionDepth;
    }

    public set transmissionDepth(value: number) {
        if (value === this._attenuationDistance) {
            return;
        }
        this._attenuationColor ??= this._material.transmissionColor.clone();
        this._attenuationDistance = value;
        this._material.transmissionDepth = value === Number.MAX_VALUE ? 0 : value;
        this.updateTransmissionTint();
        this.onChangedObservable.notifyObservers();
    }

    /** Authored volume attenuation color, independent of surface tint. */
    public get transmissionColor(): Color3 {
        return this._attenuationColor ?? this._material.transmissionColor;
    }

    public set transmissionColor(value: Color3) {
        if (this._attenuationColor) {
            if (!this._attenuationColor.equals(value)) {
                this._attenuationColor.copyFrom(value);
                this._material.markAsDirty(Constants.MATERIAL_TextureDirtyFlag);
            }
        } else {
            this._attenuationColor = value.clone();
        }
        this._material.transmissionColor = this._attenuationColor;
        if (this._attenuationDistance !== undefined) {
            this.updateTransmissionTint();
        }
    }

    /** Selects surface tint or retained attenuation after an authored property changes. */
    public updateTransmissionTint(): void {
        const material = this._material;
        if (material.geometryThinWalled || material.transmissionDepth === 0) {
            material.transmissionColor = material.baseColor;
            material.transmissionColorTexture = material.baseColorTexture;
        } else if (this._attenuationColor) {
            material.transmissionColor = this._attenuationColor;
            material.transmissionColorTexture = null;
        }
    }

    /** Authored diffuse-transmission surface tint, separate from volumetric scattering color. */
    public get diffuseTransmissionTint(): Color3 {
        return this._diffuseTransmissionTint ?? this._material.subsurfaceColor;
    }

    public set diffuseTransmissionTint(value: Color3) {
        if (this._diffuseTransmissionTint) {
            this._diffuseTransmissionTint = value;
            if (this._material.geometryThinWalled) {
                this._material.subsurfaceColor = value;
            }
        } else {
            this._material.subsurfaceColor = value;
        }
    }

    /**
     * Retains the glTF surface tint before finalization chooses its rendered layer.
     * @param color The authored diffuse-transmission color.
     */
    public retainDiffuseTransmissionTint(color: Color3): void {
        this._diffuseTransmissionTint = color;
    }

    /** Captures the source values before converting the rendered coat. */
    public retain(): void {
        this._weight = this.coatWeight;
        this._roughness = this.coatRoughness;
        this._surfaceRoughness = this.specularRoughness;
        this._surfaceIor = this.specularIor;
        this.converted = true;
    }
}

/** @internal */
export function _GetGLTFMaterialCoatState(material: OpenPBRMaterial): GLTFMaterialCoatState {
    let state = CoatStates.get(material);
    if (!state) {
        state = new GLTFMaterialCoatState(material);
        CoatStates.set(material, state);
    }
    return state;
}
