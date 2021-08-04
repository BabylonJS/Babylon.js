import { Color3 } from 'babylonjs/Maths/math.color';
import { IPerfMetadata } from 'babylonjs/Misc/interfaces/iPerfViewer';
import { PerformanceViewerCollector } from 'babylonjs/Misc/PerformanceViewer/performanceViewerCollector';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { ColorPickerLineComponent } from '../../../../sharedUiComponents/lines/colorPickerComponent';

interface IPerformanceViewerSidebarComponentProps {
    collector: PerformanceViewerCollector;
}

type MetadataEntry = [string, IPerfMetadata];

export const PerformanceViewerSidebarComponent = (props: IPerformanceViewerSidebarComponentProps) => {
    const { collector } = props;
    const [metadata, setMetadata] = useState<MetadataEntry[]>([]);

    useEffect(() => {
        const onUpdateMetadata = (metadata: Map<string, IPerfMetadata>) => {
            const entries: MetadataEntry[] = [];
            // convert to iterable list of entries
            metadata.forEach((value: IPerfMetadata, key) => {
                entries.push([key, value]);
            });
            setMetadata(entries);
        }

        collector.metadataObservable.add(onUpdateMetadata);
        return () => {
            collector.metadataObservable.removeCallback(onUpdateMetadata);
        }
    }, []);

    const onCheckChange = (id: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
        collector.updateMetadata(id, "hidden", !event.currentTarget.checked);
    }

    const onColorChange = (id: string) => (color: string) => {
        collector.updateMetadata(id, "color", color);
    }

    return (
        <div id="performance-viewer-sidebar">
            {
                metadata.map(([id, metadata]) => (
                        <div key={`perf-sidebar-item-${id}`} className="sidebar-item">
                            <input type="checkbox" checked={!metadata.hidden} onChange={onCheckChange(id)} />
                            <span className="sidebar-item-label">{id}</span>
                            <ColorPickerLineComponent value={Color3.FromHexString(metadata.color ?? "#000")} onColorChanged={onColorChange(id)} shouldPopRight />
                        </div>
                    )
                )
            }
        </div>
    )
}
