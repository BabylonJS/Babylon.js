import { FC } from "react";

export const TestComponent: FC<{ name: string; title?: string; color: string }> = (props) => {
    const { name, color } = props;
    return <div style={{ width: "100%", height: "100%", backgroundColor: color }}>Hello, I'm {name}</div>;
};

