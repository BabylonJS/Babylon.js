import { ViewerConfiguration } from './../configuration';

/**
 * The minimal configuration needed to make the viewer work.
 * Some functionalities might not work correctly (like fill-screen)
 */
export let minimalConfiguration: ViewerConfiguration = {
    version: "0.1",
    templates: {
        main: {
            html: require("../../../assets/templates/default/defaultTemplate.html")
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
            html: require("../../../assets/templates/default/defaultViewer.html"),
        },
        overlay: {
            html: require("../../../assets/templates/default/overlay.html"),
            params: {
                closeImage: require('../../../assets/img/close.png'),
                closeText: 'Close'
            }
        },
        error: {
            html: require("../../../assets/templates/default/error.html")
        }

    },
    engine: {
        antialiasing: true
    }
}