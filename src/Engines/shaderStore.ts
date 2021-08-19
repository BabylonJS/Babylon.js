import { ShaderLanguage } from "./Processors/shaderProcessingOptions";

/**
 * Defines the shader related stores and directory
 */
export class ShaderStore {
    /**
     * Gets or sets the relative url used to load shaders if using the engine in non-minified mode
     */
    public static ShadersRepository = "src/Shaders/";
    /**
    * Store of each shader (The can be looked up using effect.key)
    */
    public static ShadersStore: { [key: string]: string } = {};
    /**
     * Store of each included file for a shader (The can be looked up using effect.key)
     */
    public static IncludesShadersStore: { [key: string]: string } = {};

    /**
     * Gets or sets the relative url used to load shaders (WGSL) if using the engine in non-minified mode
     */
    public static ShadersRepositoryWGSL = "src/ShadersWGSL/";
    /**
     * Store of each shader  (WGSL)
     */
    public static ShadersStoreWGSL: { [key: string]: string } = {};
    /**
     * Store of each included file for a shader (WGSL)
     */
    public static IncludesShadersStoreWGSL: { [key: string]: string } = {};
 
    /**
     * Gets the shaders repository path for a given shader language
     * @param shaderLanguage the shader language
     * @returns the path to the shaders repository
     */
    public static GetShadersRepository(shaderLanguage = ShaderLanguage.GLSL): string {
        return shaderLanguage === ShaderLanguage.GLSL ? ShaderStore.ShadersRepository : ShaderStore.ShadersRepositoryWGSL;
    }

    /**
     * Gets the shaders store of a given shader language
     * @param shaderLanguage the shader language
     * @returns the shaders store
     */
    public static GetShadersStore(shaderLanguage = ShaderLanguage.GLSL): { [key: string]: string } {
        return shaderLanguage === ShaderLanguage.GLSL ? ShaderStore.ShadersStore : ShaderStore.ShadersStoreWGSL;
    }

    /**
     * Gets the include shaders store of a given shader language
     * @param shaderLanguage the shader language
     * @returns the include shaders store
     */
    public static GetIncludesShadersStore(shaderLanguage = ShaderLanguage.GLSL): { [key: string]: string } {
        return shaderLanguage === ShaderLanguage.GLSL ? ShaderStore.IncludesShadersStore : ShaderStore.IncludesShadersStoreWGSL;
    }
}
