import { AbstractViewer } from "../../viewer/viewer";
import { extendedUpgrade, extendedDegrade } from "./extended";

const cache: { [key: string]: (viewer: AbstractViewer) => boolean } = {};

/**
 * 
 * @param name the name of the custom optimizer configuration
 * @param upgrade set to true if you want to upgrade optimizer and false if you want to degrade
 */
export function getCustomOptimizerByName(name: string, upgrade?: boolean) {
    if (!cache[name]) {
        switch (name) {
            case 'extended':
                if (upgrade) {
                    return extendedUpgrade;
                }
                else {
                    return extendedDegrade;
                }
        }
    }

    return cache[name];
}