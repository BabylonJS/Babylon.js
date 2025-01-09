import { extendedUpgrade, extendedDegrade } from "./extended";
import type { SceneManager } from "../../managers/sceneManager";

const cache: { [key: string]: (sceneManager: SceneManager) => boolean } = {};

/**
 *
 * @param name the name of the custom optimizer configuration
 * @param upgrade set to true if you want to upgrade optimizer and false if you want to degrade
 * @returns the optimizer function
 */
export function getCustomOptimizerByName(name: string, upgrade?: boolean) {
    if (!cache[name]) {
        switch (name) {
            case "extended":
                if (upgrade) {
                    return extendedUpgrade;
                } else {
                    return extendedDegrade;
                }
        }
    }

    return cache[name];
}

export function registerCustomOptimizer(name: string, optimizer: (sceneManager: SceneManager) => boolean) {
    cache[name] = optimizer;
}
