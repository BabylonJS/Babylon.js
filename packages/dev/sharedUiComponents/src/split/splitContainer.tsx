import { useEffect, useRef } from "react";
import * as styles from "./splitContainer.module.scss";
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
     * Minimum size for the floating elements
     */
    floatingMinSize?: number;

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
    const floatingCells: boolean[] = [];
    const noInitialSizes: boolean[] = [];
    const floatingMinSize = props.floatingMinSize || 200;
    const controllers: number[][] = [];
    const minSizes: number[] = [];
    const maxSizes: number[] = [];

    const buildGridDefinition = () => {
        if (!elementRef.current) {
            return;
        }
        const children = elementRef.current.children;

        let gridIndex = 1;
        const pickArray = Array.from(children);
        let gridDefinition = "";
        for (const child of children) {
            const childElement = child as HTMLElement;
            if (child.classList.contains(styles["splitter"])) {
                gridDefinition += "auto ";
            } else {
                const sourceIndex = pickArray.indexOf(child);
                if (floatingCells[sourceIndex] || noInitialSizes[sourceIndex]) {
                    gridDefinition += "1fr ";
                } else {
                    gridDefinition += "auto ";
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
    };

    const handleResize = () => {
        if (!elementRef.current) {
            return;
        }

        // Check if we have enough room for everyone
        const children = elementRef.current.children;
        for (let i = 0; i < children.length; i++) {
            if (!floatingCells[i]) {
                continue;
            }

            const child = children[i] as HTMLElement;
            let childsize = 0;
            if (props.direction === SplitDirection.Horizontal) {
                childsize = child.getBoundingClientRect().width;
            } else {
                childsize = child.getBoundingClientRect().height;
            }

            if (childsize < floatingMinSize) {
                const missing = Math.floor(floatingMinSize - childsize);
                let done = 0;

                // picking the controller in order and try to reduce their size to fit
                for (let j = 0; j < controllers[i].length; j++) {
                    const controllerIndex = controllers[i][j];
                    const controller = children[controllerIndex] as HTMLElement;
                    const currentSize = props.direction === SplitDirection.Horizontal ? controller.getBoundingClientRect().width : controller.getBoundingClientRect().height;
                    let newSize = currentSize - missing;
                    if (minSizes[controllerIndex]) {
                        newSize = Math.max(newSize, minSizes[controllerIndex]);
                    }
                    if (props.direction === SplitDirection.Horizontal) {
                        controller.style.width = `${newSize}px`;
                    } else {
                        controller.style.height = `${newSize}px`;
                    }

                    done += currentSize - newSize;

                    if (done === missing) {
                        // We made it
                        break;
                    }
                }
            }
        }
    };

    useEffect(() => {
        buildGridDefinition();

        // Add event listener for window resize
        window.addEventListener("resize", handleResize);

        // Cleanup the event listener on component unmount
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    const drag = (offset: number, source: HTMLElement, controlledSide: ControlledSize) => {
        if (!elementRef.current) {
            return;
        }

        const children = elementRef.current.children;
        const childArray = Array.from(children) as HTMLElement[];
        const sourceIndex = childArray.indexOf(source);
        if (sourceIndex <= 0) {
            return;
        }

        let current = 0;
        if (controlledSide === ControlledSize.First) {
            current = sourceIndex - 1;
        } else {
            current = sourceIndex + 1;
        }
        const minSize = minSizes[current] || 0;
        const maxSize = maxSizes[current];

        noInitialSizes[current] = false;
        buildGridDefinition();

        let newSize = Math.floor(controlledSide === ControlledSize.First ? sizes[current] + offset : sizes[current] - offset);

        // Min size check
        if (newSize < minSize) {
            newSize = minSize;
        }

        // Max size check
        if (maxSize && newSize > maxSize) {
            newSize = maxSize;
        }

        // Max size check across the whole container
        const maxContainerSize = sizes.reduce((a, b) => a + b, 0) || 0;
        let totalSize = 0;
        let totalFloating = 0;
        for (let i = 0; i < children.length; i++) {
            if (floatingCells[i]) {
                totalFloating++;
            } else {
                totalSize += i === current ? newSize : sizes[i];
            }
        }

        if (maxContainerSize - totalSize < floatingMinSize * totalFloating) {
            newSize = maxContainerSize - floatingMinSize * totalFloating;
        }

        if (props.direction === SplitDirection.Horizontal) {
            childArray[current].style.width = `${newSize}px`;
        } else {
            childArray[current].style.height = `${newSize}px`;
        }
    };

    const beginDrag = () => {
        if (!elementRef.current) {
            return;
        }
        const children = elementRef.current.children;
        sizes.length = 0;
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

    // We assume splitter are not flagging floating cells in a different way
    const sync = (source: HTMLElement, controlledSide: ControlledSize, size?: number, minSize?: number, maxSize?: number) => {
        if (!elementRef.current) {
            return;
        }

        const children = elementRef.current.children;
        const childArray = Array.from(children) as HTMLElement[];
        const sourceIndex = childArray.indexOf(source);
        if (sourceIndex <= 0) {
            return;
        }

        let current = 0;
        let other = 0;
        if (controlledSide === ControlledSize.First) {
            current = sourceIndex - 1;
            other = sourceIndex + 1;
        } else {
            current = sourceIndex + 1;
            other = sourceIndex - 1;
        }

        if (size !== undefined) {
            const sizeString = `${size | 0}px`;

            if (!childArray[current].style.width) {
                if (props.direction === SplitDirection.Horizontal) {
                    childArray[current].style.width = sizeString;
                } else {
                    childArray[current].style.height = sizeString;
                }
            }
        } else {
            noInitialSizes[current] = true;
        }

        if (minSize !== undefined) {
            minSizes[current] = minSize;
        }

        if (maxSize !== undefined) {
            maxSizes[current] = maxSize;
        }

        if (!controllers[other]) {
            controllers[other] = [];
        }
        controllers[other].push(current);
        floatingCells[other] = true;
    };

    return (
        <SplitContext.Provider value={{ direction: props.direction, drag, beginDrag, endDrag, sync }}>
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
