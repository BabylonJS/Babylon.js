import { FC, ReactElement } from "react";
import { ClassNames } from "../classNames";
import { DRAGCLASS } from "./FlexibleGridLayout";
import style from "./FlexibleTabsContainer.modules.scss";

import dragIcon from "../../imgs/cellIDIcon.svg";

export interface IFlexibleTabsContainerProps {
    tabs: ReactElement[];
    selectedTab?: number;
}

export const FlexibleTabsContainer: FC<IFlexibleTabsContainerProps> = (props) => {
    const { tabs, selectedTab = 0 } = props;

    return (
        <div className={style.rootContainer}>
            <div draggable={false} className={style.tabsLineContainer}>
                <div className={style.tabsContiner}>
                    {tabs.map((tab, index) => {
                        let tabTitle;
                        if (tab.props.title) {
                            tabTitle = tab.props.title;
                        } else {
                            tabTitle = "Test Tab";
                        }
                        return (
                            <div key={tabTitle} className={ClassNames({ tab: true, selectedTab: index === selectedTab }, style)}>
                                <div className={style.noSelect + " " + DRAGCLASS}>{tabTitle}</div>
                            </div>
                        );
                    })}
                </div>
                <img draggable={false} className={style.dragIcon + " " + style.noSelect + " " + DRAGCLASS} src={dragIcon} />
            </div>
            <div className={style.contentContainer}>{tabs[selectedTab]}</div>
        </div>
    );
};
