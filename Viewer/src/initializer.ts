import { DefaultViewer } from './viewer/defaultViewer';
import { mapperManager } from './configuration/mappers';

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