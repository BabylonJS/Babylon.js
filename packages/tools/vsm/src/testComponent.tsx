import type { FC } from "react";

export const TestComponent: FC<{ name: string; title?: string; color: string }> = (props) => {
    const { name } = props;
    return <div style={{ width: "100%", height: "100%", userSelect: "none", backgroundColor: "#dddddd" }}>Hello, I'm {name}</div>;
};
