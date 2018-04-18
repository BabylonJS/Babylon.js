import { ViewerConfiguration } from './../configuration';

export let extendedConfiguration: ViewerConfiguration = {
    version: "3.2.0",
    extends: "default",
    camera: {
        radius: 2,
        alpha: -1.5708,
        beta: Math.PI * 0.5 - 0.2618,
        wheelPrecision: 300,
        minZ: 0.1,
        maxZ: 50,
    },
    lights: {
        "light1": {
            type: 0,
            shadowEnabled: false,
            target: { x: 0, y: 0, z: 0 },
            position: { x: -0.78, y: 1.298, z: 1.62 },
            diffuse: { r: 1.0, g: 1.0, b: 1.0 },
            intensity: 2,
            intensityMode: 0,
            radius: 0.135,
            spotAngle: 59.9967,
        },
        "light3": {
            type: 2,
            shadowEnabled: false,
            target: { x: 0, y: 1, z: 0 },
            position: { x: -4, y: 2, z: 2.23 },
            diffuse: { r: 0.718, g: 0.772, b: 0.749 },
            intensity: 3.052,
            intensityMode: 0,
            radius: 0.5,
            spotAngle: 42.85
        }
    },
    ground: {
        receiveShadows: true
    },
    scene: {
        imageProcessingConfiguration: {
            colorCurves: {
                shadowsHue: 43.359,
                shadowsDensity: 1,
                shadowsSaturation: -25,
                shadowsExposure: -3.0,
                midtonesHue: 93.65,
                midtonesDensity: -15.24,
                midtonesExposure: 7.37,
                midtonesSaturation: -15,
                highlightsHue: 37.2,
                highlightsDensity: -22.43,
                highlightsExposure: 45.0,
                highlightsSaturation: -15,

            }
        },
        mainColor: {
            r: 0.8,
            g: 0.8,
            b: 0.8
        }
    },
    loaderPlugins: {
        extendedMaterial: true,
        minecraft: true,
        msftLod: true,
        telemetry: true
    },
    model: {
        rotationOffsetAxis: {
            x: 0,
            y: 1,
            z: 0
        },
        rotationOffsetAngle: 3.66519,
        material: {
            directEnabled: true,
            directIntensity: 0.884,
            emissiveIntensity: 1.04,
            environmentIntensity: 0.268
        },
        normalize: true,
        castShadow: true,
        receiveShadows: true
    },
    lab: {
        environmentAssetsRootURL: '/assets/environment/',
        environmentMap: {
            texture: 'EnvMap_2.0-256.env',
            rotationY: 0,
            tintLevel: 0.4
        },
        renderingPipelines: {
            default: {
                bloomEnabled: true,
                bloomThreshold: 1.0,
                fxaaEnabled: true
            }
        }
    }
}