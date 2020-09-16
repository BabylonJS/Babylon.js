/**
 * Manages the defines for the Material
 */
export class MaterialDefines {
    /** @hidden */
    protected _keys: string[];
    private _isDirty = true;
    /** @hidden */
    public _renderId: number;

    /** @hidden */
    public _areLightsDirty = true;
    /** @hidden */
    public _areLightsDisposed = false;
    /** @hidden */
    public _areAttributesDirty = true;
    /** @hidden */
    public _areTexturesDirty = true;
    /** @hidden */
    public _areFresnelDirty = true;
    /** @hidden */
    public _areMiscDirty = true;
    /** @hidden */
    public _areImageProcessingDirty = true;

    /** @hidden */
    public _normals = false;
    /** @hidden */
    public _uvs = false;

    /** @hidden */
    public _needNormals = false;
    /** @hidden */
    public _needUVs = false;

    [id: string]: any;

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
     * Rebuilds the material defines
     */
    public rebuild() {
        this._keys = [];

        for (var key of Object.keys(this)) {
            if (key[0] === "_") {
                continue;
            }

            this._keys.push(key);
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

        for (var index = 0; index < this._keys.length; index++) {
            var prop = this._keys[index];

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

        for (var index = 0; index < this._keys.length; index++) {
            var prop = this._keys[index];

            (<any>other)[prop] = (<any>this)[prop];
        }
    }

    /**
     * Resets the material define values
     */
    public reset(): void {
        for (var index = 0; index < this._keys.length; index++) {
            var prop = this._keys[index];
            var type = typeof (<any>this)[prop];

            switch (type) {
                case "number":
                    (<any>this)[prop] = 0;
                    break;
                case "string":
                    (<any>this)[prop] = "";
                    break;
                default:
                    (<any>this)[prop] = false;
                    break;
            }
        }
    }

    /**
     * Converts the material define values to a string
     * @returns - String of material define information
     */
    public toString(): string {
        var result = "";
        for (var index = 0; index < this._keys.length; index++) {
            var prop = this._keys[index];
            var value = (<any>this)[prop];
            var type = typeof value;

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