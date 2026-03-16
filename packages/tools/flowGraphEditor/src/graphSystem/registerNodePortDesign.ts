import { BlockTools } from "../blockTools";
import type { StateManager } from "shared-ui-components/nodeGraphSystem/stateManager";
import type { IPortData } from "shared-ui-components/nodeGraphSystem/interfaces/portData";
import type { ConnectionPointPortData } from "./connectionPointPortData";
import type { FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
import { FlowGraphTypes } from "core/FlowGraph/flowGraphRichTypes";

// ── Port icon SVGs (base64, matching the NME/NGE/NPE style) ──────────────

/** Solid circle — scalar types (Number, Integer, Boolean, String) */
const _SvgCircle =
    "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMSAyMSI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiNmZmY7fTwvc3R5bGU+PC9kZWZzPjx0aXRsZT5WZWN0b3IxPC90aXRsZT48ZyBpZD0iTGF5ZXJfNSIgZGF0YS1uYW1lPSJMYXllciA1Ij48Y2lyY2xlIGNsYXNzPSJjbHMtMSIgY3g9IjEwLjUiIGN5PSIxMC41IiByPSI3LjUiLz48L2c+PC9zdmc+";

/** Split circle (2 halves) — Vector2 */
const _SvgVec2 =
    "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMSAyMSI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiNmZmY7fTwvc3R5bGU+PC9kZWZzPjx0aXRsZT5WZWN0b3IyPC90aXRsZT48ZyBpZD0iTGF5ZXJfNSIgZGF0YS1uYW1lPSJMYXllciA1Ij48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0zLDEwLjVhNy41Miw3LjUyLDAsMCwwLDYuNSw3LjQzVjMuMDdBNy41Miw3LjUyLDAsMCwwLDMsMTAuNVoiLz48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0xMS41LDMuMDdWMTcuOTNhNy41LDcuNSwwLDAsMCwwLTE0Ljg2WiIvPjwvZz48L3N2Zz4=";

/** Three pie slices — Vector3 / Color3 */
const _SvgVec3 =
    "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMSAyMSI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiNmZmY7fTwvc3R5bGU+PC9kZWZzPjx0aXRsZT5WZWN0b3IzPC90aXRsZT48ZyBpZD0iTGF5ZXJfNSIgZGF0YS1uYW1lPSJMYXllciA1Ij48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0zLjU3LDEzLjMxLDkuNSw5Ljg5VjNBNy41MSw3LjUxLDAsMCwwLDMsMTAuNDYsNy4zMiw3LjMyLDAsMCwwLDMuNTcsMTMuMzFaIi8+PHBhdGggY2xhc3M9ImNscy0xIiBkPSJNMTYuNDMsMTUsMTAuNSwxMS42Miw0LjU3LDE1YTcuNDgsNy40OCwwLDAsMCwxMS44NiwwWiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTE4LDEwLjQ2QTcuNTEsNy41MSwwLDAsMCwxMS41LDNWOS44OWw1LjkzLDMuNDJBNy4zMiw3LjMyLDAsMCwwLDE4LDEwLjQ2WiIvPjwvZz48L3N2Zz4=";

/** Four quadrants — Vector4 / Color4 / Quaternion */
const _SvgVec4 =
    "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMSAyMSI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiNmZmY7fTwvc3R5bGU+PC9kZWZzPjx0aXRsZT5WZWN0b3I0PC90aXRsZT48ZyBpZD0iTGF5ZXJfNSIgZGF0YS1uYW1lPSJMYXllciA1Ij48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0xMS41LDExLjV2Ni40M2E3LjUxLDcuNTEsMCwwLDAsNi40My02LjQzWiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTExLjUsMy4wN1Y5LjVoNi40M0E3LjUxLDcuNTEsMCwwLDAsMTEuNSwzLjA3WiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTkuNSwxNy45M1YxMS41SDMuMDdBNy41MSw3LjUxLDAsMCwwLDkuNSwxNy45M1oiLz48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik05LjUsMy4wN0E3LjUxLDcuNTEsMCwwLDAsMy4wNyw5LjVIOS41WiIvPjwvZz48L3N2Zz4=";

/** Nested rings — Matrix */
const _SvgMatrix =
    "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMSAyMSI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiNmZmY7fTwvc3R5bGU+PC9kZWZzPjx0aXRsZT5NYXRyaXg8L3RpdGxlPjxnIGlkPSJMYXllcl81IiBkYXRhLW5hbWU9IkxheWVyIDUiPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTExLjUsNi4xMVY5LjVoMy4zOUE0LjUxLDQuNTEsMCwwLDAsMTEuNSw2LjExWiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTExLjUsMTQuODlhNC41MSw0LjUxLDAsMCwwLDMuMzktMy4zOUgxMS41WiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTExLjUsMy4wN3YyQTUuNTQsNS41NCwwLDAsMSwxNS45Miw5LjVoMkE3LjUxLDcuNTEsMCwwLDAsMTEuNSwzLjA3WiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTE1LjkyLDExLjVhNS41NCw1LjU0LDAsMCwxLTQuNDIsNC40MnYyYTcuNTEsNy41MSwwLDAsMCw2LjQzLTYuNDNaIi8+PHBhdGggY2xhc3M9ImNscy0xIiBkPSJNNS4wOCwxMS41aC0yQTcuNTEsNy41MSwwLDAsMCw5LjUsMTcuOTN2LTJBNS41NCw1LjU0LDAsMCwxLDUuMDgsMTEuNVoiLz48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik05LjUsMy4wN0E3LjUxLDcuNTEsMCwwLDAsMy4wNyw5LjVoMkE1LjU0LDUuNTQsMCwwLDEsOS41LDUuMDhaIi8+PHBhdGggY2xhc3M9ImNscy0xIiBkPSJNOS41LDExLjVINi4xMUE0LjUxLDQuNTEsMCwwLDAsOS41LDE0Ljg5WiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTkuNSw2LjExQTQuNTEsNC41MSwwLDAsMCw2LjExLDkuNUg5LjVaIi8+PC9nPjwvc3ZnPg==";

/** Asymmetric circles — Object */
const _SvgObject =
    "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMSIgaGVpZ2h0PSIyMSIgdmlld0JveD0iMCAwIDIxIDIxIj48Y2lyY2xlIGN4PSI3LjEiIGN5PSIxMy4wOCIgcj0iMy4yNSIgc3R5bGU9ImZpbGw6I2ZmZiIvPjxwYXRoIGQ9Ik0xMC40OSwzQTcuNTIsNy41MiwwLDAsMCwzLDEwYTUuMTMsNS4xMywwLDEsMSw2LDcuODUsNy42MSw3LjYxLDAsMCwwLDEuNTIuMTYsNy41Miw3LjUyLDAsMCwwLDAtMTVaIiBzdHlsZT0iZmlsbDojZmZmIi8+PC9zdmc+";

/** Star/flower — Any / AutoDetect */
const _SvgAny =
    "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBpZD0iTGF5ZXJfNSIgZGF0YS1uYW1lPSJMYXllciA1IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIj4KICA8ZGVmcz4KICAgIDxzdHlsZT4KICAgICAgLmNscy0xIHsKICAgICAgICBmaWxsOiAjZmZmOwogICAgICB9CiAgICA8L3N0eWxlPgogIDwvZGVmcz4KICA8cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0xMSwxMS43M3Y1LjY5YzItLjI3LDMuNzUtMS4zMiw0LjkzLTIuODVsLTQuOTMtMi44NVoiLz4KICA8cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik05LDguMjdWMi41N2MtMiwuMjctMy43NSwxLjMyLTQuOTMsMi44NWw0LjkzLDIuODVaIi8+CiAgPHBhdGggY2xhc3M9ImNscy0xIiBkPSJNMTYuOTMsMTIuODVjLjM2LS44OC41Ny0xLjg0LjU3LTIuODVzLS4yLTEuOTctLjU3LTIuODVsLTQuOTMsMi44NSw0LjkzLDIuODVaIi8+CiAgPHBhdGggY2xhc3M9ImNscy0xIiBkPSJNMTEsOC4yN2w0LjkzLTIuODVjLTEuMTgtMS41Mi0yLjkzLTIuNTgtNC45My0yLjg1djUuNjlaIi8+CiAgPHBhdGggY2xhc3M9ImNscy0xIiBkPSJNOSwxMS43M2wtNC45MywyLjg1YzEuMTgsMS41MiwyLjkzLDIuNTgsNC45MywyLjg1di01LjY5WiIvPgogIDxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTMuMDcsNy4xNWMtLjM2Ljg4LS41NywxLjg0LS41NywyLjg1cy4yLDEuOTcuNTcsMi44NWw0LjkzLTIuODUtNC45My0yLjg1WiIvPgo8L3N2Zz4=";

/** Signal port triangle */
const _SvgSignal = btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><polygon points="6,3 16,10 6,17" fill="#fff"/></svg>`);

/**
 * Returns the appropriate port SVG (base64) for a data connection's rich type.
 * @param typeName - The rich type name of the connection.
 * @returns The base64-encoded SVG string for the port icon.
 */
function _GetPortSvgForType(typeName: string): string {
    switch (typeName) {
        case FlowGraphTypes.Vector2:
            return _SvgVec2;
        case FlowGraphTypes.Vector3:
        case FlowGraphTypes.Color3:
            return _SvgVec3;
        case FlowGraphTypes.Vector4:
        case FlowGraphTypes.Color4:
        case FlowGraphTypes.Quaternion:
            return _SvgVec4;
        case FlowGraphTypes.Matrix:
        case FlowGraphTypes.Matrix2D:
        case FlowGraphTypes.Matrix3D:
            return _SvgMatrix;
        case FlowGraphTypes.Object:
            return _SvgObject;
        case FlowGraphTypes.Any:
            return _SvgAny;
        default:
            return _SvgCircle;
    }
}

export const RegisterNodePortDesign = (stateManager: StateManager) => {
    stateManager.getPortColor = (portData: IPortData) => {
        const cpd = portData as ConnectionPointPortData;
        if (cpd.connectionKind === "signal") {
            return BlockTools.GetSignalColor();
        }
        return BlockTools.GetColorForDataConnection(cpd.data as FlowGraphDataConnection<any>);
    };

    stateManager.applyNodePortDesign = (portData: IPortData, element: HTMLElement, imgHost: HTMLImageElement, _pip: HTMLDivElement) => {
        const cpd = portData as ConnectionPointPortData;

        if (cpd.connectionKind === "signal") {
            element.style.background = BlockTools.GetSignalColor();
            imgHost.src = "data:image/svg+xml;base64," + _SvgSignal;
        } else {
            const conn = cpd.data as FlowGraphDataConnection<any>;
            const color = BlockTools.GetColorForDataConnection(conn);
            element.style.background = color;

            const svg = _GetPortSvgForType(conn.richType.typeName);

            const isOptional = (conn as any)._optional === true && !conn.isConnected();
            if (isOptional) {
                const decoded = atob(svg);
                imgHost.src = "data:image/svg+xml;base64," + btoa(decoded.replace(/fill:\s*#fff/g, "fill:#767676"));
            } else {
                imgHost.src = "data:image/svg+xml;base64," + svg;
            }
        }

        imgHost.style.width = "100%";
        imgHost.style.height = "100%";

        return false;
    };
};
