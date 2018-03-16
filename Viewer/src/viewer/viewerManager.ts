import { Observable } from 'babylonjs';
import { AbstractViewer } from './viewer';

export class ViewerManager {

    private _viewers: { [key: string]: AbstractViewer };

    public onViewerAdded: (viewer: AbstractViewer) => void;
    public onViewerAddedObservable: Observable<AbstractViewer>;
    public onViewerRemovedObservable: Observable<string>;

    constructor() {
        this._viewers = {};
        this.onViewerAddedObservable = new Observable();
        this.onViewerRemovedObservable = new Observable();
    }

    public addViewer(viewer: AbstractViewer) {
        this._viewers[viewer.getBaseId()] = viewer;
        this._onViewerAdded(viewer);
    }

    public removeViewer(viewer: AbstractViewer) {
        let id = viewer.getBaseId();
        delete this._viewers[id];
        this.onViewerRemovedObservable.notifyObservers(id);
    }

    public getViewerById(id: string): AbstractViewer {
        return this._viewers[id];
    }

    public getViewerByHTMLElement(element: HTMLElement) {
        for (let id in this._viewers) {
            if (this._viewers[id].containerElement === element) {
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

    public dispose() {
        for (let id in this._viewers) {
            this._viewers[id].dispose();
        }
    }
}

export let viewerManager = new ViewerManager();