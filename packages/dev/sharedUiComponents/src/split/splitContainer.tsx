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
}

/**
 * Creates a split container component
 * @param props defines the split container properties
 * @returns the split container component
 */
export const SplitContainer: React.FC<ISplitContainerProps> = (props) => {
    const elementRef: React.RefObject<HTMLDivElement> = useRef(null);
    const sizes: number[] = [];

    useEffect(() => {
        if (!elementRef.current) {
            return;
        }

        const children = elementRef.current.children;

        let gridDefinition = "";
        let gridIndex = 1;
        for (const child of children) {
            const childElement = child as HTMLElement;
            if (child.classList.contains(styles["splitter"])) {
                gridDefinition += "auto ";
            } else {
                gridDefinition += "1fr ";
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

    const drag = (offset: number, source: HTMLElement, minSize1?: number, minSize2?: number) => {
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

        if (sizes[sourceIndex - 1] + offset < minSize1 || sizes[sourceIndex + 1] - offset < minSize2) {
            return;
        }

        let split: string[] = [];
        if (props.direction === "horizontal") {
            const gridTemplateRows = elementRef.current.style.gridTemplateColumns;
            split = gridTemplateRows.split(" ");

            split[sourceIndex - 1] = `${sizes[sourceIndex - 1] + offset}px`;
            split[sourceIndex + 1] = `${sizes[sourceIndex + 1] - offset}px`;
        } else {
            // const gridTemplateRows = elementRef.current.style.gridTemplateRows;
            // if (offset < 0) {
            // } else {
            // }
        }

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

    return (
        <SplitContext.Provider value={{ direction: props.direction, drag, beginDrag, endDrag }}>
            <div id={props.id} className={styles["split-container"]} ref={elementRef}>
                {props.children}
            </div>
        </SplitContext.Provider>
    );
};
