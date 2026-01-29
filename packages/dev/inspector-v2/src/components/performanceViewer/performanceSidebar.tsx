import type { FunctionComponent } from "react";

import type { Color4 } from "core/Maths/math.color";
import type { IPerfMetadata } from "core/Misc/interfaces/iPerfViewer";
import type { Observable } from "core/Misc/observable";
import type { PerformanceViewerCollector } from "core/Misc/PerformanceViewer/performanceViewerCollector";
import type { PerfMinMax, VisibleRangeChangedObservableProps } from "./graphSupportingTypes";

import { Body1, makeStyles, mergeClasses, Subtitle2Stronger, tokens } from "@fluentui/react-components";
import { useEffect, useState } from "react";

import { Color3 } from "core/Maths/math.color";
import { ColorPickerPopup } from "shared-ui-components/fluent/primitives/colorPicker";
import { Switch } from "shared-ui-components/fluent/primitives/switch";

const useStyles = makeStyles({
    sidebar: {
        display: "flex",
        flexDirection: "column",
        width: "280px",
        minWidth: "280px",
        overflowY: "auto",
        overflowX: "hidden",
        borderRight: `1px solid ${tokens.colorNeutralStroke1}`,
        backgroundColor: tokens.colorNeutralBackground1,
    },
    sidebarItem: {
        display: "grid",
        width: "100%",
        minHeight: "30px",
        padding: `${tokens.spacingVerticalXXS} 0`,
        alignItems: "center",
    },
    header: {
        color: tokens.colorNeutralForeground1,
        backgroundColor: tokens.colorBrandBackground,
        gridTemplateColumns: "10px 9fr 1fr 8px",
    },
    categoryHeader: {
        backgroundColor: tokens.colorNeutralBackground4,
        minHeight: "30px",
    },
    categoryColumn2: {
        gridColumn: "2",
    },
    categoryColumn3: {
        gridColumn: "3",
        display: "flex",
        justifyContent: "end",
    },
    measure: {
        color: tokens.colorNeutralForeground1,
        gridTemplateColumns: "4px 6fr 1fr 10px",
    },
    measureOdd: {
        backgroundColor: tokens.colorNeutralBackground2,
    },
    measureEven: {
        backgroundColor: tokens.colorNeutralBackground1,
    },
    measureCategory: {
        display: "grid",
        gridTemplateColumns: "auto 7px 18px 10px 1fr",
        gridColumn: "2",
        alignItems: "center",
    },
    measureColorPicker: {
        gridColumn: "3",
    },
    measureLabel: {
        gridColumn: "5",
    },
    measureValue: {
        gridColumn: "3",
        textAlign: "right",
    },
});

interface IPerformanceSidebarProps {
    collector: PerformanceViewerCollector;
    onVisibleRangeChangedObservable?: Observable<VisibleRangeChangedObservableProps>;
}

export const PerformanceSidebar: FunctionComponent<IPerformanceSidebarProps> = (props) => {
    const { collector, onVisibleRangeChangedObservable } = props;
    const classes = useStyles();

    // Map from id to IPerfMetadata information
    const [metadataMap, setMetadataMap] = useState<Map<string, IPerfMetadata>>();
    // Map from category to all the ids belonging to that category
    const [metadataCategoryId, setMetadataCategoryId] = useState<Map<string, string[]>>();
    // Count how many elements are checked for that category
    const [metadataCategoryChecked, setMetadataCategoryChecked] = useState<Map<string, number>>();
    // List of ordered categories
    const [metadataCategories, setMetadataCategories] = useState<string[]>();
    // Min/Max/Current values of the ids
    const [valueMap, setValueMap] = useState<Map<string, PerfMinMax>>();

    useEffect(() => {
        if (!onVisibleRangeChangedObservable) {
            return;
        }
        const observer = (observedProps: VisibleRangeChangedObservableProps) => {
            setValueMap(observedProps.valueMap);
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
    }, [collector]);

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

    const onColorChange = (id: string) => (color: Color3 | Color4) => {
        collector.updateMetadata(id, "color", color.toHexString());
    };

    return (
        <div className={classes.sidebar}>
            {metadataCategories &&
                metadataCategories.map((category) => (
                    <div key={`category-${category || "version"}`}>
                        {category ? (
                            <div className={mergeClasses(classes.sidebarItem, classes.header, classes.categoryHeader)} key={`header-${category}`}>
                                <Subtitle2Stronger className={classes.categoryColumn2}>{category}</Subtitle2Stronger>
                                <div className={classes.categoryColumn3}>
                                    <Switch value={metadataCategoryChecked?.get(category) === metadataCategoryId?.get(category)?.length} onChange={onCheckAllChange(category)} />
                                </div>
                            </div>
                        ) : null}
                        {metadataCategoryId?.get(category)?.map((id, index) => {
                            const metadata = metadataMap?.get(id);
                            const range = valueMap?.get(id);
                            return (
                                metadata && (
                                    <div
                                        key={`perf-sidebar-item-${id}`}
                                        className={mergeClasses(classes.sidebarItem, classes.measure, index % 2 === 0 ? classes.measureEven : classes.measureOdd)}
                                    >
                                        <div className={classes.measureCategory}>
                                            <Switch value={!metadata.hidden} onChange={onCheckChange(id)} />
                                            <div className={classes.measureColorPicker}>
                                                <ColorPickerPopup value={Color3.FromHexString(metadata.color ?? "#000")} onChange={onColorChange(id)} />
                                            </div>
                                            <Body1 className={classes.measureLabel}>{id}</Body1>
                                        </div>
                                        {range && <div className={classes.measureValue}> {((range.min + range.max) / 2).toFixed(2)} </div>}
                                    </div>
                                )
                            );
                        })}
                    </div>
                ))}
        </div>
    );
};
