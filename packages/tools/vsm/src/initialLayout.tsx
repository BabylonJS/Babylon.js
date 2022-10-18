import { TestComponent } from "./testComponent";
export const initialLayout = {
    columns: [
        {
            id: "column1",
            width: "25%",
            rows: [
                { id: "row1", selectedTab: "c1", height: "30%", tabs: [{ id: "c1", component: <TestComponent name="c1" /> }] },
                {
                    id: "row2",
                    height: "20%",
                    selectedTab: "c3",
                    tabs: [
                        { id: "c2", component: <TestComponent name="c2" /> },
                        { id: "c3", component: <TestComponent name="c3" /> },
                        { id: "c4", component: <TestComponent name="c4" /> },
                    ],
                },
                { id: "row3", selectedTab: "c5", height: "50%", tabs: [{ id: "c5", component: <TestComponent name="c5" /> }] },
            ],
        },
        {
            id: "column2",
            width: "50%",
            rows: [
                { id: "row4", selectedTab: "c6", height: "70%", tabs: [{ id: "c6", component: <TestComponent name="c6" /> }] },
                { id: "row5", selectedTab: "c7", height: "30%", tabs: [{ id: "c7", component: <TestComponent name="c7" /> }] },
            ],
        },
        {
            id: "column3",
            width: "25%",
            rows: [
                { id: "row6", selectedTab: "c8", height: "50%", tabs: [{ id: "c8", component: <TestComponent name="c8" /> }] },
                { id: "row7", selectedTab: "c9", height: "50%", tabs: [{ id: "c9", component: <TestComponent name="c9" /> }] },
            ],
        },
    ],
};
