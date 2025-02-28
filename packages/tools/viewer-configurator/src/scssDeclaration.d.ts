declare module "*.module.scss" {
    const content: Record<string, string>;
    // also allow "import * as styles from './styles.module.scss'"
    export = content;
}
