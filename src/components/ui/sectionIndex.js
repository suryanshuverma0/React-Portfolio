import { createContext } from "react";

// The 1-based position of a homepage section among the visible titled
// sections. Set by HomePage, read by SectionTitle, so the "01, 02…"
// numbers follow whatever order is chosen in admin → Appearance.
export const SectionIndexContext = createContext(null);
