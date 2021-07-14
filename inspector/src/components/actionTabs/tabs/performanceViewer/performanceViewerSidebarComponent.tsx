import { Color3, Observable } from 'babylonjs';
import { IPerfDataset } from 'babylonjs/Misc/interfaces/iPerfViewer';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { ColorPickerLineComponent } from '../../../../sharedUiComponents/lines/colorPickerComponent';

interface IPerformanceViewerSidebarComponentProps {
    datasetObservable: Observable<IPerfDataset[]>
    onToggleVisibility: (id: string, value: boolean) => void;
    onColorChanged: (id: string, value: string) => void;
}

export const PerformanceViewerSidebarComponent = (props: IPerformanceViewerSidebarComponentProps) => {
    const {onToggleVisibility, datasetObservable, onColorChanged} = props;
    // TODO: Refactor to store only metadata once data layer is implemented.
    const [datasets, setDatasets] = useState<IPerfDataset[]>([]);

    useEffect(() => {
        const onUpdateDatasets = (datasets: IPerfDataset[]) => {
            setDatasets(datasets);
        }

        datasetObservable.add(onUpdateDatasets);
        return () => {
            datasetObservable.removeCallback(onUpdateDatasets);
        }
    }, []);

    const onCheckChange = (id: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
        onToggleVisibility(id, !event.currentTarget.checked);
    }

    const onColorChange = (id: string) => (color: string) => {
        onColorChanged(id, color);
    }

    return (
        <div id="performance-viewer-sidebar">
            {
                datasets.map((dataset: IPerfDataset) => (
                        <div key={`perf-sidebar-item-${dataset.id}`} className="sidebar-item">
                            <input type="checkbox" checked={!dataset.hidden} onChange={onCheckChange(dataset.id)} />
                            <span className="sidebar-item-label">{dataset.id}</span>
                            <ColorPickerLineComponent value={Color3.FromHexString(dataset.color ?? "#000")} onColorChanged={onColorChange(dataset.id)} shouldPopRight />
                        </div>
                    )
                )
            }
        </div>
    )
}
