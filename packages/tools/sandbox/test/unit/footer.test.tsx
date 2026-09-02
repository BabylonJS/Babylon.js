import * as React from "react";
import { UniversalCamera } from "core/Cameras/universalCamera";
import { NullEngine } from "core/Engines/nullEngine";
import { Vector3 } from "core/Maths/math.vector";
import { Observable } from "core/Misc/observable";
import { Scene } from "core/scene";
import { DropUpButton } from "../../src/components/dropUpButton";
import { Footer } from "../../src/components/footer";
import { type GlobalState, type SandboxSceneLoadKind } from "../../src/globalState";

interface IControlProps {
    children?: React.ReactNode;
    className?: string;
    dynamicWidth?: boolean;
    enabled?: boolean;
    label?: string;
    options?: string[];
    title?: string;
}

function FindElement(node: React.ReactNode, predicate: (props: IControlProps) => boolean): React.ReactElement<IControlProps> | undefined {
    if (!React.isValidElement<IControlProps>(node)) {
        return undefined;
    }
    if (predicate(node.props)) {
        return node;
    }

    for (const child of React.Children.toArray(node.props.children)) {
        const match = FindElement(child, predicate);
        if (match) {
            return match;
        }
    }

    return undefined;
}

function FindControl(node: React.ReactNode, label: string): React.ReactElement<IControlProps> | undefined {
    return FindElement(node, (props) => props.label === label);
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
        expect(FindControl(renderedFooter, "Select camera preset")?.props).toMatchObject({ enabled: true, dynamicWidth: true });
        expect(FindControl(renderedFooter, "Select environment")?.props.dynamicWidth).toBeUndefined();
        expect(FindControl(renderedFooter, "Select camera")?.props.dynamicWidth).toBeUndefined();
        expect(FindControl(renderedFooter, "Select variant")?.props.dynamicWidth).toBeUndefined();

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

    it("renders the dynamic-width selector class while preserving full option titles", () => {
        const onClickInterceptorClicked = new Observable<void>();
        const button = new DropUpButton({
            globalState: {
                onClickInterceptorClicked,
                onRequestClickInterceptor: new Observable<void>(),
            } as GlobalState,
            enabled: true,
            label: "Select camera preset",
            options: ["A complete camera preset name"],
            activeEntry: () => "",
            onOptionPicked: vi.fn(),
            dynamicWidth: true,
        });
        button.state = { isOpen: true, searchText: "" };

        const renderedButton = button.render();
        expect(FindElement(renderedButton, (props) => props.className?.includes("dropup-content") === true)?.props.className).toContain("dynamic-width");
        expect(FindElement(renderedButton, (props) => props.title === "A complete camera preset name")).toBeDefined();

        button.componentWillUnmount();
    });
});
