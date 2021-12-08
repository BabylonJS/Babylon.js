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
    // Count how many elements are checked for that category
    const [metadataCategoryChecked, setMetadataCategoryChecked] = useState<Map<string, number>>();
    // List of ordered categories
    const [metadataCategories, setMetadataCategories] = useState<string[]>();

    useEffect(() => {
        const onUpdateMetadata = (metadata: Map<string, IPerfMetadata>) => {
            const newCategoryIdMap = new Map<string, string[]>();
            const newCategoryCheckedMap = new Map<string, number>();

            metadata.forEach((value: IPerfMetadata, id: string) => {
                const currentCategory = value.category ?? "";
                let currentIds : string[] = newCategoryIdMap.get(currentCategory) ?? [];
                let currentChecked : number = newCategoryCheckedMap.get(currentCategory) ?? 0;

                currentIds.push(id);
                newCategoryIdMap.set(currentCategory, currentIds);

                if (!value.hidden) {
                    currentChecked += 1;
                }
                newCategoryCheckedMap.set(currentCategory, currentChecked);
            });
            const orderedCategories = Array.from(newCategoryIdMap.keys());
            orderedCategories.sort();

            setMetadataCategoryId(newCategoryIdMap);
            setMetadataCategoryChecked(newCategoryCheckedMap);
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

    const onCheckAllChange = (category: string) => (selected : boolean) => {
        const categoryIds = metadataCategoryId?.get(category);
        categoryIds?.forEach((id) => {
            collector.updateMetadata(id, "hidden", !selected);
        });
    }

    const onColorChange = (id: string) => (color: string) => {
        collector.updateMetadata(id, "color", color);
    };

    return (
        <div id="performance-viewer-sidebar">
            {metadataCategories && metadataCategories.map((category) => (
                <div key={`category-${category || 'version'}`}>
                    {category
                        ? <div className="category-header header sidebar-item" key={`header-${category}`}>
                            <span className="category">{category}</span>
                            <CheckBoxLineComponent isSelected={() => metadataCategoryChecked?.get(category) === metadataCategoryId?.get(category)?.length} onSelect={onCheckAllChange(category)} faIcons={{enabled: faCheckSquare, disabled: faSquare}} />
                          </div>
                        : <div className="version-header header sidebar-item" key={"header-version"}>
                            <span className="category">Version:</span>
                            <span className="value">100</span>
                        </div>}
                    {metadataCategoryId?.get(category)?.map((id) => {
                        const metadata = metadataMap?.get(id);
                        return metadata && <div key={`perf-sidebar-item-${id}`} className="sidebar-item measure">
                            {/* div with check box, color picker and category name */}
                            <div className="category">
                                <CheckBoxLineComponent isSelected={() => !metadata.hidden} onSelect={onCheckChange(id)} faIcons={{enabled: faCheckSquare, disabled: faSquare}} />
                                <ColorPickerLineComponent value={Color3.FromHexString(metadata.color ?? "#000")} onColorChanged={onColorChange(id)} shouldPopRight />
                                <span className="sidebar-item-label">{id}</span>
                            </div>
                            {/* div with category value */}
                            <div className="value">
                                100
                            </div>
                        </div>
                    })}
                </div>
            ))}
        </div>
    );
};
