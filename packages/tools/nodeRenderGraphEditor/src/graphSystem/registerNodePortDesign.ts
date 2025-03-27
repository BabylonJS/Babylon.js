import { BlockTools } from "../blockTools";
import type { StateManager } from "shared-ui-components/nodeGraphSystem/stateManager";
import type { IPortData } from "shared-ui-components/nodeGraphSystem/interfaces/portData";
import type { ConnectionPointPortData } from "./connectionPointPortData";
import { NodeRenderGraphBlockConnectionPointTypes } from "core/FrameGraph/Node/Types/nodeRenderGraphTypes";

export const RegisterNodePortDesign = (stateManager: StateManager) => {
    stateManager.getPortColor = (portData: IPortData) => {
        return BlockTools.GetColorFromConnectionNodeType((portData as ConnectionPointPortData).data.type);
    };
    stateManager.applyNodePortDesign = (portData: IPortData, element: HTMLElement, imgHost: HTMLImageElement, _pip: HTMLDivElement) => {
        const connectionPortData = portData as ConnectionPointPortData;
        const point = connectionPortData.data;
        const type = point.type;

        if (point.isOptional && !point.isConnected) {
            element.style.background = "#000";
        } else {
            element.style.background = BlockTools.GetColorFromConnectionNodeType(type);
        }
        let svg = "";
        switch (type) {
            case NodeRenderGraphBlockConnectionPointTypes.ObjectList:
                svg =
                    "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIGlkPSJMYXllcl81IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIj48ZGVmcz48c3R5bGU+LmNscy0xe2ZpbGw6I2ZmZjt9LmNscy0ye2ZpbGw6Izg0OTk1Yzt9PC9zdHlsZT48L2RlZnM+PHBhdGggY2xhc3M9ImNscy0yIiBkPSJtMTAsMjBDNC40OSwyMCwwLDE1LjUxLDAsMTBTNC40OSwwLDEwLDBzMTAsNC40OSwxMCwxMC00LjQ5LDEwLTEwLDEwWiIvPjxwb2x5Z29uIGNsYXNzPSJjbHMtMSIgcG9pbnRzPSI5LjE1IDEwLjQ5IDMuMzkgNy4xNyAzLjM5IDEzLjgxIDkuMTUgMTcuMTQgOS4xNSAxMC40OSIvPjxwb2x5Z29uIGNsYXNzPSJjbHMtMSIgcG9pbnRzPSIxMCA5LjAyIDE1Ljc2IDUuNjkgMTAgMi4zNyA0LjI0IDUuNjkgMTAgOS4wMiIvPjxwb2x5Z29uIGNsYXNzPSJjbHMtMSIgcG9pbnRzPSIxMC44NSAxMC40OSAxMC44NSAxNy4xNCAxNi42MSAxMy44MSAxNi42MSA3LjE3IDEwLjg1IDEwLjQ5Ii8+PC9zdmc+";
                break;
            case NodeRenderGraphBlockConnectionPointTypes.Camera:
                svg =
                    "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBpZD0iTGF5ZXJfNSIgZGF0YS1uYW1lPSJMYXllciA1IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIj4KICA8ZGVmcz4KICAgIDxzdHlsZT4KICAgICAgLmNscy0xIHsKICAgICAgICBmaWxsOiAjZmZmOwogICAgICB9CiAgICA8L3N0eWxlPgogIDwvZGVmcz4KICA8cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0yLjk3LDcuMzZjMC0xLjI2LDEuMDItMi4yOCwyLjI4LTIuMjhoNC41N2MxLjI2LDAsMi4yOCwxLjAyLDIuMjgsMi4yOHY1LjI3YzAsMS4yNi0xLjAyLDIuMjgtMi4yOCwyLjI4aC00LjU3Yy0xLjI2LDAtMi4yOC0xLjAyLTIuMjgtMi4yOHYtNS4yN1pNMTUuMSwxNGwtMi4yOS0xLjU4di00LjgzbDIuMjktMS41OGMuODItLjU2LDEuOTMuMDIsMS45MywxLjAxdjUuOTdjMCwuOTktMS4xMSwxLjU4LTEuOTMsMS4wMVoiLz4KPC9zdmc+";
                break;
            case NodeRenderGraphBlockConnectionPointTypes.ShadowGenerator:
                svg =
                    "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBpZD0iTGF5ZXJfNSIgZGF0YS1uYW1lPSJMYXllciA1IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIj4KICA8ZGVmcz4KICAgIDxzdHlsZT4KICAgICAgLmNscy0xIHsKICAgICAgICBmaWxsOiAjZmZmOwogICAgICB9CiAgICA8L3N0eWxlPgogIDwvZGVmcz4KICA8cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0xMi4wNSwxNy4yOGMuMzYtLjEuNy0uMjMsMS4wNC0uMzdsLTIuOS0yLjljLS4yMi0uMjItLjIyLS41OCwwLS44cy41OC0uMjIuOCwwbDMuMTMsMy4xM2MuMjgtLjE4LjU1LS4zOS44MS0uNjFsLTIuODYtMi44NmMtLjIyLS4yMi0uMjItLjU4LDAtLjhzLjU4LS4yMi44LDBsMi44NiwyLjg2Yy4yMi0uMjUuNDItLjUyLjYxLS44MWwtMy4xMy0zLjEzYy0uMjItLjIyLS4yMi0uNTgsMC0uOHMuNTgtLjIyLjgsMGwyLjksMi45Yy4xNS0uMzMuMjctLjY4LjM3LTEuMDRsLTMuMzItMy4zMmMtLjIyLS4yMi0uMjItLjU4LDAtLjguMjItLjIyLjU4LS4yMi44LDBsMi43NywyLjc3Yy4wMi0uMjIuMDMtLjQ1LjAzLS42OCwwLS4yNS0uMDEtLjUtLjA0LS43NGwtMy4zNy0zLjM3Yy0uMjItLjIyLS4yMi0uNTgsMC0uOC4yMi0uMjIuNTgtLjIyLjgsMGwyLjA0LDIuMDRjLTEuMTMtMi43My0zLjgyLTQuNjUtNi45NS00LjY1LTQuMTUsMC03LjUyLDMuMzctNy41Miw3LjUyLDAsMy4xNCwxLjkyLDUuODMsNC42NSw2Ljk1bC0yLjA0LTIuMDRjLS4yMi0uMjItLjIyLS41OCwwLS44LjIyLS4yMi41OC0uMjIuOCwwbDMuMzcsMy4zN2MuMjQuMDIuNDkuMDQuNzQuMDQuMjMsMCwuNDUtLjAxLjY4LS4wM2wtMi43Ny0yLjc3Yy0uMjItLjIyLS4yMi0uNTgsMC0uOC4yMi0uMjIuNTgtLjIyLjgsMGwzLjMyLDMuMzJaIi8+Cjwvc3ZnPg==";
                break;
            case NodeRenderGraphBlockConnectionPointTypes.ShadowLight:
                svg =
                    "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBpZD0iTGF5ZXJfNSIgZGF0YS1uYW1lPSJMYXllciA1IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIj4KICA8ZGVmcz4KICAgIDxzdHlsZT4KICAgICAgLmNscy0xIHsKICAgICAgICBmaWxsOiAjZmZmOwogICAgICB9CiAgICA8L3N0eWxlPgogIDwvZGVmcz4KICA8cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0xMi41OSwxNS4xMmwtLjIxLjkyYy0uMTYuNy0uNzYsMS4yMS0xLjQ4LDEuMjdoLS4xM3MtMS41NCwwLTEuNTQsMGMtLjcyLDAtMS4zNi0uNDctMS41Ny0xLjE1bC0uMDMtLjEyLS4yMS0uOTJoNS4xN1pNMTAsMi42OWMyLjkzLDAsNS4zLDIuMzcsNS4zLDUuMywwLDEuNTYtLjY4LDIuOTktMi4wMiw0LjI3LS4wMy4wMi0uMDQuMDYtLjA1LjA5bC0uMzksMS42N2gtNS42OGwtLjM4LTEuNjdzLS4wMy0uMDctLjA1LS4wOWMtMS4zNC0xLjI4LTIuMDItMi43MS0yLjAyLTQuMjcsMC0yLjkzLDIuMzctNS4zLDUuMy01LjNaIi8+Cjwvc3ZnPg==";
                break;
            case NodeRenderGraphBlockConnectionPointTypes.TextureBackBufferDepthStencilAttachment:
            case NodeRenderGraphBlockConnectionPointTypes.TextureBackBuffer:
            case NodeRenderGraphBlockConnectionPointTypes.Texture:
            case NodeRenderGraphBlockConnectionPointTypes.TextureDepthStencilAttachment:
            case NodeRenderGraphBlockConnectionPointTypes.TextureViewDepth:
            case NodeRenderGraphBlockConnectionPointTypes.TextureViewNormal:
            case NodeRenderGraphBlockConnectionPointTypes.TextureAlbedo:
            case NodeRenderGraphBlockConnectionPointTypes.TextureReflectivity:
            case NodeRenderGraphBlockConnectionPointTypes.TextureWorldPosition:
            case NodeRenderGraphBlockConnectionPointTypes.TextureVelocity:
            case NodeRenderGraphBlockConnectionPointTypes.TextureScreenDepth:
            case NodeRenderGraphBlockConnectionPointTypes.TextureLocalPosition:
            case NodeRenderGraphBlockConnectionPointTypes.TextureWorldNormal:
            case NodeRenderGraphBlockConnectionPointTypes.TextureLinearVelocity:
                svg =
                    "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIGlkPSJMYXllcl81IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIj48ZGVmcz48c3R5bGU+LmNscy0xe2ZpbGw6I2ZmZjtzdHJva2Utd2lkdGg6MHB4O308L3N0eWxlPjwvZGVmcz48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Im0xMCwyLjEyYy00LjM0LDAtNy44OCwzLjUzLTcuODgsNy44OHMzLjUzLDcuODgsNy44OCw3Ljg4LDcuODgtMy41Myw3Ljg4LTcuODgtMy41My03Ljg4LTcuODgtNy44OFptMCwxLjc5YzEuMTIsMCwyLjE3LjMxLDMuMDYuODQtLjY4LS4wNC0xLjM3LjEyLTEuOTcuNDctLjQ0LjI1LS44LjU5LTEuMDkuOTktLjI4LS4zOS0uNjUtLjczLTEuMDktLjk5LS42MS0uMzUtMS4yOS0uNTEtMS45Ny0uNDcuOS0uNTMsMS45NC0uODQsMy4wNi0uODRabS02LjA1LDYuMDVzMC0uMDQsMC0uMDVjLjMxLjYxLjc5LDEuMTMsMS4zOSwxLjQ4LjQ0LjI2LjkyLjQsMS40LjQ1LS4yLjQ0LS4zMS45Mi0uMzEsMS40NCwwLC43Mi4yMiwxLjM5LjU5LDEuOTUtMS44My0xLjA0LTMuMDgtMy0zLjA4LTUuMjZabTIuMjEuMDJjLS40NS0uMjYtLjc3LS42OC0uOS0xLjE4LS4xMy0uNS0uMDctMS4wMi4xOS0xLjQ3aDBjLjI2LS40NS42OC0uNzcsMS4xOC0uOS4xNy0uMDUuMzQtLjA3LjUxLS4wNy4zNCwwLC42Ny4wOS45Ni4yNi45My41MywxLjI0LDEuNzIuNzEsMi42NS0uMjYuNDUtLjY4Ljc3LTEuMTguOS0uNS4xMy0xLjAyLjA3LTEuNDctLjE5Wm0zLjg0LDUuMjNjLTEuMDcsMC0xLjk0LS44Ny0xLjk0LTEuOTRzLjg3LTEuOTQsMS45NC0xLjk0LDEuOTQuODcsMS45NCwxLjk0LS44NywxLjk0LTEuOTQsMS45NFptMi4zNy01LjA0Yy0uNS0uMTMtLjkyLS40NS0xLjE4LS45LS4yNi0uNDUtLjMzLS45Ny0uMTktMS40Ny4xMy0uNS40NS0uOTIuOS0xLjE4LjMtLjE3LjYzLS4yNi45Ni0uMjYuMTcsMCwuMzQuMDIuNTEuMDcuNS4xMy45Mi40NSwxLjE4LjloMGMuMjYuNDUuMzMuOTcuMTksMS40Ny0uMTMuNS0uNDUuOTItLjksMS4xOC0uNDUuMjYtLjk3LjMzLTEuNDcuMTlabS42LDUuMDVjLjM3LS41Ni41OS0xLjIzLjU5LTEuOTUsMC0uNTEtLjExLTEtLjMxLTEuNDQuNDktLjA1Ljk2LS4yLDEuNC0uNDUuNjEtLjM1LDEuMDktLjg2LDEuMzktMS40OCwwLC4wMiwwLC4wNCwwLC4wNiwwLDIuMjYtMS4yNCw0LjIyLTMuMDgsNS4yNloiLz48L3N2Zz4=";
                break;
            case NodeRenderGraphBlockConnectionPointTypes.ResourceContainer:
                svg =
                    "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBpZD0iTGF5ZXJfNSIgZGF0YS1uYW1lPSJMYXllciA1IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIj4KICA8ZGVmcz4KICAgIDxzdHlsZT4KICAgICAgLmNscy0xIHsKICAgICAgICBmaWxsOiAjZmZmOwogICAgICB9CiAgICA8L3N0eWxlPgogIDwvZGVmcz4KICA8cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik05LjAyLDE3LjQydi02LjQySDIuNjFjLjQ1LDMuMzMsMy4wOCw1Ljk3LDYuNDEsNi40MloiLz4KICA8cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0xMSwxNy40M2MzLjM1LS40Myw2LjAxLTMuMDgsNi40Ni02LjQzaC02LjQ2djYuNDNaIi8+CiAgPHBhdGggY2xhc3M9ImNscy0xIiBkPSJNMTMuOTEsMy41OHY1LjQyaDMuNTVjLS4zMS0yLjI5LTEuNjUtNC4yNi0zLjU1LTUuNDJaIi8+CiAgPHBhdGggY2xhc3M9ImNscy0xIiBkPSJNNi4xMSwzLjYyYy0xLjg3LDEuMTYtMy4xOSwzLjExLTMuNSw1LjM4aDMuNVYzLjYyWiIvPgogIDxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTExLjkzLDIuNzVjLS42MS0uMTYtMS4yNC0uMjUtMS44OS0uMjVzLTEuMzMuMDktMS45NS4yNnY2LjI0aDMuODRWMi43NVoiLz4KPC9zdmc+";
                break;
            case NodeRenderGraphBlockConnectionPointTypes.Object:
                svg =
                    "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMSIgaGVpZ2h0PSIyMSIgdmlld0JveD0iMCAwIDIxIDIxIj48Y2lyY2xlIGN4PSI3LjEiIGN5PSIxMy4wOCIgcj0iMy4yNSIgc3R5bGU9ImZpbGw6I2ZmZiIvPjxwYXRoIGQ9Ik0xMC40OSwzQTcuNTIsNy41MiwwLDAsMCwzLDEwYTUuMTMsNS4xMywwLDEsMSw2LDcuODUsNy42MSw3LjYxLDAsMCwwLDEuNTIuMTYsNy41Miw3LjUyLDAsMCwwLDAtMTVaIiBzdHlsZT0iZmlsbDojZmZmIi8+PC9zdmc+";
                break;
            case NodeRenderGraphBlockConnectionPointTypes.AutoDetect:
                svg =
                    "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBpZD0iTGF5ZXJfNSIgZGF0YS1uYW1lPSJMYXllciA1IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIj4KICA8ZGVmcz4KICAgIDxzdHlsZT4KICAgICAgLmNscy0xIHsKICAgICAgICBmaWxsOiAjZmZmOwogICAgICB9CiAgICA8L3N0eWxlPgogIDwvZGVmcz4KICA8cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0xMSwxMS43M3Y1LjY5YzItLjI3LDMuNzUtMS4zMiw0LjkzLTIuODVsLTQuOTMtMi44NVoiLz4KICA8cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik05LDguMjdWMi41N2MtMiwuMjctMy43NSwxLjMyLTQuOTMsMi44NWw0LjkzLDIuODVaIi8+CiAgPHBhdGggY2xhc3M9ImNscy0xIiBkPSJNMTYuOTMsMTIuODVjLjM2LS44OC41Ny0xLjg0LjU3LTIuODVzLS4yLTEuOTctLjU3LTIuODVsLTQuOTMsMi44NSw0LjkzLDIuODVaIi8+CiAgPHBhdGggY2xhc3M9ImNscy0xIiBkPSJNMTEsOC4yN2w0LjkzLTIuODVjLTEuMTgtMS41Mi0yLjkzLTIuNTgtNC45My0yLjg1djUuNjlaIi8+CiAgPHBhdGggY2xhc3M9ImNscy0xIiBkPSJNOSwxMS43M2wtNC45MywyLjg1YzEuMTgsMS41MiwyLjkzLDIuNTgsNC45MywyLjg1di01LjY5WiIvPgogIDxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTMuMDcsNy4xNWMtLjM2Ljg4LS41NywxLjg0LS41NywyLjg1cy4yLDEuOTcuNTcsMi44NWw0LjkzLTIuODUtNC45My0yLjg1WiIvPgo8L3N2Zz4=";
                break;
        }

        const isOptional = point.isOptional && !point.isConnected;

        if (isOptional) {
            const decoded = atob(svg);
            svg = btoa(decoded.replace(/fill:\s*#fff/g, "fill:#767676"));
        }

        imgHost.src = "data:image/svg+xml;base64," + svg;
        imgHost.style.width = "100%"; // it's so that the svg is correctly centered inside the outer circle
        imgHost.style.height = "100%";

        return isOptional;
    };
};
