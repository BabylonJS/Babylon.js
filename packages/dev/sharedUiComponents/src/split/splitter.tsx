import { useEffect, useRef } from "react";
import styles from "./splitContainer.module.scss";

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

    useEffect(() => {
        if (!elementRef.current) {
            return;
        }
    }, []);

    return <div id={props.id} className={styles["splitter"]} ref={elementRef}></div>;
};
