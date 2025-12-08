// Icon.tsx
import * as React from "react";

type IconProps = {
    size?: number;
    strokeWidth?: number;
    children: React.ReactElement<SVGSVGElement>;
};

/**
 *
 * @param param0
 * @returns
 */
export function Icon({ size = 20, strokeWidth, children }: IconProps) {
    const vb = children.props.viewBox as unknown as string | undefined;
    const native = vb ? Number(vb.split(" ")[2]) : 24;
    const scale = size / native;

    return React.cloneElement(children, {
        style: {
            transformBox: "fill-box",
            transformOrigin: "50% 50%",
            transform: `scale(${scale})`,
            display: "block",
            ...((children.props.style as any) || {}),
        },
        ...(strokeWidth ? { strokeWidth } : {}),
    });
}
