import { useEffect, useRef } from "react";
import styles from "./splitContainer.module.scss";
import { ControlledSize, SplitDirection, SplitContext } from "./splitContext";

/**
 * Split container properties
 */
export interface ISplitContainerProps {
    /**
     * Unique identifier
     */
    id?: string;

    /**
     * Split direction
     */
    direction: SplitDirection;

    /**
     * RefObject to the root div element
     */
    containerRef?: React.RefObject<HTMLDivElement>;

    /**
     * Optional class name
     */
    className?: string;

    /**
     * Pointer down
     * @param event pointer events
     */
    onPointerDown?: (event: React.PointerEvent) => void;

    /**
     * Pointer move
     * @param event pointer events
     */
    onPointerMove?: (event: React.PointerEvent) => void;

    /**
     * Pointer up
     * @param event pointer events
     */
    onPointerUp?: (event: React.PointerEvent) => void;

    /**
     * Drop
     * @param event drag events
     */
    onDrop?: (event: React.DragEvent<HTMLDivElement>) => void;

    /**
     * Drag over
     * @param event drag events
     */
    onDragOver?: (event: React.DragEvent<HTMLDivElement>) => void;
}

/**
 * Creates a split container component
 * @param props defines the split container properties
 * @returns the split container component
 */
export const SplitContainer: React.FC<ISplitContainerProps> = (props) => {
    const elementRef: React.RefObject<HTMLDivElement> = props.containerRef || useRef(null);
    const sizes: number[] = [];
    const initialSizes: string[] = [];

    useEffect(() => {
        if (!elementRef.current) {
            return;
        }

        const children = elementRef.current.children;

        let gridDefinition = "";
        let gridIndex = 1;
        const pickArray = Array.from(children);
        for (const child of children) {
            const childElement = child as HTMLElement;
            if (child.classList.contains(styles["splitter"])) {
                gridDefinition += "auto ";
            } else {
                const sourceIndex = pickArray.indexOf(child);
                if (initialSizes[sourceIndex]) {
                    gridDefinition += initialSizes[sourceIndex] + " ";
                } else {
                    gridDefinition += "1fr ";
                }
            }

            if (props.direction === SplitDirection.Horizontal) {
                childElement.style.gridRow = "1";
                childElement.style.gridColumn = gridIndex.toString();
            } else {
                childElement.style.gridColumn = "1";
                childElement.style.gridRow = gridIndex.toString();
            }

            gridIndex++;
        }

        if (props.direction === SplitDirection.Horizontal) {
            elementRef.current.style.gridTemplateRows = "100%";
            elementRef.current.style.gridTemplateColumns = gridDefinition;
        } else {
            elementRef.current.style.gridTemplateColumns = "100%";
            elementRef.current.style.gridTemplateRows = gridDefinition;
        }
    }, []);

    const drag = (offset: number, source: HTMLElement, controlledSide: ControlledSize, minSize?: number, maxSize?: number) => {
        if (!elementRef.current) {
            return;
        }

        const children = elementRef.current.children;
        const sourceIndex = Array.from(children).indexOf(source);
        if (sourceIndex <= 0) {
            return;
        }

        minSize = minSize || 0;

        const newSize = controlledSide === ControlledSize.First ? sizes[sourceIndex - 1] + offset : sizes[sourceIndex + 1] - offset;

        if (newSize < minSize) {
            return;
        }

        if (maxSize && newSize > maxSize) {
            return;
        }

        let split: string[] = [];

        if (props.direction === SplitDirection.Horizontal) {
            const gridTemplateColumns = elementRef.current.style.gridTemplateColumns;
            split = gridTemplateColumns.split(" ");
        } else {
            const gridTemplateRows = elementRef.current.style.gridTemplateRows;
            split = gridTemplateRows.split(" ");
        }

        if (controlledSide === ControlledSize.First) {
            split[sourceIndex - 1] = `${newSize}px`;
        } else {
            split[sourceIndex + 1] = `${newSize}px`;
        }

        if (props.direction === SplitDirection.Horizontal) {
            elementRef.current.style.gridTemplateColumns = split.join(" ");
        } else {
            elementRef.current.style.gridTemplateRows = split.join(" ");
        }
    };

    const beginDrag = () => {
        if (!elementRef.current) {
            return;
        }
        const children = elementRef.current.children;

        for (const child of children) {
            const childElement = child as HTMLElement;

            if (props.direction === SplitDirection.Horizontal) {
                sizes.push(childElement.getBoundingClientRect().width);
            } else {
                sizes.push(childElement.getBoundingClientRect().height);
            }
        }
    };

    const endDrag = () => {
        sizes.length = 0;
    };

    const init = (source: HTMLElement, controlledSide: ControlledSize, size: number) => {
        if (!elementRef.current) {
            return;
        }

        const children = elementRef.current.children;
        const sourceIndex = Array.from(children).indexOf(source);
        if (sourceIndex <= 0) {
            return;
        }

        if (controlledSide === ControlledSize.First) {
            initialSizes[sourceIndex - 1] = `${size}px`;
        } else {
            initialSizes[sourceIndex + 1] = `${size}px`;
        }
    };

    return (
        <SplitContext.Provider value={{ direction: props.direction, drag, beginDrag, endDrag, init }}>
            <div
                id={props.id}
                className={styles["split-container"] + " " + props.className}
                ref={elementRef}
                onPointerDown={(evt) => props.onPointerDown && props.onPointerDown(evt)}
                onPointerMove={(evt) => props.onPointerMove && props.onPointerMove(evt)}
                onPointerUp={(evt) => props.onPointerUp && props.onPointerUp(evt)}
                onDrop={(evt) => props.onDrop && props.onDrop(evt)}
                onDragOver={(evt) => props.onDragOver && props.onDragOver(evt)}
            >
                {props.children}
            </div>
        </SplitContext.Provider>
    );
};
