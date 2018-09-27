import { DefaultViewer } from './viewer/defaultViewer';
import { mapperManager } from './configuration/mappers';
import { viewerGlobals } from './configuration/globals';

/**
 * Will attach an init function the the DOMContentLoaded event.
 * The init function will be removed automatically after the event was triggered.
 */
export function initListeners() {
    document.addEventListener("DOMContentLoaded", init);
    function init(event) {
        document.removeEventListener("DOMContentLoaded", init);
        if (viewerGlobals.disableInit) { return; }
        InitTags();
    }
}

/**
 * Select all HTML tags on the page that match the selector and initialize a viewer
 *
 * @param selector the selector to initialize the viewer on (default is 'babylon')
 */
export function InitTags(selector: string = 'babylon') {
    let elements = document.querySelectorAll(selector);
    for (let i = 0; i < elements.length; ++i) {
        let element = elements.item(i);

        // get the html configuration
        let configMapper = mapperManager.getMapper('dom');
        let config = configMapper.map(element);

        let viewer = new DefaultViewer(element, config);
    }
}