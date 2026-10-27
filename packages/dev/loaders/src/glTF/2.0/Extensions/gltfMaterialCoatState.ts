import { type OpenPBRMaterial } from "core/Materials/PBR/openpbrMaterial";
import { type IAnimatable } from "core/Animations/animatable.interface";
import { type Animation } from "core/Animations/animation";
import { Observable } from "core/Misc/observable.pure";
import { type Color3 } from "core/Maths/math.color.pure";

const CoatStates = new WeakMap<OpenPBRMaterial, GLTFMaterialCoatState>();

/** Authored surface and coat properties remain animation targets after coat conversion. @internal */
export class GLTFMaterialCoatState implements IAnimatable {
    /** Animation target metadata. */
    public animations: Animation[] = [];
    /** Notifies conversions when an authored scalar changes. */
    public readonly onChangedObservable = new Observable<void>();
    /** Whether the rendered coat has been replaced by conversion. */
    public converted = false;
    private _weight: number;
    private _roughness: number;
    private _surfaceRoughness: number;
    private _surfaceIor: number;
    private _diffuseTransmissionTint?: Color3;

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
        this._material.specularRoughness = value;
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
