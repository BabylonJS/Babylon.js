import { BlockTools } from "../blockTools.js";
import type { StateManager } from "@babylonjs/shared-ui-components/nodeGraphSystem/stateManager";
import type { IPortData } from "@babylonjs/shared-ui-components/nodeGraphSystem/interfaces/portData";
import type { ConnectionPointPortData } from "./connectionPointPortData";
import { ConnectionPointType } from "@babylonjs/smart-filters";

export const RegisterNodePortDesign = (stateManager: StateManager) => {
    stateManager.applyNodePortDesign = (portData: IPortData, element: HTMLElement, imgHost: HTMLImageElement) => {
        const type = (portData as ConnectionPointPortData).data.type;

        element.style.background = BlockTools.GetColorFromConnectionNodeType(type);
        let svg = "";
        switch (type) {
            case ConnectionPointType.Float:
                svg =
                    "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMSAyMSI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiNmZmY7fTwvc3R5bGU+PC9kZWZzPjx0aXRsZT5WZWN0b3IxPC90aXRsZT48ZyBpZD0iTGF5ZXJfNSIgZGF0YS1uYW1lPSJMYXllciA1Ij48Y2lyY2xlIGNsYXNzPSJjbHMtMSIgY3g9IjEwLjUiIGN5PSIxMC41IiByPSI3LjUiLz48L2c+PC9zdmc+";
                break;
            case ConnectionPointType.Boolean:
                svg =
                    "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIGlkPSJMYXllcl81IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIj48ZGVmcz48c3R5bGU+LmNscy0xe2ZpbGw6I2ZmZjtzdHJva2Utd2lkdGg6MHB4O308L3N0eWxlPjwvZGVmcz48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Im0xNi4wNCwxNC40N2MuOTEtMS4yNCwxLjQ2LTIuNzcsMS40Ni00LjQzLDAtNC4xNC0zLjM2LTcuNS03LjUtNy41cy03LjUsMy4zNi03LjUsNy41YzAsMS42Ni41NSwzLjE5LDEuNDYsNC40M2gxMi4wN1oiLz48L3N2Zz4=";
                break;
            case ConnectionPointType.Vector2:
                svg =
                    "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMSAyMSI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiNmZmY7fTwvc3R5bGU+PC9kZWZzPjx0aXRsZT5WZWN0b3IyPC90aXRsZT48ZyBpZD0iTGF5ZXJfNSIgZGF0YS1uYW1lPSJMYXllciA1Ij48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0zLDEwLjVhNy41Miw3LjUyLDAsMCwwLDYuNSw3LjQzVjMuMDdBNy41Miw3LjUyLDAsMCwwLDMsMTAuNVoiLz48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0xMS41LDMuMDdWMTcuOTNhNy41LDcuNSwwLDAsMCwwLTE0Ljg2WiIvPjwvZz48L3N2Zz4=";
                break;
            case ConnectionPointType.Color3:
                svg =
                    "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMSAyMSI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiNmZmY7fTwvc3R5bGU+PC9kZWZzPjx0aXRsZT5WZWN0b3IzPC90aXRsZT48ZyBpZD0iTGF5ZXJfNSIgZGF0YS1uYW1lPSJMYXllciA1Ij48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0zLjU3LDEzLjMxLDkuNSw5Ljg5VjNBNy41MSw3LjUxLDAsMCwwLDMsMTAuNDYsNy4zMiw3LjMyLDAsMCwwLDMuNTcsMTMuMzFaIi8+PHBhdGggY2xhc3M9ImNscy0xIiBkPSJNMTYuNDMsMTUsMTAuNSwxMS42Miw0LjU3LDE1YTcuNDgsNy40OCwwLDAsMCwxMS44NiwwWiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTE4LDEwLjQ2QTcuNTEsNy41MSwwLDAsMCwxMS41LDNWOS44OWw1LjkzLDMuNDJBNy4zMiw3LjMyLDAsMCwwLDE4LDEwLjQ2WiIvPjwvZz48L3N2Zz4=";
                break;
            case ConnectionPointType.Color4:
                svg =
                    "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMSAyMSI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiNmZmY7fTwvc3R5bGU+PC9kZWZzPjx0aXRsZT5WZWN0b3I0PC90aXRsZT48ZyBpZD0iTGF5ZXJfNSIgZGF0YS1uYW1lPSJMYXllciA1Ij48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0xMS41LDExLjV2Ni40M2E3LjUxLDcuNTEsMCwwLDAsNi40My02LjQzWiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTExLjUsMy4wN1Y5LjVoNi40M0E3LjUxLDcuNTEsMCwwLDAsMTEuNSwzLjA3WiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTkuNSwxNy45M1YxMS41SDMuMDdBNy41MSw3LjUxLDAsMCwwLDkuNSwxNy45M1oiLz48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik05LjUsMy4wN0E3LjUxLDcuNTEsMCwwLDAsMy4wNyw5LjVIOS41WiIvPjwvZz48L3N2Zz4=";
                break;
            case ConnectionPointType.Texture:
                svg =
                    "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIGlkPSJMYXllcl81IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIj48ZGVmcz48c3R5bGU+LmNscy0xe2ZpbGw6I2ZmZjtzdHJva2Utd2lkdGg6MHB4O308L3N0eWxlPjwvZGVmcz48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Im0xMCwyLjEyYy00LjM0LDAtNy44OCwzLjUzLTcuODgsNy44OHMzLjUzLDcuODgsNy44OCw3Ljg4LDcuODgtMy41Myw3Ljg4LTcuODgtMy41My03Ljg4LTcuODgtNy44OFptMCwxLjc5YzEuMTIsMCwyLjE3LjMxLDMuMDYuODQtLjY4LS4wNC0xLjM3LjEyLTEuOTcuNDctLjQ0LjI1LS44LjU5LTEuMDkuOTktLjI4LS4zOS0uNjUtLjczLTEuMDktLjk5LS42MS0uMzUtMS4yOS0uNTEtMS45Ny0uNDcuOS0uNTMsMS45NC0uODQsMy4wNi0uODRabS02LjA1LDYuMDVzMC0uMDQsMC0uMDVjLjMxLjYxLjc5LDEuMTMsMS4zOSwxLjQ4LjQ0LjI2LjkyLjQsMS40LjQ1LS4yLjQ0LS4zMS45Mi0uMzEsMS40NCwwLC43Mi4yMiwxLjM5LjU5LDEuOTUtMS44My0xLjA0LTMuMDgtMy0zLjA4LTUuMjZabTIuMjEuMDJjLS40NS0uMjYtLjc3LS42OC0uOS0xLjE4LS4xMy0uNS0uMDctMS4wMi4xOS0xLjQ3aDBjLjI2LS40NS42OC0uNzcsMS4xOC0uOS4xNy0uMDUuMzQtLjA3LjUxLS4wNy4zNCwwLC42Ny4wOS45Ni4yNi45My41MywxLjI0LDEuNzIuNzEsMi42NS0uMjYuNDUtLjY4Ljc3LTEuMTguOS0uNS4xMy0xLjAyLjA3LTEuNDctLjE5Wm0zLjg0LDUuMjNjLTEuMDcsMC0xLjk0LS44Ny0xLjk0LTEuOTRzLjg3LTEuOTQsMS45NC0xLjk0LDEuOTQuODcsMS45NCwxLjk0LS44NywxLjk0LTEuOTQsMS45NFptMi4zNy01LjA0Yy0uNS0uMTMtLjkyLS40NS0xLjE4LS45LS4yNi0uNDUtLjMzLS45Ny0uMTktMS40Ny4xMy0uNS40NS0uOTIuOS0xLjE4LjMtLjE3LjYzLS4yNi45Ni0uMjYuMTcsMCwuMzQuMDIuNTEuMDcuNS4xMy45Mi40NSwxLjE4LjloMGMuMjYuNDUuMzMuOTcuMTksMS40Ny0uMTMuNS0uNDUuOTItLjksMS4xOC0uNDUuMjYtLjk3LjMzLTEuNDcuMTlabS42LDUuMDVjLjM3LS41Ni41OS0xLjIzLjU5LTEuOTUsMC0uNTEtLjExLTEtLjMxLTEuNDQuNDktLjA1Ljk2LS4yLDEuNC0uNDUuNjEtLjM1LDEuMDktLjg2LDEuMzktMS40OCwwLC4wMiwwLC4wNCwwLC4wNiwwLDIuMjYtMS4yNCw0LjIyLTMuMDgsNS4yNloiLz48L3N2Zz4=";
                break;
        }
        imgHost.src = "data:image/svg+xml;base64," + svg;
        imgHost.style.width = "100%"; // it's so that the svg is correctly centered inside the outer circle
        imgHost.style.height = "100%";

        return false;
    };
};
