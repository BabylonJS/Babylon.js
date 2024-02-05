import type { FC } from "react";
import { useContext } from "react";
import { FlexibleTab } from "./FlexibleTab";
import { LayoutContext } from "./LayoutContext";
import style from "./FlexibleTabsContainer.modules.scss";

import dragIcon from "../../imgs/dragDotsIcon_white.svg";
import { getPosInLayout, removeLayoutRowAndRedistributePercentages } from "./utils";
import { DraggableIcon } from "./DraggableIcon";
import type { LayoutTab, LayoutTabsRow, TabDrag } from "./types";
import { ElementTypes } from "./types";

/**
 * Arguments for the TabsContainer component.
 */
export interface IFlexibleTabsContainerProps {
    /**
     * The tabs to display
     */
    tabs: LayoutTab[];
    /**
     * Row index of component in layout
     */
    rowIndex: number;
    /**
     * Column index of component in layout
     */
    columnIndex: number;
    /**
     * Which tab is selected in the layout
     */
    selectedTab?: string;
}

/**
 * This component contains a set of tabs of which only one is visible at a time.
 * The tabs can also be dragged from and to different containers.
 * @param props properties
 * @returns tabs container element
 */
export const FlexibleTabsContainer: FC<IFlexibleTabsContainerProps> = (props) => {
    const { layout, setLayout } = useContext(LayoutContext);
    const { tabs, selectedTab } = props;
    const selectedTabId = props.selectedTab !== undefined ? props.selectedTab : tabs[0].id;
    const selectedTabArray = tabs.filter((tab) => tab.id === selectedTabId);
    const selectedTabObject = selectedTabArray.length > 0 ? selectedTabArray[0] : null;

    const selectTab = (tabId: string) => {
        const layoutPos = getPosInLayout(layout, props.columnIndex, props.rowIndex) as LayoutTabsRow;
        layoutPos.selectedTab = tabId;
        setLayout({ ...layout });
    };

    const addTabAfter = (droppedTabItem: TabDrag, dropZoneTabId: string) => {
        // Get layout element corresponding to dropped tabs
        const layoutDropped = getPosInLayout(layout, droppedTabItem.columnNumber, droppedTabItem.rowNumber) as LayoutTabsRow;
        // Get layout element corresponding to dropzone
        const layoutDropZone = getPosInLayout(layout, props.columnIndex, props.rowIndex) as LayoutTabsRow;

        for (const { id } of droppedTabItem.tabs) {
            const droppedTabIndex = layoutDropped.tabs.findIndex((tab: any) => tab.id === id);
            const droppedTab = layoutDropped.tabs[droppedTabIndex];
            // Add dropped tab after dropZoneTabId
            const dropZoneIndex = layoutDropZone.tabs.findIndex((tab: any) => tab.id === dropZoneTabId);
            layoutDropZone.tabs.splice(dropZoneIndex + 1, 0, droppedTab);
            // Remove dropped tab from its original position
            layoutDropped.tabs.splice(droppedTabIndex, 1);
        }

        if (layoutDropped.tabs.length === 0) {
            // Check if the layout that was dropped from is empty now
            removeLayoutRowAndRedistributePercentages(layout, droppedTabItem.columnNumber, droppedTabItem.rowNumber);
        } else if (droppedTabItem.tabs.map((tab: any) => tab.id).includes(layoutDropped.selectedTab)) {
            //Check if the layout that was dropped from's active tab is still in the layout
            layoutDropped.selectedTab = layoutDropped.tabs[0].id;
        }

        // Update layout
        setLayout({ ...layout });
    };

    return (
        <div className={style.rootContainer}>
            <div draggable={false} className={style.tabsLineContainer}>
                <div className={style.tabsContainer}>
                    {tabs.map((tab) => {
                        return (
                            <FlexibleTab
                                key={tab.id}
                                title={tab.title}
                                selected={tab.id === selectedTab}
                                onClick={() => selectTab(tab.id)}
                                item={{ rowNumber: props.rowIndex, columnNumber: props.columnIndex, tabs: [{ id: tab.id }] }}
                                onTabDroppedAction={(item) => addTabAfter(item, tab.id)}
                            />
                        );
                    })}
                </div>
                <DraggableIcon
                    src={dragIcon}
                    item={{ rowNumber: props.rowIndex, columnNumber: props.columnIndex, tabs: tabs.map((t) => ({ id: t.id })) }}
                    type={ElementTypes.TAB_GROUP}
                />
            </div>
            <div className={style.contentContainer}>{selectedTabObject?.component}</div>
        </div>
    );
};
