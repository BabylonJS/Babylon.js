/**
 * Manages the defines for the Material
 */
export class MaterialDefines {
    /** @internal */
    protected _keys: string[] = [];
    private _isDirty = true;
    /** @internal */
    public _renderId: number;

    /** @internal */
    public _areLightsDirty = true;
    /** @internal */
    public _areLightsDisposed = false;
    /** @internal */
    public _areAttributesDirty = true;
    /** @internal */
    public _areTexturesDirty = true;
    /** @internal */
    public _areFresnelDirty = true;
    /** @internal */
    public _areMiscDirty = true;
    /** @internal */
    public _arePrePassDirty = true;
    /** @internal */
    public _areImageProcessingDirty = true;

    /** @internal */
    public _normals = false;
    /** @internal */
    public _uvs = false;

    /** @internal */
    public _needNormals = false;
    /** @internal */
    public _needUVs = false;

    protected _externalProperties?: { [name: string]: { type: string; default: any } };

    [id: string]: any;

    /**
     * Creates a new instance
     * @param externalProperties list of external properties to inject into the object
     */
    constructor(externalProperties?: { [name: string]: { type: string; default: any } }) {
        this._externalProperties = externalProperties;

        // Initialize External Properties
        if (externalProperties) {
            for (const prop in externalProperties) {
                if (Object.prototype.hasOwnProperty.call(externalProperties, prop)) {
                    this._setDefaultValue(prop);
                }
            }
        }
    }

    /**
     * Specifies if the material needs to be re-calculated
     */
    public get isDirty(): boolean {
        return this._isDirty;
    }

    /**
     * Marks the material to indicate that it has been re-calculated
     */
    public markAsProcessed() {
        this._isDirty = false;
        this._areAttributesDirty = false;
        this._areTexturesDirty = false;
        this._areFresnelDirty = false;
        this._areLightsDirty = false;
        this._areLightsDisposed = false;
        this._areMiscDirty = false;
        this._arePrePassDirty = false;
        this._areImageProcessingDirty = false;
    }

    /**
     * Marks the material to indicate that it needs to be re-calculated
     */
    public markAsUnprocessed() {
        this._isDirty = true;
    }

    /**
     * Marks the material to indicate all of its defines need to be re-calculated
     */
    public markAllAsDirty() {
        this._areTexturesDirty = true;
        this._areAttributesDirty = true;
        this._areLightsDirty = true;
        this._areFresnelDirty = true;
        this._areMiscDirty = true;
        this._arePrePassDirty = true;
        this._areImageProcessingDirty = true;
        this._isDirty = true;
    }

    /**
     * Marks the material to indicate that image processing needs to be re-calculated
     */
    public markAsImageProcessingDirty() {
        this._areImageProcessingDirty = true;
        this._isDirty = true;
    }

    /**
     * Marks the material to indicate the lights need to be re-calculated
     * @param disposed Defines whether the light is dirty due to dispose or not
     */
    public markAsLightDirty(disposed = false) {
        this._areLightsDirty = true;
        this._areLightsDisposed = this._areLightsDisposed || disposed;
        this._isDirty = true;
    }

    /**
     * Marks the attribute state as changed
     */
    public markAsAttributesDirty() {
        this._areAttributesDirty = true;
        this._isDirty = true;
    }

    /**
     * Marks the texture state as changed
     */
    public markAsTexturesDirty() {
        this._areTexturesDirty = true;
        this._isDirty = true;
    }

    /**
     * Marks the fresnel state as changed
     */
    public markAsFresnelDirty() {
        this._areFresnelDirty = true;
        this._isDirty = true;
    }

    /**
     * Marks the misc state as changed
     */
    public markAsMiscDirty() {
        this._areMiscDirty = true;
        this._isDirty = true;
    }

    /**
     * Marks the prepass state as changed
     */
    public markAsPrePassDirty() {
        this._arePrePassDirty = true;
        this._isDirty = true;
    }

    /**
     * Rebuilds the material defines
     */
    public rebuild() {
        this._keys.length = 0;

        for (const key of Object.keys(this)) {
            if (key[0] === "_") {
                continue;
            }

            this._keys.push(key);
        }

        if (this._externalProperties) {
            for (const name in this._externalProperties) {
                if (this._keys.indexOf(name) === -1) {
                    this._keys.push(name);
                }
            }
        }
    }

    /**
     * Specifies if two material defines are equal
     * @param other - A material define instance to compare to
     * @returns - Boolean indicating if the material defines are equal (true) or not (false)
     */
    public isEqual(other: MaterialDefines): boolean {
        if (this._keys.length !== other._keys.length) {
            return false;
        }

        for (let index = 0; index < this._keys.length; index++) {
            const prop = this._keys[index];

            if ((<any>this)[prop] !== (<any>other)[prop]) {
                return false;
            }
        }

        return true;
    }

    /**
     * Clones this instance's defines to another instance
     * @param other - material defines to clone values to
     */
    public cloneTo(other: MaterialDefines): void {
        if (this._keys.length !== other._keys.length) {
            other._keys = this._keys.slice(0);
        }

        for (let index = 0; index < this._keys.length; index++) {
            const prop = this._keys[index];

            (<any>other)[prop] = (<any>this)[prop];
        }
    }

    /**
     * Resets the material define values
     */
    public reset(): void {
        for (const prop of this._keys) {
            this._setDefaultValue(prop);
        }
    }

    private _setDefaultValue(prop: string): void {
        const type = this._externalProperties?.[prop]?.type ?? typeof (<any>this)[prop];
        const defValue = this._externalProperties?.[prop]?.default;

        switch (type) {
            case "number":
                (<any>this)[prop] = defValue ?? 0;
                break;
            case "string":
                (<any>this)[prop] = defValue ?? "";
                break;
            default:
                (<any>this)[prop] = defValue ?? false;
                break;
        }
    }

    /**
     * Converts the material define values to a string
     * @returns - String of material define information
     */
    public toString(): string {
        let result = "";
        for (let index = 0; index < this._keys.length; index++) {
            const prop = this._keys[index];
            const value = (<any>this)[prop];
            const type = typeof value;

            switch (type) {
                case "number":
                case "string":
                    result += "#define " + prop + " " + value + "\n";
                    break;
                default:
                    if (value) {
                        result += "#define " + prop + "\n";
                    }
                    break;
            }
        }

        return result;
    }
}
