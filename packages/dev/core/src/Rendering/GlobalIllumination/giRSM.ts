import type { ReflectiveShadowMap } from "../reflectiveShadowMap";

export class GIRSM {
    public rsm: ReflectiveShadowMap;

    public numSamples = 400;
    public radius = 0.1;
    public intensity = 0.1;
    public edgeArtifactCorrection = 0.1;
    public noiseFactor = 100;
    public rotateSample = true;
    public useFullTexture = false;

    constructor(rsm: ReflectiveShadowMap) {
        this.rsm = rsm;
    }

    public dispose() {
        this.rsm.dispose();
    }
}
