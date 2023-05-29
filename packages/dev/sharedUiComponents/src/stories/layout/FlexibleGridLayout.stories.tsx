import type { IFlexibleGridLayoutProps } from "../../components/layout/FlexibleGridLayout";
import { FlexibleGridLayout } from "../../components/layout/FlexibleGridLayout";
import type { StoryObj } from "@storybook/react";

export default { component: FlexibleGridLayout };

export const Default: StoryObj<typeof FlexibleGridLayout> = {
    render: (props: IFlexibleGridLayoutProps) => {
        return (
            <div style={{ width: "100%", height: "500px" }}>
                <FlexibleGridLayout {...props} />
            </div>
        );
    },
    args: {
        layoutDefinition: {
            columns: [
                {
                    id: "column1",
                    width: "100%",
                    rows: [
                        { id: "row1", height: "50%", selectedTab: "tab1", tabs: [{ id: "tab1", component: <div>Test tab 1</div>, title: "Tab title 1" }] },
                        { id: "row2", height: "50%", selectedTab: "tab2", tabs: [{ id: "tab2", component: <div>Test tab 2</div>, title: "Tab 2" }] },
                    ],
                },
            ],
        },
    },
};

export const TwoColumn: StoryObj<typeof FlexibleGridLayout> = {
    render: Default.render,
    args: {
        layoutDefinition: {
            columns: [
                {
                    id: "column1",
                    width: "50%",
                    rows: [
                        { id: "row1", height: "50%", selectedTab: "tab1", tabs: [{ id: "tab1", component: <div>Test tab 1</div>, title: "T1" }] },
                        { id: "row2", height: "50%", selectedTab: "tab2", tabs: [{ id: "tab2", component: <div>Test tab 2</div>, title: "T2" }] },
                    ],
                },
                {
                    id: "column2",
                    width: "50%",
                    rows: [
                        { id: "row1", height: "50%", selectedTab: "tab1", tabs: [{ id: "tab1", component: <div>Test tab 1</div>, title: "T3" }] },
                        { id: "row2", height: "50%", selectedTab: "tab2", tabs: [{ id: "tab2", component: <div>Test tab 2</div>, title: "T4" }] },
                    ],
                },
            ],
        },
    },
};
