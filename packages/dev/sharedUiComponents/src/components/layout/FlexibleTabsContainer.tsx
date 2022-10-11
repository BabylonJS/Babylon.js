import type { FC, ReactElement } from "react";
import { useContext } from "react";
import { FlexibleTab } from "./FlexibleTab";
import { LayoutContext } from "./LayoutContext";
import style from "./FlexibleTabsContainer.modules.scss";

import dragIcon from "../../imgs/dragDotsIcon_white.svg";
import { getPosInLayout } from "./unitTools";

export interface IFlexibleTabsContainerProps {
    tabs: { component: ReactElement; id: string }[];
    rowIndex: number;
    columnIndex: number;
    selectedTab?: string;
}

export const FlexibleTabsContainer: FC<IFlexibleTabsContainerProps> = (props) => {
    const { layout, setLayout } = useContext(LayoutContext);
    const { tabs, selectedTab } = props;
    const selectedTabId = props.selectedTab !== undefined ? props.selectedTab : tabs[0].id;
    const selectedTabArray = tabs.filter((tab) => tab.id === selectedTabId);
    const selectedTabObject = selectedTabArray.length > 0 ? selectedTabArray[0] : null;

    const selectTab = (tabId: string) => {
        console.log("select tab with tabid", tabId, "rowindex", props.rowIndex, "colidx", props.columnIndex);
        const layoutPos = getPosInLayout(layout, props.columnIndex, props.rowIndex);
        console.log("layoutpos", layoutPos);
        layoutPos.selectedTab = tabId;
        setLayout({ ...layout });
    };

    return (
        <div className={style.rootContainer}>
            <div draggable={false} className={style.tabsLineContainer}>
                <div className={style.tabsContainer}>
                    {tabs.map((tab) => {
                        return <FlexibleTab key={tab.id} title={tab.id} selected={tab.id === selectedTab} onClick={() => selectTab(tab.id)} />;
                    })}
                </div>
                <img draggable={false} className={style.dragIcon} src={dragIcon} />
            </div>
            <div className={style.contentContainer}>{selectedTabObject?.component}</div>
        </div>
    );
};
