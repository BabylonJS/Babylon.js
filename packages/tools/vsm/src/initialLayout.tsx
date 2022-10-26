import { TestComponent } from "./testComponent";
import { SceneRendererComponent } from "./components/SceneRendererComponent";
import { StatesViewComponent } from "./components/StatesViewComponent";
import { StateBehaviorViewComponent } from "./components/StateBehaviorViewComponent";
import type { Layout } from "shared-ui-components/components/layout/types";
import { EditValueComponent } from "./components/EditValueComponent";
import { TestReactiveNodes } from "./components/TestReactiveNodes";

export const initialLayout: Layout = {
    columns: [
        {
            id: "column1",
            width: "30%",
            rows: [
                {
                    id: "scene",
                    height: "80%",
                    selectedTab: "sceneTab",
                    tabs: [
                        { id: "sceneTab", title: "Scene", component: <SceneRendererComponent /> },
                        { id: "test", title: "Test", component: <TestComponent name="test" /> },
                    ],
                },
                {
                    id: "edit",
                    height: "20%",
                    selectedTab: "editTab",
                    tabs: [{ id: "editTab", title: "Edit value", component: <EditValueComponent /> }],
                },
            ],
        },
        {
            id: "column2",
            width: "70%",
            rows: [
                {
                    id: "row4",
                    selectedTab: "reactiveNodes",
                    height: "60%",
                    tabs: [
                        { id: "statesView", title: "States", component: <StatesViewComponent /> },
                        { id: "reactiveNodes", title: "Test", component: <TestReactiveNodes /> },
                    ],
                },
                {
                    id: "row5",
                    selectedTab: "behaviorView",
                    height: "40%",
                    tabs: [{ id: "behaviorView", title: "Behavior", component: <StateBehaviorViewComponent /> }],
                },
            ],
        },
    ],
};
