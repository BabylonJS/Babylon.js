import { ViewerConfiguration } from './../configuration';
import { defaultTemplate, fillContainer, loadingScreen, defaultViewer, overlay, error, loading, close } from 'babylonjs-viewer-assets';

/**
 * The minimal configuration needed to make the viewer work.
 * Some functionalities might not work correctly (like fill-screen)
 */
export let minimalConfiguration: ViewerConfiguration = {
    version: "0.1",
    templates: {
        main: {
            html: defaultTemplate
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
                loadingImage: loading
            }
        },
        viewer: {
            html: defaultViewer,
        },
        overlay: {
            html: overlay,
            params: {
                closeImage: close,
                closeText: 'Close'
            }
        },
        error: {
            html: error
        }

    },
    engine: {
        antialiasing: true
    }
};