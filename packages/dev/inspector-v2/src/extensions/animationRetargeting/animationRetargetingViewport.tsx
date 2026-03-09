import type { FunctionComponent } from "react";

import { makeStyles } from "@fluentui/react-components";
import { useEffect, useRef } from "react";

import { RetargetingSceneManager } from "./retargetingSceneManager";

const useStyles = makeStyles({
    container: {
        position: "absolute",
        inset: "0",
        overflow: "hidden",
        backgroundColor: "#1a1a1a",
    },
    canvas: {
        width: "100%",
        height: "100%",
        display: "block",
        outline: "none",
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
});

type AnimationRetargetingViewportProps = {
    onManagerReady: (manager: RetargetingSceneManager) => void;
};

export const AnimationRetargetingViewport: FunctionComponent<AnimationRetargetingViewportProps> = ({ onManagerReady }) => {
    const classes = useStyles();
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const managerRef = useRef<RetargetingSceneManager | null>(null);

    useEffect(() => {
        if (!canvasRef.current || !containerRef.current) {
            return;
        }

        const manager = new RetargetingSceneManager();
        managerRef.current = manager;
        manager.initialize(canvasRef.current);
        manager.htmlConsole.attachToContainer(containerRef.current);
        onManagerReady(manager);

        const resizeObserver = new ResizeObserver(() => manager.resize());
        resizeObserver.observe(containerRef.current);

        return () => {
            resizeObserver.disconnect();
            manager.dispose();
            managerRef.current = null;
        };
        // onManagerReady is intentionally not in deps - it's a stable callback from the service
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div ref={containerRef} className={classes.container}>
            <canvas ref={canvasRef} className={classes.canvas} />
            <div className={classes.labels}>
                <span>◀ Avatar</span>
                <span>Animation ▶</span>
            </div>
        </div>
    );
};
