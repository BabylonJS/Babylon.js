import { Color3 } from "babylonjs/Maths/math.color";
import { IPerfMetadata } from "babylonjs/Misc/interfaces/iPerfViewer";
import { PerformanceViewerCollector } from "babylonjs/Misc/PerformanceViewer/performanceViewerCollector";
import * as React from "react";
import { useEffect, useState } from "react";
import { ColorPickerLineComponent } from "../../../../sharedUiComponents/lines/colorPickerComponent";

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
        };

        collector.metadataObservable.add(onUpdateMetadata);
        return () => {
            collector.metadataObservable.removeCallback(onUpdateMetadata);
        };
    }, []);

    const onCheckChange = (id: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
        collector.updateMetadata(id, "hidden", !event.currentTarget.checked);
    };

    const onColorChange = (id: string) => (color: string) => {
        collector.updateMetadata(id, "color", color);
    };

    const categoryKeys : string[] = [];
    const metadataMap = new Map<string, MetadataEntry[]>();
    for (let entry of metadata) {
        const category = entry[1].category ?? "";
        let entries = metadataMap.get(category);
        if (!entries) {
            entries = [];
            categoryKeys.push(category);
        }
        entries.push(entry);
        metadataMap.set(category, entries);
    }
    categoryKeys.sort();

    return (
        <div id="performance-viewer-sidebar">
            {categoryKeys.map((category) => (
                <div key={`category-${category || 'version'}`}>
                    {category
                        ? <div className="category-header header" key={`header-${category}`}>
                            <span>{category}</span>
                            <input type="checkbox"/>
                          </div>
                        : <div className="version-header header" key={"header-version"}>Version:</div>}
                    {metadataMap.get(category)?.map(([id, metadata]) => (
                        <div key={`perf-sidebar-item-${id}`} className="sidebar-item">
                            <input type="checkbox"checked={!metadata.hidden} onChange={onCheckChange(id)} />
                            <ColorPickerLineComponent value={Color3.FromHexString(metadata.color ?? "#000")} onColorChanged={onColorChange(id)} shouldPopRight />
                            <span className="sidebar-item-label">{id}</span>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};
