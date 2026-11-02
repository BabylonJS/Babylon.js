import { type EngineContext, type Mesh, type SceneContext } from "@babylonjs/lite";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { act, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { vi } from "vitest";

import { Observable } from "core/Misc/observable";
import { WatcherContext } from "../../src/contexts/watcherContext";
import { type ISelectionService } from "../../src/services/selectionService";
import { type IWatcherService } from "../../src/services/watcherService";

export function CreateP9Engine(meshes: Mesh[] = []) {
    const scene = { meshes } as unknown as SceneContext;
    const engine = { surfaces: [] } as unknown as EngineContext;
    Object.assign(scene, { surface: { engine } });
    Object.assign(engine, { surfaces: [engine] });
    return { engine, scene };
}

export function CreateP9Mesh(name = "Skinned Mesh"): Mesh {
    return { name, children: [], parent: null, position: {}, rotationQuaternion: {}, scaling: {}, material: null, receiveShadows: false } as unknown as Mesh;
}

export function CreateP9Selection(): ISelectionService {
    return { selectedEntity: null, onSelectedEntityChanged: new Observable<void>() };
}

export function CreateP9Watcher() {
    const checks = new Set<() => void>();
    function WatchValue<T>(getValue: () => T, onChanged: (value: T) => void, equals: (left: T, right: T) => boolean = Object.is) {
        let previous = getValue();
        const check = () => {
            const current = getValue();
            if (!equals(previous, current)) {
                previous = current;
                onChanged(current);
            }
        };
        checks.add(check);
        return { dispose: vi.fn(() => checks.delete(check)) };
    }
    const watcher: IWatcherService = {
        watchValue: WatchValue,
        watchProperty<T extends object, K extends keyof T>(target: T, key: K, onChanged: (value: NonNullable<T[K]>) => void) {
            return WatchValue(() => target[key]!, onChanged);
        },
        refresh: () => [...checks].forEach((check) => check()),
    };
    return { watcher, checks };
}

export function RenderP9Properties(content: ReactNode, watcher: IWatcherService) {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() =>
        root.render(
            <FluentProvider theme={webLightTheme}>
                <WatcherContext.Provider value={watcher}>{content}</WatcherContext.Provider>
            </FluentProvider>
        )
    );
    return {
        container,
        dispose: () => {
            act(() => root.unmount());
            container.remove();
        },
    };
}
