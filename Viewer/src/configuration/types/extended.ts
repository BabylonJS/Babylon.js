import { ViewerConfiguration } from './../configuration';
import { Tools } from 'babylonjs/Misc/tools';

/**
 * The viewer's "extended" configuration.
 * This configuration defines specific objects and parameters that we think make any model look good.
 */
export let extendedConfiguration: ViewerConfiguration = {
    version: "3.2.0",
    extends: "default",
    camera: {
        exposure: 3.034578,
        fov: 0.7853981633974483,
        contrast: 1.6,
        toneMappingEnabled: true,
        upperBetaLimit: 1.3962634015954636 + Math.PI / 2,
        lowerBetaLimit: -1.4835298641951802 + Math.PI / 2,
        behaviors: {
            framing: {
                type: 2,
                mode: 0,
                positionScale: 0.5,
                defaultElevation: 0.2617993877991494,
                elevationReturnWaitTime: 3000,
                elevationReturnTime: 2000,
                framingTime: 500,
                zoomStopsAnimation: false,
                radiusScale: 0.866
            },
            autoRotate: {
                type: 0,
                idleRotationWaitTime: 4000,
                idleRotationSpeed: 0.17453292519943295,
                idleRotationSpinupTime: 2500,
                zoomStopsAnimation: false
            },
            bouncing: {
                type: 1,
                lowerRadiusTransitionRange: 0.05,
                upperRadiusTransitionRange: -0.2
            }
        },
        upperRadiusLimit: 5,
        lowerRadiusLimit: 0.5,
        frameOnModelLoad: true,
        framingElevation: 0.2617993877991494,
        framingRotation: 1.5707963267948966,
        radius: 2,
        alpha: 1.5708,
        beta: Math.PI * 0.5 - 0.2618,
        wheelPrecision: 300,
        minZ: 0.1,
        maxZ: 50,
        fovMode: 0,
        pinchPrecision: 1500,
        panningSensibility: 3000
    },
    lights: {
        light0: {
            type: 0,
            frustumEdgeFalloff: 0,
            intensity: 7,
            intensityMode: 0,
            radius: 0.6,
            range: 4.4,
            spotAngle: 60,
            diffuse: {
                r: 1,
                g: 1,
                b: 1
            },
            position: {
                x: -2,
                y: 2.5,
                z: 2
            },
            target: {
                x: 0,
                y: 0,
                z: 0
            },
            enabled: true,
            shadowEnabled: true,
            shadowBufferSize: 512,
            shadowMinZ: 1,
            shadowMaxZ: 10,
            shadowFieldOfView: 60,
            shadowFrustumSize: 2,
            shadowConfig: {
                useBlurCloseExponentialShadowMap: true,
                useKernelBlur: true,
                blurScale: 1.0,
                bias: 0.001,
                depthScale: 50 * (10 - 1),
                frustumEdgeFalloff: 0
            }
        },
        light1: {
            type: 0,
            frustumEdgeFalloff: 0,
            intensity: 7,
            intensityMode: 0,
            radius: 0.4,
            range: 5.8,
            spotAngle: 57,
            diffuse: {
                r: 1,
                g: 1,
                b: 1
            },
            position: {
                x: 4,
                y: 3,
                z: -0.5
            },
            target: {
                x: 0,
                y: 0,
                z: 0
            },
            enabled: true,
            shadowEnabled: false,
            shadowBufferSize: 512,
            shadowMinZ: 0.2,
            shadowMaxZ: 10,
            shadowFieldOfView: 28,
            shadowFrustumSize: 2
        },
        light2: {
            type: 0,
            frustumEdgeFalloff: 0,
            intensity: 1,
            intensityMode: 0,
            radius: 0.5,
            range: 6,
            spotAngle: 42.85,
            diffuse: {
                r: 0.8,
                g: 0.8,
                b: 0.8
            },
            position: {
                x: -1,
                y: 3,
                z: -3
            },
            target: {
                x: 0,
                y: 0,
                z: 0
            },
            enabled: true,
            shadowEnabled: false,
            shadowBufferSize: 512,
            shadowMinZ: 0.2,
            shadowMaxZ: 10,
            shadowFieldOfView: 45,
            shadowFrustumSize: 2
        }
    },
    ground: {
        shadowLevel: 0.9,
        texture: "Ground_2.0-1024.png",
        material: {
            primaryColorHighlightLevel: 0.035,
            primaryColorShadowLevel: 0,
            enableNoise: true,
            useRGBColor: false,
            maxSimultaneousLights: 1,
            diffuseTexture: {
                gammaSpace: true
            }
        },
        opacity: 1,
        mirror: false,
        receiveShadows: true,
        size: 5
    },
    skybox: {
        scale: 11,
        cubeTexture: {
            url: "Skybox_2.0-256.dds"
        },
        material: {
            primaryColorHighlightLevel: 0.03,
            primaryColorShadowLevel: 0.03,
            enableNoise: true,
            useRGBColor: false,
            reflectionTexture: {
                gammaSpace: true
            }
        }
    },
    engine: {
        renderInBackground: true
    },
    scene: {
        flags: {
            shadowsEnabled: true,
            particlesEnabled: false,
            collisionsEnabled: false,
            lightsEnabled: true,
            texturesEnabled: true,
            lensFlaresEnabled: false,
            proceduralTexturesEnabled: false,
            renderTargetsEnabled: true,
            spritesEnabled: false,
            skeletonsEnabled: true,
            audioEnabled: false,
        },
        defaultMaterial: {
            materialType: 'pbr',
            reflectivityColor: {
                r: 0.1,
                g: 0.1,
                b: 0.1
            },
            microSurface: 0.6
        },
        clearColor: {
            r: 0.9,
            g: 0.9,
            b: 0.9,
            a: 1.0
        },
        imageProcessingConfiguration: {
            vignetteCentreX: 0,
            vignetteCentreY: 0,
            vignetteColor: {
                r: 0.086,
                g: 0.184,
                b: 0.259,
                a: 1
            },
            vignetteWeight: 0.855,
            vignetteStretch: 0.5,
            vignetteBlendMode: 0,
            vignetteCameraFov: 0.7853981633974483,
            isEnabled: true,
            colorCurves: {
                shadowsHue: 0,
                shadowsDensity: 0,
                shadowsSaturation: 0,
                shadowsExposure: 0,
                midtonesHue: 0,
                midtonesDensity: 0,
                midtonesExposure: 0,
                midtonesSaturation: 0,
                highlightsHue: 0,
                highlightsDensity: 0,
                highlightsExposure: 0,
                highlightsSaturation: 0
            }
        },
        assetsRootURL: 'https://viewer.babylonjs.com/assets/environment/'
    },
    loaderPlugins: {
        extendedMaterial: true,
        applyMaterialConfig: true,
        msftLod: true,
        telemetry: true
    },
    model: {
        rotationOffsetAxis: {
            x: 0,
            y: -1,
            z: 0
        },
        rotationOffsetAngle: Tools.ToRadians(210),
        material: {
            directEnabled: true,
            directIntensity: 0.884,
            emissiveIntensity: 1.04,
            environmentIntensity: 0.6
        },
        entryAnimation: {
            scaling: {
                x: 0,
                y: 0,
                z: 0
            },
            time: 0.5,
            easingFunction: 4,
            easingMode: 1
        },
        exitAnimation: {
            scaling: {
                x: 0,
                y: 0,
                z: 0
            },
            time: 0.5,
            easingFunction: 4,
            easingMode: 1
        },
        normalize: true,
        castShadow: true,
        receiveShadows: true
    },
    environmentMap: {
        texture: "EnvMap_3.0-256.env",
        rotationY: 3,
        tintLevel: 0.4,
        mainColor: {
            r: 0.8823529411764706,
            g: 0.8823529411764706,
            b: 0.8823529411764706
        }
    },
    lab: {
        defaultRenderingPipelines: {
            bloomEnabled: true,
            bloomThreshold: 1.0,
            fxaaEnabled: true,
            bloomWeight: 0.05
        }
    }
};
