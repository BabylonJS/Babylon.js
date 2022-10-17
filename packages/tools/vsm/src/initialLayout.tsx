import { TestComponent } from "./testComponent";
import { SceneRendererComponent } from "./components/SceneRendererComponent";
import { StatesViewComponent } from "./components/StatesViewComponent";
import { StateBehaviorViewComponent } from "./components/StateBehaviorViewComponent";
import type { Layout } from "shared-ui-components/components/layout/types";

export const initialLayout: Layout = {
    columns: [
        {
            id: "column1",
            width: "30%",
            rows: [
                {
                    id: "scene",
                    height: "100%",
                    selectedTab: "sceneTab",
                    tabs: [
                        { id: "sceneTab", title: "Scene", component: <SceneRendererComponent /> },
                        { id: "test", title: "Test", component: <TestComponent name="test" /> },
                    ],
                },
            ],
        },
        {
            id: "column2",
            width: "70%",
            rows: [
                {
                    id: "row4",
                    selectedTab: "statesView",
                    height: "70%",
                    tabs: [{ id: "statesView", title: "States", component: <StatesViewComponent /> }],
                },
                {
                    id: "row5",
                    selectedTab: "behaviorView",
                    height: "30%",
                    tabs: [{ id: "behaviorView", title: "Behavior", component: <StateBehaviorViewComponent /> }],
                },
            ],
        },
    ],
};
