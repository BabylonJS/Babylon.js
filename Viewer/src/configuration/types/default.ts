import { ViewerConfiguration } from '../configuration';
import { babylonFont, defaultTemplate, fillContainer, loadingScreen, defaultViewer, navbar, overlay, help, share, error } from 'babylonjs-viewer-assets';
import * as images from 'babylonjs-viewer-assets';
import { renderOnlyDefaultConfiguration } from './renderOnlyDefault';
import { deepmerge } from '../../helper';

/**
 * The default configuration of the viewer, including templates (canvas, overly, loading screen)
 * This configuration doesn't hold specific parameters, and only defines objects that are needed for the viewer to fully work correctly.
 */
export let defaultConfiguration: ViewerConfiguration = deepmerge(renderOnlyDefaultConfiguration, {
    version: "3.2.0-alpha4",
    templates: {
        main: {
            html: defaultTemplate,
            params: {
                babylonFont: babylonFont,
                noEscape: true
            }
        },
        fillContainer: {
            html: fillContainer,
            params: {
                disable: false
            }
        },
        loadingScreen: {
            html: loadingScreen,
            params: {
                backgroundColor: "#000000",
                loadingImage: images.loading,
                staticLoadingImage: images.staticLoading
            }
        },
        viewer: {
            html: defaultViewer,
            params: {
                enableDragAndDrop: false
            }
        },
        navBar: {
            html: navbar,
            params: {
                speedList: {
                    "0.5x": "0.5",
                    "1.0x": "1.0",
                    "1.5x": "1.5",
                    "2.0x": "2.0",
                },
                logoImage: images.babylonLogo,
                logoText: 'BabylonJS',
                logoLink: 'https://babylonjs.com',
                hideHelp: true,
                hideHd: true,
                hideVr: true,
                hidePrint: true,
                disableOnFullscreen: false,
                text: {
                    hdButton: "Toggle HD",
                    fullscreenButton: "Toggle Fullscreen",
                    helpButton: "Help",
                    vrButton: "Toggle VR",
                    printButton: "3D Print Object"
                }
            },
            events: {
                click: {
                    '.navbar-control': true
                },
                pointerdown: {
                    '.help-button': true
                },
                input: {
                    '.progress-wrapper': true
                },
                pointerup: {
                    '.progress-wrapper': true
                }
            }
        },
        overlay: {
            html: overlay,
            params: {
                closeImage: images.close,
                closeText: 'Close'
            }
        },
        help: {
            html: help
        },
        share: {
            html: share
        },
        error: {
            html: error
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
        }
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
});
