/**
 * Vite dev server entry point for the Visual State Manager.
 *
 * For production CDN deployments use: npm run build:deployment -w @tools/vsm
 */
import { VSM } from "./vsm";

const HostElement = document.getElementById("host-element") as HTMLElement;

void VSM.Show({ hostElement: HostElement });
