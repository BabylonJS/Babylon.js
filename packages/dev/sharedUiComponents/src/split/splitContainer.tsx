import { useEffect, useRef } from "react";
import styles from "./splitContainer.module.scss";
import { SplitContext } from "./splitContext";

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
    direction: "horizontal" | "vertical";

    /**
     * RefObject to the root div element
     */
    ref?: React.RefObject<HTMLDivElement>;

    /**
     * Optional class name
     */
    className?: string;
}

/**
 * Creates a split container component
 * @param props defines the split container properties
 * @returns the split container component
 */
export const SplitContainer: React.FC<ISplitContainerProps> = (props) => {
    const elementRef: React.RefObject<HTMLDivElement> = props.ref || useRef(null);
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

            if (props.direction === "horizontal") {
                childElement.style.gridRow = "1";
                childElement.style.gridColumn = gridIndex.toString();
            } else {
                childElement.style.gridColumn = "1";
                childElement.style.gridRow = gridIndex.toString();
            }

            gridIndex++;
        }

        if (props.direction === "horizontal") {
            elementRef.current.style.gridTemplateRows = "100%";
            elementRef.current.style.gridTemplateColumns = gridDefinition;
        } else {
            elementRef.current.style.gridTemplateColumns = "100%";
            elementRef.current.style.gridTemplateRows = gridDefinition;
        }
    }, []);

    const drag = (offset: number, source: HTMLElement, minSize1?: number, minSize2?: number, maxSize1?: number, maxSize2?: number) => {
        if (!elementRef.current) {
            return;
        }

        const children = elementRef.current.children;
        const sourceIndex = Array.from(children).indexOf(source);
        if (sourceIndex <= 0) {
            return;
        }

        minSize1 = minSize1 || 0;
        minSize2 = minSize2 || 0;

        const newSize1 = sizes[sourceIndex - 1] + offset;
        const newSize2 = sizes[sourceIndex + 1] - offset;

        if (newSize1 < minSize1 || newSize2 < minSize2) {
            return;
        }

        if ((maxSize1 && newSize1 > maxSize1) || (maxSize2 && newSize2 > maxSize2)) {
            return;
        }

        let split: string[] = [];

        if (props.direction === "horizontal") {
            const gridTemplateColumns = elementRef.current.style.gridTemplateColumns;
            split = gridTemplateColumns.split(" ");
        } else {
            const gridTemplateRows = elementRef.current.style.gridTemplateRows;
            split = gridTemplateRows.split(" ");
        }

        split[sourceIndex - 1] = `${newSize1}px`;
        split[sourceIndex + 1] = `${newSize2}px`;

        elementRef.current.style.gridTemplateColumns = split.join(" ");
    };

    const beginDrag = () => {
        if (!elementRef.current) {
            return;
        }
        const children = elementRef.current.children;

        for (const child of children) {
            const childElement = child as HTMLElement;

            if (props.direction === "horizontal") {
                sizes.push(childElement.getBoundingClientRect().width);
            } else {
                sizes.push(childElement.getBoundingClientRect().height);
            }
        }
    };

    const endDrag = () => {
        sizes.length = 0;
    };

    const init = (source: HTMLElement, size1?: number, size2?: number) => {
        if (!elementRef.current) {
            return;
        }

        if (!size1 && !size2) {
            return;
        }

        const children = elementRef.current.children;
        const sourceIndex = Array.from(children).indexOf(source);
        if (sourceIndex <= 0) {
            return;
        }

        if (size1) {
            initialSizes[sourceIndex - 1] = `${size1}px`;
        }
        if (size2) {
            initialSizes[sourceIndex + 1] = `${size2}px`;
        }
    };

    return (
        <SplitContext.Provider value={{ direction: props.direction, drag, beginDrag, endDrag, init }}>
            <div id={props.id} className={styles["split-container"] + " " + props.className} ref={elementRef}>
                {props.children}
            </div>
        </SplitContext.Provider>
    );
};
