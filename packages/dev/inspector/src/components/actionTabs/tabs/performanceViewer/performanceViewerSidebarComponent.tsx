import { Color3 } from "core/Maths/math.color";
import type { IPerfMetadata } from "core/Misc/interfaces/iPerfViewer";
import type { PerformanceViewerCollector } from "core/Misc/PerformanceViewer/performanceViewerCollector";
import { useEffect, useState } from "react";
import { ColorPickerLine } from "shared-ui-components/lines/colorPickerComponent";
import { faSquare, faCheckSquare } from "@fortawesome/free-solid-svg-icons";
import { CheckBoxLineComponent } from "shared-ui-components/lines/checkBoxLineComponent";
import type { Observable } from "core/Misc/observable";
import type { IPerfMinMax, IVisibleRangeChangedObservableProps } from "../../../graph/graphSupportingTypes";
import { Engine } from "core/Engines/engine";

interface IPerformanceViewerSidebarComponentProps {
    collector: PerformanceViewerCollector;
    onVisibleRangeChangedObservable?: Observable<IVisibleRangeChangedObservableProps>;
}

export const PerformanceViewerSidebarComponent = (props: IPerformanceViewerSidebarComponentProps) => {
    const { collector, onVisibleRangeChangedObservable } = props;
    // Map from id to IPerfMetadata information
    const [metadataMap, setMetadataMap] = useState<Map<string, IPerfMetadata>>();
    // Map from category to all the ids belonging to that category
    const [metadataCategoryId, setMetadataCategoryId] = useState<Map<string, string[]>>();
    // Count how many elements are checked for that category
    const [metadataCategoryChecked, setMetadataCategoryChecked] = useState<Map<string, number>>();
    // List of ordered categories
    const [metadataCategories, setMetadataCategories] = useState<string[]>();
    // Min/Max/Current values of the ids
    const [valueMap, setValueMap] = useState<Map<string, IPerfMinMax>>();

    useEffect(() => {
        if (!onVisibleRangeChangedObservable) {
            return;
        }
        const observer = (props: IVisibleRangeChangedObservableProps) => {
            setValueMap(props.valueMap);
        };
        onVisibleRangeChangedObservable.add(observer);
        return () => {
            onVisibleRangeChangedObservable.removeCallback(observer);
        };
    }, [onVisibleRangeChangedObservable]);

    useEffect(() => {
        const onUpdateMetadata = (metadata: Map<string, IPerfMetadata>) => {
            const newCategoryIdMap = new Map<string, string[]>();
            const newCategoryCheckedMap = new Map<string, number>();

            metadata.forEach((value: IPerfMetadata, id: string) => {
                const currentCategory = value.category ?? "";
                const currentIds: string[] = newCategoryIdMap.get(currentCategory) ?? [];
                let currentChecked: number = newCategoryCheckedMap.get(currentCategory) ?? 0;

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

    const onCheckChange = (id: string) => (selected: boolean) => {
        collector.updateMetadata(id, "hidden", !selected);
    };

    const onCheckAllChange = (category: string) => (selected: boolean) => {
        const categoryIds = metadataCategoryId?.get(category);
        if (!categoryIds) {
            return;
        }
        for (const id of categoryIds) {
            collector.updateMetadata(id, "hidden", !selected);
        }
    };

    const onColorChange = (id: string) => (color: string) => {
        collector.updateMetadata(id, "color", color);
    };

    return (
        <div id="performance-viewer-sidebar">
            {metadataCategories &&
                metadataCategories.map((category) => (
                    <div key={`category-${category || "version"}`}>
                        {category ? (
                            <div className="category-header header sidebar-item" key={`header-${category}`}>
                                <span className="category">{category}</span>
                                <CheckBoxLineComponent
                                    isSelected={() => metadataCategoryChecked?.get(category) === metadataCategoryId?.get(category)?.length}
                                    onSelect={onCheckAllChange(category)}
                                    faIcons={{ enabled: faCheckSquare, disabled: faSquare }}
                                />
                            </div>
                        ) : (
                            <div className="version-header sidebar-item" key={"header-version"}>
                                <span className="category">Version:</span>
                                <span className="value">{Engine.Version}</span>
                            </div>
                        )}
                        {metadataCategoryId?.get(category)?.map((id) => {
                            const metadata = metadataMap?.get(id);
                            const range = valueMap?.get(id);
                            return (
                                metadata && (
                                    <div key={`perf-sidebar-item-${id}`} className="sidebar-item measure">
                                        {/* div with check box, color picker and category name */}
                                        <div className="category">
                                            <CheckBoxLineComponent
                                                isSelected={() => !metadata.hidden}
                                                onSelect={onCheckChange(id)}
                                                faIcons={{ enabled: faCheckSquare, disabled: faSquare }}
                                            />
                                            <ColorPickerLine value={Color3.FromHexString(metadata.color ?? "#000")} onColorChanged={onColorChange(id)} shouldPopRight />
                                            <span className="sidebar-item-label">{id}</span>
                                        </div>
                                        {/* div with category value */}
                                        {range && <div className="value"> {((range.min + range.max) / 2).toFixed(2)} </div>}
                                    </div>
                                )
                            );
                        })}
                    </div>
                ))}
        </div>
    );
};
