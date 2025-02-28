import { useEffect, useState } from "react";
import { SplitContainer } from "shared-ui-components/split/splitContainer";
// import { ControlledSize, SplitDirection } from "shared-ui-components/split/splitContext";
// import { Splitter } from "shared-ui-components/split/splitter";
import { SplitDirection } from "shared-ui-components/split/splitContext";

interface HTML3DElementAttributes extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> {
    class?: string;
    source?: string;
    environment?: string;
}

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace JSX {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        interface IntrinsicElements {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "babylon-viewer": HTML3DElementAttributes;
        }
    }
}
const RootStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "100%",
    overflow: "scroll",
};

const HeaderStyle: React.CSSProperties = {
    height: "5%",
    background: "#fff",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
};

const AppContainerStyle: React.CSSProperties = {
    flex: 1, // Remaining vertical space after header
    display: "flex",
    flexDirection: "row",
};

const ViewerContainerStyle: React.CSSProperties = {
    flex: 3, // 75% width of AppContainer
    background: "#f4f4f4",
};

const RightPaneContainerStyle: React.CSSProperties = {
    flex: 1, // 25% width of AppContainer
    background: "#c35sdf",
};

const LogoStyle: React.CSSProperties = {
    height: "100%", // Fit to header height
};

export function App() {
    const [viewerLoaded, setViewerLoaded] = useState(false);

    useEffect(() => {
        import("viewer").then(() => {
            setViewerLoaded(true);
        });
    }, []);

    return (
        <div style={RootStyle}>
            <div style={HeaderStyle}>
                <img style={LogoStyle} src="https://www.babylonjs.com/Assets/logo-babylonjs-social-twitter.png" />
                <div>BABYLON VIEWER CONFIGURATOR</div>
            </div>
            <div style={AppContainerStyle}>
                <div style={ViewerContainerStyle}>
                    {viewerLoaded ? <babylon-viewer source="https://playground.babylonjs.com/scenes/BoomBox.glb"></babylon-viewer> : <p>Loading...</p>}
                </div>
                <div style={RightPaneContainerStyle}>
                    <SplitContainer direction={SplitDirection.Vertical}>
                        <p>Test</p>
                    </SplitContainer>
                </div>
            </div>
        </div>
    );
}
