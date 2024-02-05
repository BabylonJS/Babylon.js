import type { FC } from "react";
import { useRef, useEffect, useState } from "react";
import type { Nullable } from "core/types";
import { DndProvider } from "react-dnd";
import { TouchBackend } from "react-dnd-touch-backend";
import { FlexibleDragHandler } from "./FlexibleDragHandler";
import { LayoutContext } from "./LayoutContext";
import { FlexibleGridContainer } from "./FlexibleGridContainer";
import type { Layout } from "./types";

/**
 * Arguments for the Layout component.
 */
export interface IFlexibleGridLayoutProps {
    /**
     * A definition of the layout which can be changed by the user
     */
    layoutDefinition: Layout;
}

/**
 * This component represents a grid layout that can be resized and rearranged
 * by the user.
 * @param props properties
 * @returns layout element
 */
export const FlexibleGridLayout: FC<IFlexibleGridLayoutProps> = (props) => {
    const [layout, setLayout] = useState(props.layoutDefinition);
    const containerDiv = useRef<Nullable<HTMLDivElement>>(null);
    const containerSize = useRef({ width: 0, height: 0 });

    useEffect(() => {
        if (containerDiv.current) {
            containerSize.current.width = containerDiv.current.clientWidth;
            containerSize.current.height = containerDiv.current.clientHeight;
        }
    }, [containerDiv]);

    return (
        <DndProvider backend={TouchBackend} options={{ enableMouseEvents: true }}>
            <LayoutContext.Provider value={{ layout, setLayout }}>
                <FlexibleDragHandler containerSize={containerSize.current}>
                    <div style={{ width: "100%", height: "100%" }} ref={containerDiv}>
                        <FlexibleGridContainer />
                    </div>
                </FlexibleDragHandler>
            </LayoutContext.Provider>
        </DndProvider>
    );
};
