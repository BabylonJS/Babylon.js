import { Observable } from 'babylonjs/Misc/observable';
import { AbstractViewer } from './viewer';

/**
 * The viewer manager is the container for all viewers currently registered on this page.
 * It is possible to have more than one viewer on a single page.
 */
export class ViewerManager {

    private _viewers: { [key: string]: AbstractViewer };

    /**
     * A callback that will be triggered when a new viewer was added
     */
    public onViewerAdded: (viewer: AbstractViewer) => void;
    /**
     * Will notify when a new viewer was added
     */
    public onViewerAddedObservable: Observable<AbstractViewer>;
    /**
     * Will notify when a viewer was removed (disposed)
     */
    public onViewerRemovedObservable: Observable<string>;

    constructor() {
        this._viewers = {};
        this.onViewerAddedObservable = new Observable();
        this.onViewerRemovedObservable = new Observable();
    }

    /**
     * Adding a new viewer to the viewer manager and start tracking it.
     * @param viewer the viewer to add
     */
    public addViewer(viewer: AbstractViewer) {
        this._viewers[viewer.getBaseId()] = viewer;
        this._onViewerAdded(viewer);
    }

    /**
     * remove a viewer from the viewer manager
     * @param viewer the viewer to remove
     */
    public removeViewer(viewer: AbstractViewer) {
        let id = viewer.getBaseId();
        delete this._viewers[id];
        this.onViewerRemovedObservable.notifyObservers(id);
    }

    /**
     * Get a viewer by its baseId (if the container element has an ID, it is the this is. if not, a random id was assigned)
     * @param id the id of the HTMl element (or the viewer's, if none provided)
     */
    public getViewerById(id: string): AbstractViewer {
        return this._viewers[id];
    }

    /**
     * Get a viewer using a container element
     * @param element the HTML element to search viewers associated with
     */
    public getViewerByHTMLElement(element: HTMLElement) {
        for (let id in this._viewers) {
            if (this._viewers[id].containerElement === element) {
                return this.getViewerById(id);
            }
        }
    }

    /**
     * Get a promise that will fullfil when this viewer was initialized.
     * Since viewer initialization and template injection is asynchronous, using the promise will guaranty that
     * you will get the viewer after everything was already configured.
     * @param id the viewer id to find
     */
    public getViewerPromiseById(id: string): Promise<AbstractViewer> {
        return new Promise((resolve, reject) => {
            let localViewer = this.getViewerById(id);
            if (localViewer) {
                return resolve(localViewer);
            }
            let viewerFunction = (viewer: AbstractViewer) => {
                if (viewer.getBaseId() === id) {
                    resolve(viewer);
                    this.onViewerAddedObservable.removeCallback(viewerFunction);
                }
            };
            this.onViewerAddedObservable.add(viewerFunction);
        });
    }

    private _onViewerAdded(viewer: AbstractViewer) {
        this.onViewerAdded && this.onViewerAdded(viewer);
        this.onViewerAddedObservable.notifyObservers(viewer);
    }

    /**
     * dispose the manager and all of its associated viewers
     */
    public dispose() {
        for (let id in this._viewers) {
            this._viewers[id].dispose();
        }

        this.onViewerAddedObservable.clear();
        this.onViewerRemovedObservable.clear();
    }
}

export let viewerManager = new ViewerManager();