import type { FC, ReactElement } from "react";
import { FlexibleTab } from "./FlexibleTab";
import style from "./FlexibleTabsContainer.modules.scss";
// import commonStyle from "./CommonStyles.modules.scss";

import dragIcon from "../../imgs/dragDotsIcon_white.svg";

export interface IFlexibleTabsContainerProps {
    tabs: { component: ReactElement; id: string }[];
    rowIndex: number;
    columnIndex: number;
    selectedTab?: string;
    draggedOver?: boolean;
}

export const FlexibleTabsContainer: FC<IFlexibleTabsContainerProps> = (props) => {
    const { tabs, draggedOver = true, selectedTab } = props;
    const selectedTabId = props.selectedTab !== undefined ? props.selectedTab : tabs[0].id;
    const selectedTabArray = tabs.filter((tab) => tab.id === selectedTabId);
    const selectedTabObject = selectedTabArray.length > 0 ? selectedTabArray[0] : null;
    console.log(draggedOver);
    return (
        <div className={style.rootContainer}>
            <div draggable={false} className={style.tabsLineContainer}>
                <div className={style.tabsContainer}>
                    {tabs.map((tab) => {
                        return <FlexibleTab key={tab.id} title={tab.id} selected={tab.id === selectedTab} />;
                    })}
                </div>
                <img draggable={false} className={style.dragIcon} src={dragIcon} />
            </div>
            <div className={style.contentContainer}>{selectedTabObject?.component}</div>
        </div>
    );
};
