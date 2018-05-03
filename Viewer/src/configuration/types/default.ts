import { ViewerConfiguration } from './../configuration';

/**
 * The default configuration of the viewer, including templates (canvas, overly, loading screen)
 * This configuration doesn't hold specific parameters, and only defines objects that are needed for the viewer to fully work correctly.
 */
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
        fillContainer: {
            html: require("../../../assets/templates/default/fillContainer.html"),
            params: {
                disable: false
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
            html: require("../../../assets/templates/default/defaultViewer.html")
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
                logoImage: require('../../../assets/img/BabylonJS_Logo_Small.png'),
                logoText: 'BabylonJS',
                logoLink: 'https://babylonjs.com',
                hideHelp: true,
                disableOnFullscreen: true,
            },
            events: {
                pointerdown: {
                    'navbar-control': true,
                    'help-button': true
                },
                input: {
                    'progress-wrapper': true
                },
                pointerup: {
                    'progress-wrapper': true
                }
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
    },
    ground: {
        receiveShadows: true
    },
    engine: {
        antialiasing: true
    },
    scene: {
    }
}