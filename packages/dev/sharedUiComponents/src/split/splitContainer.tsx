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

    useEffect(() => {
        if (!elementRef.current) {
            return;
        }

        const children = elementRef.current.children;
        const count = children.length;

        if (count === 0) {
            return;
        }

        let gridDefinition = "";
        let gridIndex = 1;
        for (const child of children) {
            const childElement = child as HTMLElement;
            if (child.classList.contains(styles["splitter"])) {
                gridDefinition += "auto ";
            } else {
                gridDefinition += "1fr";
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

    return (
        <SplitContext.Provider value={{ direction: props.direction }}>
            <div id={props.id} className={styles["split-container"]} ref={elementRef}>
                {props.children}
            </div>
        </SplitContext.Provider>
    );
};
