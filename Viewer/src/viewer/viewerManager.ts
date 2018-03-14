import { Observable } from 'babylonjs';
import { AbstractViewer } from './viewer';

export class ViewerManager {

    private viewers: { [key: string]: AbstractViewer };

    public onViewerAdded: (viewer: AbstractViewer) => void;
    public onViewerAddedObservable: Observable<AbstractViewer>;
    public onViewerRemovedObservable: Observable<string>;

    constructor() {
        this.viewers = {};
        this.onViewerAddedObservable = new Observable();
        this.onViewerRemovedObservable = new Observable();
    }

    public addViewer(viewer: AbstractViewer) {
        this.viewers[viewer.getBaseId()] = viewer;
        this._onViewerAdded(viewer);
    }

    public removeViewer(viewer: AbstractViewer) {
        let id = viewer.getBaseId();
        delete this.viewers[id];
        this.onViewerRemovedObservable.notifyObservers(id);
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

    public getViewerPromiseById(id: string): Promise<AbstractViewer> {
        return new Promise((resolve, reject) => {
            let localViewer = this.getViewerById(id)
            if (localViewer) {
                return resolve(localViewer);
            }
            let viewerFunction = (viewer: AbstractViewer) => {
                if (viewer.getBaseId() === id) {
                    resolve(viewer);
                    this.onViewerAddedObservable.removeCallback(viewerFunction);
                }
            }
            this.onViewerAddedObservable.add(viewerFunction);
        });
    }

    private _onViewerAdded(viewer: AbstractViewer) {
        this.onViewerAdded && this.onViewerAdded(viewer);
        this.onViewerAddedObservable.notifyObservers(viewer);
    }
}

export let viewerManager = new ViewerManager();