import type { IFlexibleGridLayoutProps } from "../../components/layout/FlexibleGridLayout";
import { FlexibleGridLayout } from "../../components/layout/FlexibleGridLayout";

export default { component: FlexibleGridLayout };

export const Default = {
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
                        { id: "row1", height: "50%", selectedTab: "tab1", tabs: [{ id: "tab1", component: <div>Test tab 1</div> }] },
                        { id: "row2", height: "50%", selectedTab: "tab2", tabs: [{ id: "tab2", component: <div>Test tab 2</div> }] },
                    ],
                },
            ],
        },
    },
};

export const TwoColumn = {
    render: Default.render,
    args: {
        layoutDefinition: {
            columns: [
                {
                    id: "column1",
                    width: "50%",
                    rows: [
                        { id: "row1", height: "50%", selectedTab: "tab1", tabs: [{ id: "tab1", component: <div>Test tab 1</div> }] },
                        { id: "row2", height: "50%", selectedTab: "tab2", tabs: [{ id: "tab2", component: <div>Test tab 2</div> }] },
                    ],
                },
                {
                    id: "column2",
                    width: "50%",
                    rows: [
                        { id: "row1", height: "50%", selectedTab: "tab1", tabs: [{ id: "tab1", component: <div>Test tab 1</div> }] },
                        { id: "row2", height: "50%", selectedTab: "tab2", tabs: [{ id: "tab2", component: <div>Test tab 2</div> }] },
                    ],
                },
            ],
        },
    },
};
