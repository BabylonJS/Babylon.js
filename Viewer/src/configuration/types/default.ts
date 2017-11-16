import { ViewerConfiguration } from './../configuration';

export let defaultConfiguration: ViewerConfiguration = {
    version: "0.1",
    //eventPrefix: 'babylonviewer-',
    //events: true,
    templates: {
        main: {
            html: require("../../../assets/templates/default/defaultTemplate.html")
        },
        loadingScreen: {
            html: require("../../../assets/templates/default/loadingScreen.html"),
            params: {
                backgroundColor: "#000000",
                loadingImage: require('../../../assets/img/loading.png')
            }
        },
        viewer: {
            html: require("../../../assets/templates/default/defaultViewer.html"),
        },
        navBar: {
            html: require("../../../assets/templates/default/navbar.html"),
            params: {
                buttons: {
                    /*"help-button": {
                        altText: "Help",
                        image: require('../../../assets/img/help-circle.png')
                    },*/
                    "fullscreen-button": {
                        altText: "Fullscreen",
                        image: require('../../../assets/img/fullscreen.png')
                    }
                },
                visibilityTimeout: 2000
            },
            events: {
                pointerdown: { 'fullscreen-button': true/*, '#help-button': true*/ }
            }
        },
        overlay: {
            html: require("../../../assets/templates/default/overlay.html"),
            params: {
                closeImage: require('../../../assets/img/close.png'),
                closeText: 'Close'
            }
        },
        help: {
            html: require("../../../assets/templates/default/help.html")
        },
        share: {
            html: require("../../../assets/templates/default/share.html")
        },
        error: {
            html: require("../../../assets/templates/default/error.html")
        }

    },
    camera: {
        behaviors: {
            autoRotate: 0,
            framing: {
                type: 2,
                zoomOnBoundingInfo: true,
                zoomStopsAnimation: false
            }
        }
    },
    /*lights: [
        {
            type: 1,
            shadowEnabled: true,
            direction: { x: -0.2, y: -1, z: 0 },
            position: { x: 0.017, y: 50, z: 0 },
            intensity: 4.5,
            shadowConfig: {
                useBlurExponentialShadowMap: true,
                useKernelBlur: true,
                blurKernel: 64,
                blurScale: 4
            }
        }
    ],*/
    skybox: {
        cubeTexture: {
            url: 'https://playground.babylonjs.com/textures/environment.dds',
            gammaSpace: false
        },
        pbr: true,
        blur: 0.7,
        infiniteDIstance: false,
        material: {
            imageProcessingConfiguration: {
                colorCurves: {
                    globalDensity: 89,
                    globalHue: 58.88,
                    globalSaturation: 94
                },
                colorCurvesEnabled: true,
                exposure: 1.5,
                contrast: 1.66,
                toneMappingEnabled: true,
                vignetteEnabled: true,
                vignetteWeight: 5,
                vignetteColor: { r: 0.8, g: 0.6, b: 0.4 },
                vignetteM: true
            }
        }
    },
    ground: true,
    engine: {
        antialiasing: true
    },
    scene: {
        imageProcessingConfiguration: {
            exposure: 1.4,
            contrast: 1.66,
            toneMappingEnabled: true
        }
        //autoRotate: true,
        //rotationSpeed: 0.1
    }
}