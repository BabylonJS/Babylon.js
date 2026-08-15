import * as React from "react";
import { UniversalCamera } from "core/Cameras/universalCamera";
import { NullEngine } from "core/Engines/nullEngine";
import { Vector3 } from "core/Maths/math.vector";
import { Observable } from "core/Misc/observable";
import { Scene } from "core/scene";
import { Footer } from "../../src/components/footer";
import { type GlobalState, type SandboxSceneLoadKind } from "../../src/globalState";

interface IControlProps {
    children?: React.ReactNode;
    enabled?: boolean;
    label?: string;
    options?: string[];
}

function FindControl(node: React.ReactNode, label: string): React.ReactElement<IControlProps> | undefined {
    if (!React.isValidElement<IControlProps>(node)) {
        return undefined;
    }
    if (node.props.label === label) {
        return node;
    }

    for (const child of React.Children.toArray(node.props.children)) {
        const match = FindControl(child, label);
        if (match) {
            return match;
        }
    }

    return undefined;
}

describe("Sandbox Footer camera controls", () => {
    it("uses scene payload cameras, hides texture presets, and removes observers on unmount", () => {
        const onSceneLoaded = new Observable<{ scene: Scene; filename: string; loadKind: SandboxSceneLoadKind }>();
        const onCameraChanged = new Observable<UniversalCamera>();
        const onPresetChanged = new Observable<void>();
        const globalState = {
            currentScene: undefined,
            currentSceneHadCameras: false,
            currentSceneLoadKind: "scene",
            glTFLoaderExtensions: {},
            onSceneLoaded,
            onCameraChanged,
            cameraPresetManager: {
                isPresetCamera: () => false,
                onChanged: onPresetChanged,
                presets: [{ name: "Saved view" }],
            },
        } as unknown as GlobalState;
        const initialObserverCounts = [onSceneLoaded.observers.length, onCameraChanged.observers.length, onPresetChanged.observers.length];
        const footer = new Footer({ globalState });
        footer.forceUpdate = vi.fn();

        expect([onSceneLoaded.observers.length, onCameraChanged.observers.length, onPresetChanged.observers.length]).toEqual(initialObserverCounts.map((count) => count + 1));
        expect(FindControl(footer.render(), "Select camera preset")?.props.enabled).toBe(false);

        const engine = new NullEngine();
        const embeddedCameraScene = new Scene(engine);
        new UniversalCamera("Embedded camera", Vector3.Zero(), embeddedCameraScene);
        globalState.currentScene = embeddedCameraScene;
        onSceneLoaded.notifyObservers({ scene: embeddedCameraScene, filename: "embedded.gltf", loadKind: "scene" });

        let renderedFooter = footer.render();
        expect(FindControl(renderedFooter, "Select camera")?.props).toMatchObject({ enabled: true, options: ["Embedded camera"] });
        expect(FindControl(renderedFooter, "Select camera preset")?.props.enabled).toBe(true);

        const textureScene = new Scene(engine);
        onSceneLoaded.notifyObservers({ scene: textureScene, filename: "texture.png", loadKind: "texture" });
        globalState.currentScene = textureScene;
        const generatedCamera = new UniversalCamera("default camera", Vector3.Zero(), textureScene);
        onCameraChanged.notifyObservers(generatedCamera);

        renderedFooter = footer.render();
        expect(FindControl(renderedFooter, "Select camera")?.props.enabled).toBe(false);
        expect(FindControl(renderedFooter, "Select camera preset")?.props.enabled).toBe(false);

        footer.componentWillUnmount();
        expect([onSceneLoaded.observers.length, onCameraChanged.observers.length, onPresetChanged.observers.length]).toEqual(initialObserverCounts);

        embeddedCameraScene.dispose();
        textureScene.dispose();
        engine.dispose();
    });
});
