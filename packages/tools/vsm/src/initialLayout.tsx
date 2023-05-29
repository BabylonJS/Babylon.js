import { SceneRendererComponent } from "./components/SceneRendererComponent";
import type { Layout } from "shared-ui-components/components/layout/types";
import { EditValueComponent } from "./components/EditValueComponent";
import { NodeListComponent } from "./components/NodeListComponent";
import { StateViewNodeRenderer } from "./components/StateViewNodeRenderer";
import { StateBehaviorNodeRenderer } from "./components/StateBehaviorNodeRenderer";

export const initialLayout: Layout = {
    columns: [
        {
            id: "column1",
            width: "30%",
            rows: [
                {
                    id: "scene",
                    height: "60%",
                    selectedTab: "sceneTab",
                    tabs: [{ id: "sceneTab", title: "Scene", component: <SceneRendererComponent /> }],
                },
                {
                    id: "edit",
                    height: "20%",
                    selectedTab: "editTab",
                    tabs: [{ id: "editTab", title: "Edit value", component: <EditValueComponent /> }],
                },
                {
                    id: "add",
                    height: "20%",
                    selectedTab: "addNode",
                    tabs: [{ id: "addNode", title: "Add node", component: <NodeListComponent /> }],
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
                    tabs: [{ id: "statesView", title: "States", component: <StateViewNodeRenderer /> }],
                },
                {
                    id: "row5",
                    selectedTab: "actionView",
                    height: "40%",
                    tabs: [{ id: "actionView", title: "Actions", component: <StateBehaviorNodeRenderer /> }],
                },
            ],
        },
    ],
};
