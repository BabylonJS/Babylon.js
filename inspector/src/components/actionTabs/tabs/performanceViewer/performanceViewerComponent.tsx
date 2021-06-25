import { Scene } from "babylonjs/scene";
import * as React from "react";
import { useState } from "react";
import { ButtonLineComponent } from "../../../../sharedUiComponents/lines/buttonLineComponent";
import { CanvasGraphComponent } from "../../../graph/canvasGraphComponent";
import { CanvasGraphService } from "../../../graph/canvasGraphService";
import { IPerfPoint } from "babylonjs/Misc/interfaces/iPerfViewer";
import { PopupComponent } from "../../../popupComponent";

interface IPerformanceViewerComponentProps {
    scene: Scene;
}

// aribitrary window size
const initialWindowSize = { width: 1024, height: 512 };

// Note this should be false when committed until the feature is fully working.
const isEnabled = false;

export const PerformanceViewerComponent: React.FC<IPerformanceViewerComponentProps> = (props: IPerformanceViewerComponentProps) => {
    const [isOpen, setIsOpen] = useState(false);
    // do cleanup when the window is closed
    const onClosePerformanceViewer = (window: Window | null) => {
        if (window) {
            window.close();
        }
        setIsOpen(false);
    }

    const onPerformanceButtonClick = () => {
        setIsOpen(true);
    }

    const onResize = () => {
        // do nothing for now.
    }

    const canvasServiceCallback = (canvasService: CanvasGraphService) => {
        const data: IPerfPoint[] = [];
        canvasService.datasets.push({data});
        canvasService.draw();
    };

    return (
        <>
            {
                isEnabled &&
                <ButtonLineComponent label="Open Perf Viewer" onClick={onPerformanceButtonClick} />
            }
            {
                isOpen &&
                <PopupComponent
                    id="perf-viewer"
                    title="Performance Viewer"
                    size={initialWindowSize}
                    onResize={onResize}
                    onClose={onClosePerformanceViewer}
                >
                    <div id="performance-viewer">
                        <>
                            <CanvasGraphComponent id="myChart" canvasServiceCallback={canvasServiceCallback} />
                        </>
                    </div>
                </PopupComponent>
        }
        </>
    )
}