import { BlockTools } from "../blockTools";
import type { StateManager } from "shared-ui-components/nodeGraphSystem/stateManager";
import type { IPortData } from "shared-ui-components/nodeGraphSystem/interfaces/portData";
import type { ConnectionPointPortData } from "./connectionPointPortData";
import { NodeParticleBlockConnectionPointTypes } from "core/Particles/Node/Enums/nodeParticleBlockConnectionPointTypes";

export const RegisterNodePortDesign = (stateManager: StateManager) => {
    stateManager.getPortColor = (portData: IPortData) => {
        return BlockTools.GetColorFromConnectionNodeType((portData as ConnectionPointPortData).data.type);
    };
    stateManager.applyNodePortDesign = (portData: IPortData, element: HTMLElement, imgHost: HTMLImageElement, pip: HTMLDivElement) => {
        const connectionPortData = portData as ConnectionPointPortData;
        const point = connectionPortData.data;
        const type = point.type;

        element.style.background = BlockTools.GetColorFromConnectionNodeType(type);
        let svg = "";

        switch (type) {
            case NodeParticleBlockConnectionPointTypes.Int:
                svg =
                    "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIGlkPSJMYXllcl81IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIj48ZGVmcz48c3R5bGU+LmNscy0xe2ZpbGw6I2ZmZjtzdHJva2Utd2lkdGg6MHB4O308L3N0eWxlPjwvZGVmcz48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Im0xNi4wNCwxNC40N2MuOTEtMS4yNCwxLjQ2LTIuNzcsMS40Ni00LjQzLDAtNC4xNC0zLjM2LTcuNS03LjUtNy41cy03LjUsMy4zNi03LjUsNy41YzAsMS42Ni41NSwzLjE5LDEuNDYsNC40M2gxMi4wN1oiLz48L3N2Zz4=";
                break;
            case NodeParticleBlockConnectionPointTypes.Float:
                svg =
                    "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMSAyMSI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiNmZmY7fTwvc3R5bGU+PC9kZWZzPjx0aXRsZT5WZWN0b3IxPC90aXRsZT48ZyBpZD0iTGF5ZXJfNSIgZGF0YS1uYW1lPSJMYXllciA1Ij48Y2lyY2xlIGNsYXNzPSJjbHMtMSIgY3g9IjEwLjUiIGN5PSIxMC41IiByPSI3LjUiLz48L2c+PC9zdmc+";
                break;
            case NodeParticleBlockConnectionPointTypes.Vector2:
                svg =
                    "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMSAyMSI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiNmZmY7fTwvc3R5bGU+PC9kZWZzPjx0aXRsZT5WZWN0b3IyPC90aXRsZT48ZyBpZD0iTGF5ZXJfNSIgZGF0YS1uYW1lPSJMYXllciA1Ij48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0zLDEwLjVhNy41Miw3LjUyLDAsMCwwLDYuNSw3LjQzVjMuMDdBNy41Miw3LjUyLDAsMCwwLDMsMTAuNVoiLz48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0xMS41LDMuMDdWMTcuOTNhNy41LDcuNSwwLDAsMCwwLTE0Ljg2WiIvPjwvZz48L3N2Zz4=";
                break;
            case NodeParticleBlockConnectionPointTypes.Vector3:
                svg =
                    "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMSAyMSI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiNmZmY7fTwvc3R5bGU+PC9kZWZzPjx0aXRsZT5WZWN0b3IzPC90aXRsZT48ZyBpZD0iTGF5ZXJfNSIgZGF0YS1uYW1lPSJMYXllciA1Ij48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0zLjU3LDEzLjMxLDkuNSw5Ljg5VjNBNy41MSw3LjUxLDAsMCwwLDMsMTAuNDYsNy4zMiw3LjMyLDAsMCwwLDMuNTcsMTMuMzFaIi8+PHBhdGggY2xhc3M9ImNscy0xIiBkPSJNMTYuNDMsMTUsMTAuNSwxMS42Miw0LjU3LDE1YTcuNDgsNy40OCwwLDAsMCwxMS44NiwwWiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTE4LDEwLjQ2QTcuNTEsNy41MSwwLDAsMCwxMS41LDNWOS44OWw1LjkzLDMuNDJBNy4zMiw3LjMyLDAsMCwwLDE4LDEwLjQ2WiIvPjwvZz48L3N2Zz4=";
                break;
            case NodeParticleBlockConnectionPointTypes.Color4:
                svg =
                    "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMSAyMSI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiNmZmY7fTwvc3R5bGU+PC9kZWZzPjx0aXRsZT5WZWN0b3I0PC90aXRsZT48ZyBpZD0iTGF5ZXJfNSIgZGF0YS1uYW1lPSJMYXllciA1Ij48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0xMS41LDExLjV2Ni40M2E3LjUxLDcuNTEsMCwwLDAsNi40My02LjQzWiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTExLjUsMy4wN1Y5LjVoNi40M0E3LjUxLDcuNTEsMCwwLDAsMTEuNSwzLjA3WiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTkuNSwxNy45M1YxMS41SDMuMDdBNy41MSw3LjUxLDAsMCwwLDkuNSwxNy45M1oiLz48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik05LjUsMy4wN0E3LjUxLDcuNTEsMCwwLDAsMy4wNyw5LjVIOS41WiIvPjwvZz48L3N2Zz4=";
                break;
            case NodeParticleBlockConnectionPointTypes.Matrix:
                svg =
                    "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMSAyMSI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiNmZmY7fTwvc3R5bGU+PC9kZWZzPjx0aXRsZT5NYXRyaXg8L3RpdGxlPjxnIGlkPSJMYXllcl81IiBkYXRhLW5hbWU9IkxheWVyIDUiPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTExLjUsNi4xMVY5LjVoMy4zOUE0LjUxLDQuNTEsMCwwLDAsMTEuNSw2LjExWiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTExLjUsMTQuODlhNC41MSw0LjUxLDAsMCwwLDMuMzktMy4zOUgxMS41WiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTExLjUsMy4wN3YyQTUuNTQsNS41NCwwLDAsMSwxNS45Miw5LjVoMkE3LjUxLDcuNTEsMCwwLDAsMTEuNSwzLjA3WiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTE1LjkyLDExLjVhNS41NCw1LjU0LDAsMCwxLTQuNDIsNC40MnYyYTcuNTEsNy41MSwwLDAsMCw2LjQzLTYuNDNaIi8+PHBhdGggY2xhc3M9ImNscy0xIiBkPSJNNS4wOCwxMS41aC0yQTcuNTEsNy41MSwwLDAsMCw5LjUsMTcuOTN2LTJBNS41NCw1LjU0LDAsMCwxLDUuMDgsMTEuNVoiLz48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik05LjUsMy4wN0E3LjUxLDcuNTEsMCwwLDAsMy4wNyw5LjVoMkE1LjU0LDUuNTQsMCwwLDEsOS41LDUuMDhaIi8+PHBhdGggY2xhc3M9ImNscy0xIiBkPSJNOS41LDExLjVINi4xMUE0LjUxLDQuNTEsMCwwLDAsOS41LDE0Ljg5WiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTkuNSw2LjExQTQuNTEsNC41MSwwLDAsMCw2LjExLDkuNUg5LjVaIi8+PC9nPjwvc3ZnPg==";
                break;
            case NodeParticleBlockConnectionPointTypes.FloatGradient:
            case NodeParticleBlockConnectionPointTypes.Vector2Gradient:
            case NodeParticleBlockConnectionPointTypes.Vector3Gradient:
            case NodeParticleBlockConnectionPointTypes.Color4Gradient:
                svg =
                    "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMSIgaGVpZ2h0PSIyMSIgdmlld0JveD0iMCAwIDIxIDIxIj48Y2lyY2xlIGN4PSI3LjEiIGN5PSIxMy4wOCIgcj0iMy4yNSIgc3R5bGU9ImZpbGw6I2ZmZiIvPjxwYXRoIGQ9Ik0xMC40OSwzQTcuNTIsNy41MiwwLDAsMCwzLDEwYTUuMTMsNS4xMywwLDEsMSw2LDcuODUsNy42MSw3LjYxLDAsMCwwLDEuNTIuMTYsNy41Miw3LjUyLDAsMCwwLDAtMTVaIiBzdHlsZT0iZmlsbDojZmZmIi8+PC9zdmc+";
                break;
            case NodeParticleBlockConnectionPointTypes.Particle:
                svg =
                    "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIGlkPSJMYXllcl81IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIj48ZGVmcz48c3R5bGU+LmNscy0xe2ZpbGw6I2ZmZjt9LmNscy0ye2ZpbGw6Izg0OTk1Yzt9PC9zdHlsZT48L2RlZnM+PHBhdGggY2xhc3M9ImNscy0yIiBkPSJtMTAsMjBDNC40OSwyMCwwLDE1LjUxLDAsMTBTNC40OSwwLDEwLDBzMTAsNC40OSwxMCwxMC00LjQ5LDEwLTEwLDEwWiIvPjxwb2x5Z29uIGNsYXNzPSJjbHMtMSIgcG9pbnRzPSI5LjE1IDEwLjQ5IDMuMzkgNy4xNyAzLjM5IDEzLjgxIDkuMTUgMTcuMTQgOS4xNSAxMC40OSIvPjxwb2x5Z29uIGNsYXNzPSJjbHMtMSIgcG9pbnRzPSIxMCA5LjAyIDE1Ljc2IDUuNjkgMTAgMi4zNyA0LjI0IDUuNjkgMTAgOS4wMiIvPjxwb2x5Z29uIGNsYXNzPSJjbHMtMSIgcG9pbnRzPSIxMC44NSAxMC40OSAxMC44NSAxNy4xNCAxNi42MSAxMy44MSAxNi42MSA3LjE3IDEwLjg1IDEwLjQ5Ii8+PC9zdmc+";
                break;
            case NodeParticleBlockConnectionPointTypes.Texture:
                svg =
                    "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIGlkPSJMYXllcl81IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIj48ZGVmcz48c3R5bGU+LmNscy0xe2ZpbGw6I2ZmZjtzdHJva2Utd2lkdGg6MHB4O308L3N0eWxlPjwvZGVmcz48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Im0xMCwyLjEyYy00LjM0LDAtNy44OCwzLjUzLTcuODgsNy44OHMzLjUzLDcuODgsNy44OCw3Ljg4LDcuODgtMy41Myw3Ljg4LTcuODgtMy41My03Ljg4LTcuODgtNy44OFptMCwxLjc5YzEuMTIsMCwyLjE3LjMxLDMuMDYuODQtLjY4LS4wNC0xLjM3LjEyLTEuOTcuNDctLjQ0LjI1LS44LjU5LTEuMDkuOTktLjI4LS4zOS0uNjUtLjczLTEuMDktLjk5LS42MS0uMzUtMS4yOS0uNTEtMS45Ny0uNDcuOS0uNTMsMS45NC0uODQsMy4wNi0uODRabS02LjA1LDYuMDVzMC0uMDQsMC0uMDVjLjMxLjYxLjc5LDEuMTMsMS4zOSwxLjQ4LjQ0LjI2LjkyLjQsMS40LjQ1LS4yLjQ0LS4zMS45Mi0uMzEsMS40NCwwLC43Mi4yMiwxLjM5LjU5LDEuOTUtMS44My0xLjA0LTMuMDgtMy0zLjA4LTUuMjZabTIuMjEuMDJjLS40NS0uMjYtLjc3LS42OC0uOS0xLjE4LS4xMy0uNS0uMDctMS4wMi4xOS0xLjQ3aDBjLjI2LS40NS42OC0uNzcsMS4xOC0uOS4xNy0uMDUuMzQtLjA3LjUxLS4wNy4zNCwwLC42Ny4wOS45Ni4yNi45My41MywxLjI0LDEuNzIuNzEsMi42NS0uMjYuNDUtLjY4Ljc3LTEuMTguOS0uNS4xMy0xLjAyLjA3LTEuNDctLjE5Wm0zLjg0LDUuMjNjLTEuMDcsMC0xLjk0LS44Ny0xLjk0LTEuOTRzLjg3LTEuOTQsMS45NC0xLjk0LDEuOTQuODcsMS45NCwxLjk0LS44NywxLjk0LTEuOTQsMS45NFptMi4zNy01LjA0Yy0uNS0uMTMtLjkyLS40NS0xLjE4LS45LS4yNi0uNDUtLjMzLS45Ny0uMTktMS40Ny4xMy0uNS40NS0uOTIuOS0xLjE4LjMtLjE3LjYzLS4yNi45Ni0uMjYuMTcsMCwuMzQuMDIuNTEuMDcuNS4xMy45Mi40NSwxLjE4LjloMGMuMjYuNDUuMzMuOTcuMTksMS40Ny0uMTMuNS0uNDUuOTItLjksMS4xOC0uNDUuMjYtLjk3LjMzLTEuNDcuMTlabS42LDUuMDVjLjM3LS41Ni41OS0xLjIzLjU5LTEuOTUsMC0uNTEtLjExLTEtLjMxLTEuNDQuNDktLjA1Ljk2LS4yLDEuNC0uNDUuNjEtLjM1LDEuMDktLjg2LDEuMzktMS40OCwwLC4wMiwwLC4wNCwwLC4wNiwwLDIuMjYtMS4yNCw0LjIyLTMuMDgsNS4yNloiLz48L3N2Zz4=";
                break;
            case NodeParticleBlockConnectionPointTypes.AutoDetect:
            case NodeParticleBlockConnectionPointTypes.BasedOnInput:
                svg =
                    "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBpZD0iTGF5ZXJfNSIgZGF0YS1uYW1lPSJMYXllciA1IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIj4KICA8ZGVmcz4KICAgIDxzdHlsZT4KICAgICAgLmNscy0xIHsKICAgICAgICBmaWxsOiAjZmZmOwogICAgICB9CiAgICA8L3N0eWxlPgogIDwvZGVmcz4KICA8cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0xMSwxMS43M3Y1LjY5YzItLjI3LDMuNzUtMS4zMiw0LjkzLTIuODVsLTQuOTMtMi44NVoiLz4KICA8cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik05LDguMjdWMi41N2MtMiwuMjctMy43NSwxLjMyLTQuOTMsMi44NWw0LjkzLDIuODVaIi8+CiAgPHBhdGggY2xhc3M9ImNscy0xIiBkPSJNMTYuOTMsMTIuODVjLjM2LS44OC41Ny0xLjg0LjU3LTIuODVzLS4yLTEuOTctLjU3LTIuODVsLTQuOTMsMi44NSw0LjkzLDIuODVaIi8+CiAgPHBhdGggY2xhc3M9ImNscy0xIiBkPSJNMTEsOC4yN2w0LjkzLTIuODVjLTEuMTgtMS41Mi0yLjkzLTIuNTgtNC45My0yLjg1djUuNjlaIi8+CiAgPHBhdGggY2xhc3M9ImNscy0xIiBkPSJNOSwxMS43M2wtNC45MywyLjg1YzEuMTgsMS41MiwyLjkzLDIuNTgsNC45MywyLjg1di01LjY5WiIvPgogIDxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTMuMDcsNy4xNWMtLjM2Ljg4LS41NywxLjg0LS41NywyLjg1cy4yLDEuOTcuNTcsMi44NWw0LjkzLTIuODUtNC45My0yLjg1WiIvPgo8L3N2Zz4=";
                break;
            case NodeParticleBlockConnectionPointTypes.System:
                svg =
                    "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIGlkPSJMYXllcl81IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIj48ZGVmcz48c3R5bGU+LmNscy0xe2ZpbGw6I2ZmZjtzdHJva2Utd2lkdGg6MHB4O308L3N0eWxlPjwvZGVmcz48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Im0xMCwyLjEyYy00LjM0LDAtNy44OCwzLjUzLTcuODgsNy44OHMzLjUzLDcuODgsNy44OCw3Ljg4LDcuODgtMy41Myw3Ljg4LTcuODgtMy41My03Ljg4LTcuODgtNy44OFptMCwxLjc5YzEuMTIsMCwyLjE3LjMxLDMuMDYuODQtLjY4LS4wNC0xLjM3LjEyLTEuOTcuNDctLjQ0LjI1LS44LjU5LTEuMDkuOTktLjI4LS4zOS0uNjUtLjczLTEuMDktLjk5LS42MS0uMzUtMS4yOS0uNTEtMS45Ny0uNDcuOS0uNTMsMS45NC0uODQsMy4wNi0uODRabS02LjA1LDYuMDVzMC0uMDQsMC0uMDVjLjMxLjYxLjc5LDEuMTMsMS4zOSwxLjQ4LjQ0LjI2LjkyLjQsMS40LjQ1LS4yLjQ0LS4zMS45Mi0uMzEsMS40NCwwLC43Mi4yMiwxLjM5LjU5LDEuOTUtMS44My0xLjA0LTMuMDgtMy0zLjA4LTUuMjZabTIuMjEuMDJjLS40NS0uMjYtLjc3LS42OC0uOS0xLjE4LS4xMy0uNS0uMDctMS4wMi4xOS0xLjQ3aDBjLjI2LS40NS42OC0uNzcsMS4xOC0uOS4xNy0uMDUuMzQtLjA3LjUxLS4wNy4zNCwwLC42Ny4wOS45Ni4yNi45My41MywxLjI0LDEuNzIuNzEsMi42NS0uMjYuNDUtLjY4Ljc3LTEuMTguOS0uNS4xMy0xLjAyLjA3LTEuNDctLjE5Wm0zLjg0LDUuMjNjLTEuMDcsMC0xLjk0LS44Ny0xLjk0LTEuOTRzLjg3LTEuOTQsMS45NC0xLjk0LDEuOTQuODcsMS45NCwxLjk0LS44NywxLjk0LTEuOTQsMS45NFptMi4zNy01LjA0Yy0uNS0uMTMtLjkyLS40NS0xLjE4LS45LS4yNi0uNDUtLjMzLS45Ny0uMTktMS40Ny4xMy0uNS40NS0uOTIuOS0xLjE4LjMtLjE3LjYzLS4yNi45Ni0uMjYuMTcsMCwuMzQuMDIuNTEuMDcuNS4xMy45Mi40NSwxLjE4LjloMGMuMjYuNDUuMzMuOTcuMTksMS40Ny0uMTMuNS0uNDUuOTItLjksMS4xOC0uNDUuMjYtLjk3LjMzLTEuNDcuMTlabS42LDUuMDVjLjM3LS41Ni41OS0xLjIzLjU5LTEuOTUsMC0uNTEtLjExLTEtLjMxLTEuNDQuNDktLjA1Ljk2LS4yLDEuNC0uNDUuNjEtLjM1LDEuMDktLjg2LDEuMzktMS40OCwwLC4wMiwwLC4wNCwwLC4wNiwwLDIuMjYtMS4yNCw0LjIyLTMuMDgsNS4yNloiLz48L3N2Zz4=";
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

        if (
            !point.isConnected &&
            point.value !== undefined &&
            point.value !== null &&
            point.value !== point.defaultValue &&
            (!point.value.equals || !point.value.equals(point.defaultValue))
        ) {
            pip.style.display = "";
            pip.style.pointerEvents = "none";
        } else {
            pip.style.display = "none";
        }

        return isOptional;
    };
};
