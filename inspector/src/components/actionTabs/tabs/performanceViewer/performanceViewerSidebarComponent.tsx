import { Color3 } from "babylonjs/Maths/math.color";
import { IPerfMetadata } from "babylonjs/Misc/interfaces/iPerfViewer";
import { PerformanceViewerCollector } from "babylonjs/Misc/PerformanceViewer/performanceViewerCollector";
import * as React from "react";
import { useEffect, useState } from "react";
import { ColorPickerLineComponent } from "../../../../sharedUiComponents/lines/colorPickerComponent";
import { faSquare, faCheckSquare } from "@fortawesome/free-solid-svg-icons";
import { CheckBoxLineComponent } from "../../../../sharedUiComponents/lines/checkBoxLineComponent";

interface IPerformanceViewerSidebarComponentProps {
    collector: PerformanceViewerCollector;
}

export const PerformanceViewerSidebarComponent = (props: IPerformanceViewerSidebarComponentProps) => {
    const { collector } = props;
    // Map from id to IPerfMetadata information
    const [metadataMap, setMetadataMap] = useState<Map<string, IPerfMetadata>>();
    // Map from category to all the ids belonging to that category
    const [metadataCategoryId, setMetadataCategoryId] = useState<Map<string, string[]>>();
    // List of ordered categories
    const [metadataCategories, setMetadataCategories] = useState<string[]>();

    useEffect(() => {
        const onUpdateMetadata = (metadata: Map<string, IPerfMetadata>) => {
            const newMap = new Map<string, string[]>();
            metadata.forEach((value: IPerfMetadata, id: string) => {
                const currentCategory = value.category ?? "";
                let currentIds : string[] = newMap.get(currentCategory) ?? [];
                currentIds.push(id);
                newMap.set(currentCategory, currentIds);
            });
            const orderedCategories = Array.from(newMap.keys());
            orderedCategories.sort();

            setMetadataCategoryId(newMap);
            setMetadataMap(metadata);
            setMetadataCategories(orderedCategories);
        };

        collector.metadataObservable.add(onUpdateMetadata);
        return () => {
            collector.metadataObservable.removeCallback(onUpdateMetadata);
        };
    }, []);

    const onCheckChange = (id: string) => (selected : boolean) => {
        collector.updateMetadata(id, "hidden", !selected);
    };

    const onColorChange = (id: string) => (color: string) => {
        collector.updateMetadata(id, "color", color);
    };

    return (
        <div id="performance-viewer-sidebar">
            {metadataCategories && metadataCategories.map((category) => (
                <div key={`category-${category || 'version'}`}>
                    {category
                        ? <div className="category-header header" key={`header-${category}`}>
                            <span>{category}</span>
                            <input type="checkbox"/>
                          </div>
                        : <div className="version-header header" key={"header-version"}>Version:</div>}
                    {metadataCategoryId?.get(category)?.map((id) => {
                        const metadata = metadataMap?.get(id);
                        return metadata && <div key={`perf-sidebar-item-${id}`} className="sidebar-item">
                            {/* <input type="checkbox"checked={!metadata.hidden} onChange={onCheckChange(id)} /> */}
                            <CheckBoxLineComponent isSelected={() => !metadata.hidden} onSelect={onCheckChange(id)} faIcons={{faIconEnabled: faCheckSquare, faIconDisabled: faCheckSquare}} />
                            <ColorPickerLineComponent value={Color3.FromHexString(metadata.color ?? "#000")} onColorChanged={onColorChange(id)} shouldPopRight hideColorRect faIcon={faSquare} />
                            <span className="sidebar-item-label">{id}</span>
                        </div>
                    })}
                </div>
            ))}
        </div>
    );
};
