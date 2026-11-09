import { useEffect, useRef } from "react";

/* ========================================
   BOT TRAP for public forms

   Renders nothing visible. Adds two fields
   the API checks before saving anything:
   - _hp: a honeypot input off-screen that
     people never see or tab to, but form-
     filling bots do fill in
   - _ts: ms between the form appearing and
     being sent (bots submit instantly)

   Spread `honeypotProps` on an <input>
   inside the form; merge `trapFields()`
   into the request body.
========================================= */

const HIDDEN_STYLE = {
  position: "absolute",
  left: "-10000px",
  top: "auto",
  width: "1px",
  height: "1px",
  overflow: "hidden",
  opacity: 0,
};

export default function useBotTrap() {
  const startedAt = useRef(0);
  const honeypot = useRef(null);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  return {
    honeypotProps: {
      ref: honeypot,
      type: "text",
      name: "company_website",
      tabIndex: -1,
      autoComplete: "off",
      "aria-hidden": true,
      defaultValue: "",
      style: HIDDEN_STYLE,
    },
    trapFields: () => ({
      _hp: honeypot.current?.value || "",
      _ts: startedAt.current ? Date.now() - startedAt.current : undefined,
    }),
    resetTrap: () => {
      startedAt.current = Date.now();
    },
  };
}
