/**
 * The render only default configuration of the viewer, including templates (canvas, overly, loading screen)
 * This configuration doesn't hold specific parameters, and only defines objects that are needed for the render only viewer viewer to fully work correctly.
 */
export let renderOnlyDefaultConfiguration = {
    version: "3.2.0-alpha4",
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
};
