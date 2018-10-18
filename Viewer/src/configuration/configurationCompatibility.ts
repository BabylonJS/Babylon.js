import { ViewerConfiguration, getConfigurationKey } from './configuration';
/**
 * This function will make sure the configuration file is taking deprecated fields into account
 * and is setting them to the correct keys and values.
 *
 * @param configuration The configuration to process. Mutable!
 */
export function processConfigurationCompatibility(configuration: ViewerConfiguration) {

    if (configuration.camera) {
        // camera contrast -> image processing contrast
        if (configuration.camera.contrast !== undefined) {
            setKeyInObject(configuration, "scene.imageProcessingConfiguration.contrast", configuration.camera.contrast);
        }

        // camera exposure -> image processing exposure
        if (configuration.camera.exposure !== undefined) {
            setKeyInObject(configuration, "scene.imageProcessingConfiguration.exposure", configuration.camera.exposure);
        }
    }

    if (configuration.scene) {
        //glow
        if (configuration.scene.glow) {
            setKeyInObject(configuration, "lab.defaultRenderingPipelines.glowLayerEnabled", true);
            let enabledProcessing = getConfigurationKey("scene.imageProcessingConfiguration.isEnabled", configuration);
            if (enabledProcessing !== false) {
                setKeyInObject(configuration, "scene.imageProcessingConfiguration.isEnabled", true);
            }
        }

        if (configuration.scene.mainColor) {
            setKeyInObject(configuration, "environmentMap.mainColor", configuration.scene.mainColor, true);
        }
    }

    if (configuration.model && typeof configuration.model === 'object') {
        // castShadows === castShadow
        if ((<any>configuration.model).castShadows !== undefined && configuration.model.castShadow === undefined) {
            configuration.model.castShadow = (<any>configuration.model).castShadows;
        }
    }

    if (configuration.lab) {
        if (configuration.lab.assetsRootURL) {
            setKeyInObject(configuration, "scene.assetsRootURL", configuration.lab.assetsRootURL, true);
        }
        if (configuration.lab.environmentMap) {
            setKeyInObject(configuration, "environmentMap", configuration.lab.environmentMap, true);
        }
    }
}

function setKeyInObject(object: any, keys: string, value: any, shouldOverwrite?: boolean) {
    let keySplit = keys.split(".");
    if (keySplit.length === 0) { return; }
    let lastKey = keySplit.pop();
    if (!lastKey) { return; }
    let curObj = object;
    keySplit.forEach((key) => {
        curObj[key] = curObj[key] || {};
        curObj = curObj[key];
    });
    if (curObj[lastKey] !== undefined && !shouldOverwrite) { return; }
    curObj[lastKey] = value;
}
