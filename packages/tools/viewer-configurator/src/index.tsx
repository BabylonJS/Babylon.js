// import { useState, useEffect, useMemo } from "react";
// import * as ReactDOM from "react-dom";
// import type { ViewerDetails } from "viewer/viewer";
// import type { HTML3DElement } from "viewer/viewerElement";
// import { ViewerComponent } from "./components/ViewerComponent";

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

// // Example of a simple app using the ViewerComponent
// function App() {
//     const [modelUrl, setModelUrl] = useState<string>("https://assets.babylonjs.com/meshes/boxTextured.glb");
//     const [envUrl, setEnvUrl] = useState<string>("https://assets.babylonjs.com/environments/environmentSpecular.env");

//     return (
//         <div style={{ width: "100%", height: "100%" }}>
//             <div style={{ padding: "10px" }}>
//                 <div>
//                     <label>Model URL: </label>
//                     <input value={modelUrl} onChange={(e) => setModelUrl(e.target.value)} style={{ width: "300px" }} />
//                 </div>
//                 <div>
//                     <label>Environment URL: </label>
//                     <input value={envUrl} onChange={(e) => setEnvUrl(e.target.value)} style={{ width: "300px" }} />
//                 </div>
//             </div>
//             <div style={{ width: "100%", height: "calc(100% - 80px)" }}>
//                 <ViewerComponent source={modelUrl} environment={envUrl} className="viewer-container" />
//             </div>
//         </div>
//     );
// }

// ReactDOM.render(<App />, document.getElementById("root") as HTMLElement);

// Vanilla JS example
import type { ViewerElement } from "viewer/viewerElement";

// Method 1: Using document.createElement
function createViewerWithAPI(container: HTMLElement, modelUrl: string, environmentUrl?: string): ViewerElement {
    const viewer = document.createElement("babylon-viewer") as ViewerElement;

    // Set properties
    if (modelUrl) {
        viewer.setAttribute("source", modelUrl);
    }

    if (environmentUrl) {
        viewer.setAttribute("environment", environmentUrl);
    }

    // Append to the container
    container.appendChild(viewer);

    return viewer;
}

// Example of using these methods:
const container = document.getElementById("root") as HTMLElement;
const viewer = createViewerWithAPI(container, "https://assets.babylonjs.com/meshes/boxTextured.glb");
