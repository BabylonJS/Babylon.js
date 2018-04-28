import { ViewerConfiguration } from './../configuration';

export let defaultConfiguration: ViewerConfiguration = {
    version: "3.2.0-alpha4",
    templates: {
        main: {
            html: require("../../../assets/templates/default/defaultTemplate.html"),
            params: {
                babylonFont: require('../../../assets/babylon.woff'),
                noEscape: true
            }
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
            events: {
                pointerout: true,
                pointerdown: true,
                pointerup: true
            }
        },
        navBar: {
            html: require("../../../assets/templates/default/navbar.html"),
            params: {
                speedList: {
                    "0.5x": "0.5",
                    "1.0x": "1.0",
                    "1.5x": "1.5",
                    "2.0x": "2.0",
                },
                logoImg: require('../../../assets/img/BabylonJS_Logo_Small.png'),
                logoText: 'BabylonJS',
                hideHelp: true,
                disableOnFullscreen: true,
            },
            events: {
                pointerdown: {
                    'navbar-control': true,
                    'help-button': true
                },
                pointerover: true,
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
            autoRotate: {
                type: 0
            },
            framing: {
                type: 2,
                zoomOnBoundingInfo: true,
                zoomStopsAnimation: false
            },
            bouncing: {
                type: 1
            }
        },
        wheelPrecision: 200,
    },
    skybox: {
        /*cubeTexture: {
            url: 'https://playground.babylonjs.com/textures/environment.dds',
            gammaSpace: false
        },*/
        /*pbr: true,
        blur: 0.7,
        infiniteDistance: false,*/
        /*material: {
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
        }*/
    },
    ground: {
        receiveShadows: true
    },
    engine: {
        antialiasing: true
    },
    scene: {
        /*imageProcessingConfiguration: {
            exposure: 1.4,
            contrast: 1.66,
            toneMappingEnabled: true
        }*/
    }
}