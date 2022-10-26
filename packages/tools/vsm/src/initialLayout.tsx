import { SceneRendererComponent } from "./components/SceneRendererComponent";
import { StatesViewComponent } from "./components/StatesViewComponent";
import { StateBehaviorViewComponent } from "./components/StateBehaviorViewComponent";
import type { Layout } from "shared-ui-components/components/layout/types";
import { EditValueComponent } from "./components/EditValueComponent";
import { NodeListComponent } from "./components/NodeListComponent";

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
                    tabs: [{ id: "sceneTab", title: "Scene", component: <SceneRendererComponent /> }],
                },
                {
                    id: "edit",
                    height: "20%",
                    selectedTab: "addNode",
                    tabs: [
                        { id: "editTab", title: "Edit value", component: <EditValueComponent /> },
                        { id: "addNode", title: "Add node", component: <NodeListComponent /> },
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
                    height: "60%",
                    tabs: [{ id: "statesView", title: "States", component: <StatesViewComponent /> }],
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
