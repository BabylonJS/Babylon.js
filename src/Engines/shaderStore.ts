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
}
