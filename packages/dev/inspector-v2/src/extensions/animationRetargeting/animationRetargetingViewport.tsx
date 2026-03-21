import type { FunctionComponent } from "react";

import type { Engine } from "core/Engines/engine";
import { makeStyles } from "@fluentui/react-components";
import { useEffect, useRef } from "react";

import { RetargetingSceneManager } from "./retargetingSceneManager";

const useStyles = makeStyles({
    container: {
        position: "absolute",
        inset: "0",
        overflow: "hidden",
        pointerEvents: "none",
    },
    labels: {
        position: "absolute",
        top: "8px",
        left: 0,
        width: "100%",
        display: "flex",
        justifyContent: "space-around",
        pointerEvents: "none",
        color: "rgba(255,255,255,0.7)",
        fontSize: "13px",
        fontFamily: "sans-serif",
    },
    consoleContainer: {
        pointerEvents: "auto",
    },
});

type AnimationRetargetingViewportProps = {
    engine: Engine;
    onManagerReady: (manager: RetargetingSceneManager) => void;
};

export const AnimationRetargetingViewport: FunctionComponent<AnimationRetargetingViewportProps> = ({ engine, onManagerReady }) => {
    const classes = useStyles();
    const containerRef = useRef<HTMLDivElement>(null);
    const managerRef = useRef<RetargetingSceneManager | null>(null);

    useEffect(() => {
        if (!containerRef.current) {
            return;
        }

        const manager = new RetargetingSceneManager();
        managerRef.current = manager;
        manager.initialize(engine);
        manager.htmlConsole.attachToContainer(containerRef.current);
        onManagerReady(manager);

        // Resize the engine when the central content area changes size
        const resizeObserver = new ResizeObserver(() => engine.resize());
        resizeObserver.observe(containerRef.current);

        return () => {
            resizeObserver.disconnect();
            manager.dispose();
            managerRef.current = null;
        };
        // onManagerReady is intentionally not in deps - it's a stable callback from the service
    }, [engine]);

    return (
        <div ref={containerRef} className={classes.container}>
            <div className={classes.labels}>
                <span>◀ Avatar</span>
                <span>Animation ▶</span>
            </div>
        </div>
    );
};
