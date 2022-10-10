import { createContext } from "react";
import type { Layout } from "./types";

export const LayoutContext = createContext<Layout>({ layout: {}, setLayout: () => {} });
