/** @hidden */
export class PerformanceConfigurator {
    /** @hidden */
    public static MatrixUse64Bits = false;
    /** @hidden */
    public static MatrixTrackPrecisionChange = true;
    /** @hidden */
    public static MatrixCurrentType: any = Float32Array;
    /** @hidden */
    public static MatrixTrackedMatrices: Array<any> | null = [];

    /** @hidden */
    public static SetMatrixPrecision(use64bits: boolean) {
        PerformanceConfigurator.MatrixTrackPrecisionChange = false;

        if (use64bits && !PerformanceConfigurator.MatrixUse64Bits) {
            if (PerformanceConfigurator.MatrixTrackedMatrices) {
                for (let m = 0; m < PerformanceConfigurator.MatrixTrackedMatrices.length; ++m) {
                    const matrix = PerformanceConfigurator.MatrixTrackedMatrices[m];
                    const values = matrix._m;

                    matrix._m = new Array(16);

                    for (let i = 0; i < 16; ++i) {
                        matrix._m[i] = values[i];
                    }
                }
            }
        }

        PerformanceConfigurator.MatrixUse64Bits = use64bits;
        PerformanceConfigurator.MatrixCurrentType = PerformanceConfigurator.MatrixUse64Bits ? Array : Float32Array;
        PerformanceConfigurator.MatrixTrackedMatrices = null; // reclaim some memory, as we don't need _TrackedMatrices anymore
    }
}
