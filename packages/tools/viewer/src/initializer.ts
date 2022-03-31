import { DefaultViewer } from "./viewer/defaultViewer";
import { mapperManager } from "./configuration/mappers";
import { viewerGlobals } from "./configuration/globals";

/**
 * Will attach an init function the the DOMContentLoaded event.
 * The init function will be removed automatically after the event was triggered.
 */
export function initListeners() {
    document.addEventListener("DOMContentLoaded", init);
    function init() {
        document.removeEventListener("DOMContentLoaded", init);
        if (viewerGlobals.disableInit) {
            return;
        }
        InitTags();
    }
}

/**
 * Select all HTML tags on the page that match the selector and initialize a viewer
 *
 * @param selector the selector to initialize the viewer on (default is 'babylon')
 */
export function InitTags(selector: string = "babylon") {
    const elements = document.querySelectorAll(selector);
    for (let i = 0; i < elements.length; ++i) {
        const element = elements.item(i);

        // get the html configuration
        const configMapper = mapperManager.getMapper("dom");
        const config = configMapper.map(element);

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        new DefaultViewer(element, config);
    }
}
