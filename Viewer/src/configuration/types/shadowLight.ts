import { ViewerConfiguration } from './../configuration';

export const shadowDirectionalLightConfiguration: ViewerConfiguration = {
    lights: {
        shadowDirectionalLight: {
            type: 1,
            shadowEnabled: true,
            target: { x: 0, y: 0, z: 1 },
            position: { x: 1.49, y: 2.39, z: -1.33 },
            diffuse: { r: 0.867, g: 0.816, b: 0.788 },
            intensity: 2.887,
            intensityMode: 0,
            shadowBufferSize: 1024,
            shadowFrustumSize: 4.0,
            shadowFieldOfView: 80.977,
            shadowMinZ: 0.1,
            shadowMaxZ: 12.0,
            shadowConfig: {
                blurKernel: 32,
                useBlurExponentialShadowMap: true
            }
        }
    }
}

export const shadowSpotlLightConfiguration: ViewerConfiguration = {
    lights: {
        shadowSpotLight: {
            type: 2,
            shadowEnabled: true,
            target: { x: 0, y: 0, z: 0 },
            position: { x: 0, y: 2.1, z: 2.7 },
            angle: 1,
            shadowOrthoScale: 0.1,
            shadowBufferSize: 1024,
            shadowMinZ: 0.1,
            shadowMaxZ: 50.0,
            shadowConfig: {
                frustumEdgeFalloff: 0.5,
                blurKernel: 32,
                useBlurExponentialShadowMap: true
            }
        }
    }
}