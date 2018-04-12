import { ViewerConfiguration } from './../configuration';

export let extendedDefaultConfiguration: ViewerConfiguration = {
    version: "3.2.0-alpha4",
    extends: "default",

    lights: {
        "light1": {
            type: 0,
            shadowEnabled: true,
            target: { x: -0.07100000337231904, y: -0.7150000339606777, z: -1.0 },
            position: { x: -0.78, y: 1.298, z: 1.62 },
            diffuse: { r: 1.0, g: 1.0, b: 1.0 },
            intensity: 6,
            intensityMode: 0,
            radius: 0.135,
            spotAngle: 59.9967,
            shadowConfig: {
                useBlurExponentialShadowMap: true,
                useKernelBlur: true,
                blurKernel: 64,
                blurScale: 4,
            },
            shadowBufferSize: 512,
            shadowFieldOfView: 60.977,
            shadowFrustumSize: 2.0,
            shadowMinZ: 1.0,
            shadowMaxZ: 10.0
        }
    }
}