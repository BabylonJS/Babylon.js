import { FC, ReactElement,useState } from "react";
import { ClassNames } from "../classNames";
import style from "./FlexibleTabsContainer.modules.scss";

export interface IFlexibleTabsContainerProps {
    tabs: ReactElement[];
}

export const FlexibleTabsContainer: FC<IFlexibleTabsContainerProps> = (props) => {
    const [selectedTab, setSelectedTab] = useState(0);
    const {tabs} = props;

    const selectTab = (index: number) => {
        console.log(`selectTab(${index})`);
        setSelectedTab(index);
    };
    
    return (
        <div className={style.rootContainer}>
            <div className={style.tabsContainer}>
                {tabs.map((tab, index) => {
                    let tabTitle;
                    if (tab.props.title) {
                        tabTitle = tab.props.title;
                    } else {
                        tabTitle = "Test Tab";
                    }
                    return <div key={tabTitle} className={ClassNames({tab: true, selectedTab: index === selectedTab}, style)} onClick={() => selectTab(index)}>{tabTitle}</div>
                })}
            </div>
            <div className={style.contentContainer}>
                {tabs[selectedTab]}
            </div>
        </div>
    )
}