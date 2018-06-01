/**
 * Will attach an init function the the DOMContentLoaded event.
 * The init function will be removed automatically after the event was triggered.
 */
export declare function initListeners(): void;
/**
 * Select all HTML tags on the page that match the selector and initialize a viewer
 *
 * @param selector the selector to initialize the viewer on (default is 'babylon')
 */
export declare function InitTags(selector?: string): void;
