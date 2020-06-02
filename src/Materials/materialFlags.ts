import { Engine } from "../Engines/engine";
import { Constants } from "../Engines/constants";

/**
 * This groups all the flags used to control the materials channel.
 */
export class MaterialFlags {
    // Flags used to enable or disable a type of texture for all Standard Materials
    private static _DiffuseTextureEnabled = true;
    /**
     * Are diffuse textures enabled in the application.
     */
    public static get DiffuseTextureEnabled(): boolean {
        return this._DiffuseTextureEnabled;
    }
    public static set DiffuseTextureEnabled(value: boolean) {
        if (this._DiffuseTextureEnabled === value) {
            return;
        }

        this._DiffuseTextureEnabled = value;
        Engine.MarkAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag);
    }

    private static _DetailTextureEnabled = true;
    /**
     * Are detail textures enabled in the application.
     */
    public static get DetailTextureEnabled(): boolean {
        return this._DetailTextureEnabled;
    }
    public static set DetailTextureEnabled(value: boolean) {
        if (this._DetailTextureEnabled === value) {
            return;
        }

        this._DetailTextureEnabled = value;
        Engine.MarkAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag);
    }

    private static _AmbientTextureEnabled = true;
    /**
     * Are ambient textures enabled in the application.
     */
    public static get AmbientTextureEnabled(): boolean {
        return this._AmbientTextureEnabled;
    }
    public static set AmbientTextureEnabled(value: boolean) {
        if (this._AmbientTextureEnabled === value) {
            return;
        }

        this._AmbientTextureEnabled = value;
        Engine.MarkAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag);
    }

    private static _OpacityTextureEnabled = true;
    /**
     * Are opacity textures enabled in the application.
     */
    public static get OpacityTextureEnabled(): boolean {
        return this._OpacityTextureEnabled;
    }
    public static set OpacityTextureEnabled(value: boolean) {
        if (this._OpacityTextureEnabled === value) {
            return;
        }

        this._OpacityTextureEnabled = value;
        Engine.MarkAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag);
    }

    private static _ReflectionTextureEnabled = true;
    /**
     * Are reflection textures enabled in the application.
     */
    public static get ReflectionTextureEnabled(): boolean {
        return this._ReflectionTextureEnabled;
    }
    public static set ReflectionTextureEnabled(value: boolean) {
        if (this._ReflectionTextureEnabled === value) {
            return;
        }

        this._ReflectionTextureEnabled = value;
        Engine.MarkAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag);
    }

    private static _EmissiveTextureEnabled = true;
    /**
     * Are emissive textures enabled in the application.
     */
    public static get EmissiveTextureEnabled(): boolean {
        return this._EmissiveTextureEnabled;
    }
    public static set EmissiveTextureEnabled(value: boolean) {
        if (this._EmissiveTextureEnabled === value) {
            return;
        }

        this._EmissiveTextureEnabled = value;
        Engine.MarkAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag);
    }

    private static _SpecularTextureEnabled = true;
    /**
     * Are specular textures enabled in the application.
     */
    public static get SpecularTextureEnabled(): boolean {
        return this._SpecularTextureEnabled;
    }
    public static set SpecularTextureEnabled(value: boolean) {
        if (this._SpecularTextureEnabled === value) {
            return;
        }

        this._SpecularTextureEnabled = value;
        Engine.MarkAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag);
    }

    private static _BumpTextureEnabled = true;
    /**
     * Are bump textures enabled in the application.
     */
    public static get BumpTextureEnabled(): boolean {
        return this._BumpTextureEnabled;
    }
    public static set BumpTextureEnabled(value: boolean) {
        if (this._BumpTextureEnabled === value) {
            return;
        }

        this._BumpTextureEnabled = value;
        Engine.MarkAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag);
    }

    private static _LightmapTextureEnabled = true;
    /**
     * Are lightmap textures enabled in the application.
     */
    public static get LightmapTextureEnabled(): boolean {
        return this._LightmapTextureEnabled;
    }
    public static set LightmapTextureEnabled(value: boolean) {
        if (this._LightmapTextureEnabled === value) {
            return;
        }

        this._LightmapTextureEnabled = value;
        Engine.MarkAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag);
    }

    private static _RefractionTextureEnabled = true;
    /**
     * Are refraction textures enabled in the application.
     */
    public static get RefractionTextureEnabled(): boolean {
        return this._RefractionTextureEnabled;
    }
    public static set RefractionTextureEnabled(value: boolean) {
        if (this._RefractionTextureEnabled === value) {
            return;
        }

        this._RefractionTextureEnabled = value;
        Engine.MarkAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag);
    }

    private static _ColorGradingTextureEnabled = true;
    /**
     * Are color grading textures enabled in the application.
     */
    public static get ColorGradingTextureEnabled(): boolean {
        return this._ColorGradingTextureEnabled;
    }
    public static set ColorGradingTextureEnabled(value: boolean) {
        if (this._ColorGradingTextureEnabled === value) {
            return;
        }

        this._ColorGradingTextureEnabled = value;
        Engine.MarkAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag);
    }

    private static _FresnelEnabled = true;
    /**
     * Are fresnels enabled in the application.
     */
    public static get FresnelEnabled(): boolean {
        return this._FresnelEnabled;
    }
    public static set FresnelEnabled(value: boolean) {
        if (this._FresnelEnabled === value) {
            return;
        }

        this._FresnelEnabled = value;
        Engine.MarkAllMaterialsAsDirty(Constants.MATERIAL_FresnelDirtyFlag);
    }

    private static _ClearCoatTextureEnabled = true;
    /**
     * Are clear coat textures enabled in the application.
     */
    public static get ClearCoatTextureEnabled(): boolean {
        return this._ClearCoatTextureEnabled;
    }
    public static set ClearCoatTextureEnabled(value: boolean) {
        if (this._ClearCoatTextureEnabled === value) {
            return;
        }

        this._ClearCoatTextureEnabled = value;
        Engine.MarkAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag);
    }

    private static _ClearCoatBumpTextureEnabled = true;
    /**
     * Are clear coat bump textures enabled in the application.
     */
    public static get ClearCoatBumpTextureEnabled(): boolean {
        return this._ClearCoatBumpTextureEnabled;
    }
    public static set ClearCoatBumpTextureEnabled(value: boolean) {
        if (this._ClearCoatBumpTextureEnabled === value) {
            return;
        }

        this._ClearCoatBumpTextureEnabled = value;
        Engine.MarkAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag);
    }

    private static _ClearCoatTintTextureEnabled = true;
    /**
     * Are clear coat tint textures enabled in the application.
     */
    public static get ClearCoatTintTextureEnabled(): boolean {
        return this._ClearCoatTintTextureEnabled;
    }
    public static set ClearCoatTintTextureEnabled(value: boolean) {
        if (this._ClearCoatTintTextureEnabled === value) {
            return;
        }

        this._ClearCoatTintTextureEnabled = value;
        Engine.MarkAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag);
    }

    private static _SheenTextureEnabled = true;
    /**
     * Are sheen textures enabled in the application.
     */
    public static get SheenTextureEnabled(): boolean {
        return this._SheenTextureEnabled;
    }
    public static set SheenTextureEnabled(value: boolean) {
        if (this._SheenTextureEnabled === value) {
            return;
        }

        this._SheenTextureEnabled = value;
        Engine.MarkAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag);
    }

    private static _AnisotropicTextureEnabled = true;
    /**
     * Are anisotropic textures enabled in the application.
     */
    public static get AnisotropicTextureEnabled(): boolean {
        return this._AnisotropicTextureEnabled;
    }
    public static set AnisotropicTextureEnabled(value: boolean) {
        if (this._AnisotropicTextureEnabled === value) {
            return;
        }

        this._AnisotropicTextureEnabled = value;
        Engine.MarkAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag);
    }

    private static _ThicknessTextureEnabled = true;
    /**
     * Are thickness textures enabled in the application.
     */
    public static get ThicknessTextureEnabled(): boolean {
        return this._ThicknessTextureEnabled;
    }
    public static set ThicknessTextureEnabled(value: boolean) {
        if (this._ThicknessTextureEnabled === value) {
            return;
        }

        this._ThicknessTextureEnabled = value;
        Engine.MarkAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag);
    }
}
