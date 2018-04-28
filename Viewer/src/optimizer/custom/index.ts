import { AbstractViewer } from "../../viewer/viewer";
import { extendedUpgrade, extendedDegrade } from "./extended";

const cache: { [key: string]: (viewer: AbstractViewer) => boolean } = {};

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