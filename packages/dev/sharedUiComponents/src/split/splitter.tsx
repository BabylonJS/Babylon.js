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
}

/**
 * Creates a splitter component
 * @param props defines the splitter properties
 * @returns the splitter component
 */
export const Splitter: React.FC<ISplitterProps> = (props) => {
    const elementRef: React.RefObject<HTMLDivElement> = useRef(null);
    const splitContext = useContext(SplitContext);

    useEffect(() => {
        if (!elementRef.current) {
            return;
        }

        if (splitContext.direction === "horizontal") {
            elementRef.current.style.height = `${props.size}px`;
            elementRef.current.classList.add(styles["horizontal"]);
        } else {
            elementRef.current.style.width = `${props.size}px`;
            elementRef.current.classList.add(styles["vertical"]);
        }
    }, []);

    return <div id={props.id} className={styles["splitter"]} ref={elementRef}></div>;
};
