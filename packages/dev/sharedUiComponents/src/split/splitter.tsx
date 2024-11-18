import { useContext, useEffect, useRef } from "react";
import styles from "./splitContainer.module.scss";
import { SplitContext } from "./splitContext";

/**
 * Splitter component properties
 */
export interface ISplitterProps {
    /**
     * Unique identifier
     */
    id?: string;

    /**
     * Splitter size
     */
    size: number;

    /**
     * Minimum size for the first element
     */
    minSize1?: number;
    /**
     * Minimum size for the second element
     */
    minSize2?: number;
}

/**
 * Creates a splitter component
 * @param props defines the splitter properties
 * @returns the splitter component
 */
export const Splitter: React.FC<ISplitterProps> = (props) => {
    const elementRef: React.RefObject<HTMLDivElement> = useRef(null);
    const splitContext = useContext(SplitContext);
    let isCaptured = false;
    let startValue: number;

    useEffect(() => {
        if (!elementRef.current) {
            return;
        }

        if (splitContext.direction === "horizontal") {
            elementRef.current.style.width = `${props.size}px`;
            elementRef.current.style.height = `100%`;
            elementRef.current.classList.add(styles["horizontal"]);
        } else {
            elementRef.current.style.height = `${props.size}px`;
            elementRef.current.style.width = `100%`;
            elementRef.current.classList.add(styles["vertical"]);
        }
    }, []);

    const onPointerDown = (evt: React.PointerEvent) => {
        if (!elementRef.current) {
            return;
        }
        elementRef.current.setPointerCapture(evt.pointerId);
        isCaptured = true;
        splitContext.beginDrag();

        if (splitContext.direction === "horizontal") {
            startValue = evt.clientX;
        } else {
            startValue = evt.clientY;
        }
    };
    const onPointerMove = (evt: React.PointerEvent) => {
        if (!elementRef.current || !isCaptured) {
            return;
        }
        if (splitContext.direction === "horizontal") {
            splitContext.drag(evt.clientX - startValue, elementRef.current, props.minSize1, props.minSize2);
        } else {
            splitContext.drag(evt.clientY - startValue, elementRef.current, props.minSize1, props.minSize2);
        }
    };
    const onPointerUp = (evt: React.PointerEvent) => {
        if (!elementRef.current) {
            return;
        }
        elementRef.current.releasePointerCapture(evt.pointerId);
        isCaptured = false;
        splitContext.endDrag();
    };

    return (
        <div
            id={props.id}
            className={styles["splitter"]}
            ref={elementRef}
            onPointerDown={(evt) => onPointerDown(evt)}
            onPointerUp={(evt) => onPointerUp(evt)}
            onPointerMove={(evt) => onPointerMove(evt)}
        ></div>
    );
};
