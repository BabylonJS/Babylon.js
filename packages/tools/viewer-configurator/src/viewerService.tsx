import { type IDisposable, type IReadonlyObservable } from "core/index";
import { type ViewerElement, type ViewerOptions } from "viewer/index";

import { type IService, type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { type IShellService, ShellServiceIdentity } from "shared-ui-components/modularTool/services/shellService";
import { Observable } from "core/Misc/observable";

import { LoadModel } from "./modelLoader";
import { Viewer } from "./components/babylonViewer/viewer";

export const ViewerServiceIdentity = Symbol("ViewerService");

export interface IViewerService extends IService<typeof ViewerServiceIdentity> {
    readonly viewerElement: ViewerElement | undefined;
    readonly viewerOptions: ViewerOptions | undefined;
    readonly onStateChanged: IReadonlyObservable<void>;
}

export const ViewerServiceDefinition: ServiceDefinition<[IViewerService], [IShellService]> = {
    friendlyName: "Viewer Service",
    produces: [ViewerServiceIdentity],
    consumes: [ShellServiceIdentity],
    factory: (shellService) => {
        const onStateChanged = new Observable<void>();
        let viewerElement: ViewerElement | undefined;
        let viewerOptions: ViewerOptions | undefined;
        let dragOverHandler: ((event: DragEvent) => void) | undefined;
        let dropHandler: ((event: DragEvent) => void) | undefined;

        const setViewerElement = (element: ViewerElement) => {
            viewerElement = element;

            // Set up drag-and-drop model loading.
            dragOverHandler = (event: DragEvent) => event.preventDefault();
            dropHandler = (event: DragEvent) => {
                const files = event.dataTransfer?.files;
                if (files) {
                    event.preventDefault();
                    void LoadModel(element, files);
                }
            };
            element.addEventListener("dragover", dragOverHandler);
            element.addEventListener("drop", dropHandler);

            onStateChanged.notifyObservers();
        };

        const setViewerOptions = (options: ViewerOptions) => {
            viewerOptions = options;
            onStateChanged.notifyObservers();
        };

        const contentRegistration = shellService.addCentralContent({
            key: "Viewer",
            component: () => <Viewer onViewerCreated={setViewerElement} onOptionsLoaded={setViewerOptions} />,
        });

        return {
            get viewerElement() {
                return viewerElement;
            },
            get viewerOptions() {
                return viewerOptions;
            },
            onStateChanged,
            dispose: () => {
                if (viewerElement && dragOverHandler && dropHandler) {
                    viewerElement.removeEventListener("dragover", dragOverHandler);
                    viewerElement.removeEventListener("drop", dropHandler);
                }
                onStateChanged.clear();
                contentRegistration.dispose();
            },
        } satisfies IViewerService & IDisposable;
    },
};
