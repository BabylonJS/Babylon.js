import { useContext, useEffect, useRef } from "react";
import styles from "./splitContainer.module.scss";
import type { ControlledSize } from "./splitContext";
import { SplitContext, SplitDirection } from "./splitContext";

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
     * Minimum size for the controlled element
     */
    minSize?: number;

    /**
     * Maximum size for the controlled element
     */
    maxSize?: number;

    /**
     * Initial size for the controlled element
     */
    initialSize?: number;

    /**
     * Defines the controlled side
     */
    controlledSide: ControlledSize;

    /**
     * refObject to the splitter element
     */
    refObject?: React.RefObject<HTMLDivElement>;
}

/**
 * Creates a splitter component
 * @param props defines the splitter properties
 * @returns the splitter component
 */
export const Splitter: React.FC<ISplitterProps> = (props) => {
    const elementRef: React.RefObject<HTMLDivElement> = props.refObject || useRef(null);
    const splitContext = useContext(SplitContext);
    let isCaptured = false;
    let startValue: number;

    useEffect(() => {
        if (!elementRef.current) {
            return;
        }

        if (splitContext.direction === SplitDirection.Horizontal) {
            elementRef.current.style.width = `${props.size}px`;
            elementRef.current.style.height = `100%`;
            elementRef.current.classList.add(styles["horizontal"]);
        } else {
            elementRef.current.style.height = `${props.size}px`;
            elementRef.current.style.width = `100%`;
            elementRef.current.classList.add(styles["vertical"]);
        }

        splitContext.sync(elementRef.current, props.controlledSide, props.initialSize, props.minSize, props.maxSize);
    });

    const onPointerDown = (evt: React.PointerEvent) => {
        if (!elementRef.current) {
            return;
        }
        elementRef.current.setPointerCapture(evt.pointerId);
        isCaptured = true;
        splitContext.beginDrag();

        if (splitContext.direction === SplitDirection.Horizontal) {
            startValue = evt.clientX;
        } else {
            startValue = evt.clientY;
        }
        evt.preventDefault();
    };
    const onPointerMove = (evt: React.PointerEvent) => {
        if (!elementRef.current || !isCaptured) {
            return;
        }
        if (splitContext.direction === SplitDirection.Horizontal) {
            splitContext.drag(evt.clientX - startValue, elementRef.current, props.controlledSide);
        } else {
            splitContext.drag(evt.clientY - startValue, elementRef.current, props.controlledSide);
        }
        evt.preventDefault();
    };
    const onPointerUp = (evt: React.PointerEvent) => {
        if (!elementRef.current) {
            return;
        }
        elementRef.current.releasePointerCapture(evt.pointerId);
        isCaptured = false;
        splitContext.endDrag();
        evt.preventDefault();
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
