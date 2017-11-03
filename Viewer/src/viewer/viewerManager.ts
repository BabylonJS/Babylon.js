import { AbstractViewer } from './viewer';

class ViewerManager {

    private viewers: { [key: string]: AbstractViewer };

    constructor() {
        this.viewers = {};
    }

    public addViewer(viewer: AbstractViewer) {
        this.viewers[viewer.getBaseId()] = viewer;
    }

    public getViewerById(id: string): AbstractViewer {
        return this.viewers[id];
    }

    public getViewerByHTMLElement(element: HTMLElement) {
        for (let id in this.viewers) {
            if (this.viewers[id].containerElement === element) {
                return this.getViewerById(id);
            }
        }
    }
}

export let viewerManager = new ViewerManager();