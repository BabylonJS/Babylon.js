import { ViewerConfiguration } from './../configuration';

/**
 * Defines a default directional shadow light for normalized objects (!)
 */
export const shadowDirectionalLightConfiguration: ViewerConfiguration = {
    model: {
        receiveShadows: true,
        castShadow: true
    },
    ground: {
        receiveShadows: true
    },
    lights: {
        shadowDirectionalLight: {
            type: 1,
            shadowEnabled: true,
            target: { x: 0, y: 0, z: 0.5 },
            position: { x: 1.49, y: 2.39, z: -1.33 },
            diffuse: { r: 0.867, g: 0.816, b: 0.788 },
            intensity: 4.887,
            intensityMode: 0,
            shadowBufferSize: 1024,
            shadowFrustumSize: 6.0,
            shadowFieldOfView: 50.977,
            shadowMinZ: 0.1,
            shadowMaxZ: 10.0,
            shadowConfig: {
                blurKernel: 32,
                useBlurCloseExponentialShadowMap: true
            }
        }
    }
};

/**
 * Defines a default shadow-enabled spot light for normalized objects.
 */
export const shadowSpotlLightConfiguration: ViewerConfiguration = {
    model: {
        receiveShadows: true,
        castShadow: true
    },
    ground: {
        receiveShadows: true
    },
    lights: {
        shadowSpotLight: {
            type: 2,
            intensity: 2,
            shadowEnabled: true,
            target: { x: 0, y: 0, z: 0.5 },
            position: { x: 0, y: 3.5, z: 3.7 },
            angle: 1,
            shadowOrthoScale: 0.5,
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
};