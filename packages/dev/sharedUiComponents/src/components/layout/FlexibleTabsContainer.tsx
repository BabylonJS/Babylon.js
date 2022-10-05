import type { FC, ReactElement } from "react";
import { ClassNames } from "../classNames";
import { DRAGCLASS, OPERATIONCLASS, OperationTypes, ROWCLASS, COLCLASS } from "./constants";
import style from "./FlexibleTabsContainer.modules.scss";

import dragIcon from "../../imgs/cellIDIcon.svg";

export interface IFlexibleTabsContainerProps {
    tabs: { component: ReactElement; id: string }[];
    rowIndex: number;
    columnIndex: number;
    selectedTab?: string;
}

export const FlexibleTabsContainer: FC<IFlexibleTabsContainerProps> = (props) => {
    const { tabs, rowIndex, columnIndex } = props;
    const selectedTabId = props.selectedTab !== undefined ? props.selectedTab : tabs[0].id;
    const selectedTabArray = tabs.filter((tab) => tab.id === selectedTabId);
    const selectedTab = selectedTabArray.length > 0 ? selectedTabArray[0] : null;

    return (
        <div className={style.rootContainer}>
            <div draggable={false} className={style.tabsLineContainer}>
                <div className={style.tabsContainer}>
                    {tabs.map((tab, index) => {
                        return (
                            <div key={tab.id} className={ClassNames({ tab: true, selectedTab: tab.id === selectedTabId }, style)}>
                                <div
                                    className={style.noSelect + " " + DRAGCLASS}
                                    data-tab-index={tab.id}
                                    {...{ [OPERATIONCLASS]: OperationTypes.CLICK_TAB, [ROWCLASS]: rowIndex, [COLCLASS]: columnIndex }}
                                >
                                    {tab.id}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <img draggable={false} className={style.dragIcon + " " + style.noSelect + " " + DRAGCLASS} src={dragIcon} />
            </div>
            <div className={style.contentContainer}>{selectedTab?.component}</div>
        </div>
    );
};
