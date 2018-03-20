import { DefaultViewer } from './viewer/defaultViewer';
import { mapperManager } from './configuration/mappers';

/**
 * Select all HTML tags on the page that match the selector and initialize a viewer
 * 
 * @param selector the selector to initialize the viewer on (default is 'babylon')
 */
export function InitTags(selector: string = 'babylon') {
    let elements = document.querySelectorAll(selector);
    for (let i = 0; i < elements.length; ++i) {
        let element: HTMLElement = <HTMLElement>elements.item(i);

        // get the html configuration
        let configMapper = mapperManager.getMapper('dom');
        let config = configMapper.map(element);

        let viewer = new DefaultViewer(element, config);
    }
}