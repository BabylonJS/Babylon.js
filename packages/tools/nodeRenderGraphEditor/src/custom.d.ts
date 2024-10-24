declare module "*.svg" {
    const content: string;
    export default content;
}

declare module "*.modules.scss" {
    const content: Record<string, string>;
    export default content;
}
