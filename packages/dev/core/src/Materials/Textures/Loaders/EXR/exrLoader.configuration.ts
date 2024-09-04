export enum EXROutputType {
    Float = 0,
    HalfFloat = 1,
}

/**
 * Class used to store configuration of the exr loader
 */
export class ExrLoaderGlobalConfiguration {
    /**
     * Defines the default output type to use (Half float by default)
     */
    public static DefaultOutputType: EXROutputType = EXROutputType.HalfFloat;
    /**
     * Url to use to load the fflate library (for zip decompression)
     */
    public static FFLATEUrl = "https://unpkg.com/fflate@0.8.2";
}
