import { Observable } from 'babylonjs';
import { IPerfDataset } from 'babylonjs/Misc/interfaces/iPerfViewer';
import * as React from 'react';
import { useEffect, useState } from 'react';

interface IPerformanceViewerSidebarComponentProps {
    datasetObservable: Observable<IPerfDataset[]>
    onToggleVisibility: (id: string, value: boolean) => void;
}


export const PerformanceViewerSidebarComponent = (props: IPerformanceViewerSidebarComponentProps) => {
    const {onToggleVisibility, datasetObservable} = props;
    const [content, setContent] = useState<JSX.Element>(<></>);

    useEffect(() => {
        datasetObservable.add(onUpdateDatasets);
        return () => {
            datasetObservable.removeCallback(onUpdateDatasets);
            console.log(datasetObservable.hasObservers());
        }
    }, []);

    const onCheckChange = (id: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
        onToggleVisibility(id, !event.currentTarget.checked);
    }

    const onUpdateDatasets = (datasets: IPerfDataset[]) => {

        const htmlContent: JSX.Element = (
            <>
                {
                    datasets.map((dataset: IPerfDataset) => {
                        return (
                            <div key={`perf-sidebar-item-${dataset.id}`} className={"group"}>
                                <input type="checkbox" checked={!dataset.hidden} onChange={onCheckChange(dataset.id)} />
                                <span>{dataset.id}</span>
                            </div>
                        );
                    })
                }
            </>
        )
        
        setContent(htmlContent);
    }

    return (
        <div id="performanceViewerSidebar">
            {
                content
            }
        </div>
    )
}
