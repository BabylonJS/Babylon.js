import { Nullable } from "../types";
import { Material } from "../Materials/material";
import { MaterialDefines } from "./materialDefines";

declare module "../Materials/material" {
    export interface Material {
        /** Gets or sets the custom material to use when generating the depth map during the shadow rendering process */
        customShadowDepthMaterial: Nullable<Material>;

        /**
         * Gets or sets the specific uniforms to inject when building the custom shadow depth effect
         * @hidden
         */
        customShadowDepthUniforms: string[];
        /**
         * Gets or sets the specific defines to inject when building the custom shadow depth effect
         * @hidden
         */
        customShadowDepthDefines: string[];
        /** @hidden */
        _customShadowDepthMaterial: Nullable<Material>;
        /** @hidden */
        _customShadowDepthOldNameResolve: Nullable<(shaderName: string, uniforms: string[], uniformBuffers: string[], samplers: string[], defines: MaterialDefines | string[], attributes?: string[]) => string>;
        /** @hidden */
        _setupCustomShadowDepthMaterial: () => void;
        /** @hidden */
        _markAllSubMeshesAsDirtyForShadowDepthMaterial: () => void;
        /** @hidden */
        _customShadowDepthDefines: string[];
        /** @hidden */
        _cachedDefinesShadow: string;
    }
}

Material.prototype._customShadowDepthMaterial = null;

Material.prototype._customShadowDepthOldNameResolve = null;

Object.defineProperty(Material.prototype, "customShadowDepthMaterial", {
    get: function(this: Material) {
        return this._customShadowDepthMaterial;
    },
    set: function(this: Material, mat: Nullable<Material>) {
        if (this._customShadowDepthMaterial !== null && this._customShadowDepthMaterial !== mat && this._customShadowDepthOldNameResolve) {
            this._customShadowDepthMaterial.customShaderNameResolve = this._customShadowDepthOldNameResolve;
        }

        this._customShadowDepthMaterial = mat;
        this._customShadowDepthOldNameResolve = null;

        if (mat !== null) {
            this._setupCustomShadowDepthMaterial();
        }

        this.customShadowDepthUniforms = [];
        this._customShadowDepthDefines = [];
    },
    enumerable: false,
    configurable: true
});

function isMaterialDefines(defines:  MaterialDefines | string[]): defines is MaterialDefines {
    return (defines as any)._keys !== undefined;
}

Material.prototype._setupCustomShadowDepthMaterial = function() {
    const mat = this._customShadowDepthMaterial;

    if (!mat) {
        return;
    }

    this._customShadowDepthOldNameResolve = mat.customShaderNameResolve?.bind(mat);

    mat.customShaderNameResolve = (shaderName: string, uniforms: string[], uniformBuffers: string[], samplers: string[], defines: MaterialDefines | string[], attributes?: string[]) => {
        if (this._customShadowDepthDefines) {
            if (!isMaterialDefines(defines)) {
                for (let i = 0; i < this._customShadowDepthDefines.length; ++i) {
                    defines.push(this._customShadowDepthDefines[i]);
                }
            } else {
                for (let i = 0; i < this._customShadowDepthDefines.length; ++i) {
                    const define = this._customShadowDepthDefines[i],
                            offset = 8,
                            spacePos = define.indexOf(" ", offset),
                            name = define.substring(offset, spacePos !== -1 ? spacePos : define.length),
                            value = spacePos === -1 ? true : define.substring(spacePos + 1);

                    if (defines[name] === undefined) {
                        (defines as any)._keys.push(name);
                    }
                    defines[name] = value;
                }
            }
        }

        if (this.customShadowDepthUniforms) {
            uniforms.push(...this.customShadowDepthUniforms);
        }

        if (this._customShadowDepthOldNameResolve) {
            shaderName = this._customShadowDepthOldNameResolve(shaderName, uniforms, uniformBuffers, samplers, defines, attributes);
        }

        return shaderName;
    };
};

Object.defineProperty(Material.prototype, "customShadowDepthDefines", {
    get: function(this: Material) {
        return this._customShadowDepthDefines;
    },
    set: function(this: Material, defines: string[]) {
        this._customShadowDepthDefines = defines;

        const join = defines.join("\n");

        if (this._customShadowDepthMaterial && join !== this._cachedDefinesShadow) {
            this._cachedDefinesShadow = join;
            this._customShadowDepthMaterial._markAllSubMeshesAsDirtyForShadowDepthMaterial();
        }
    },
    enumerable: false,
    configurable: true
});

Material.prototype._markAllSubMeshesAsDirtyForShadowDepthMaterial = function() {
    if (this.getScene().blockMaterialDirtyMechanism) {
        return;
    }

    const meshes = this.getScene().meshes;
    for (var mesh of meshes) {
        if (!mesh.subMeshes) {
            continue;
        }
        for (var subMesh of mesh.subMeshes) {
            if (subMesh.getMaterial()?.customShadowDepthMaterial !== this) {
                continue;
            }

            if (!subMesh._materialDefinesShadowDepth) {
                continue;
            }

            subMesh._materialDefinesShadowDepth.markAsUnprocessed();
        }
    }
};
