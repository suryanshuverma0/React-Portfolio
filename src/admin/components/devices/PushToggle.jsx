import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { BellRing, BellOff, Smartphone, Send } from "lucide-react";

import { pushSupport, getPushSubscription, enablePush, disablePush, isIOS, isStandalone } from "../../../lib/pwa";
import { sendTestPush } from "../../services/account.service";

/* ========================================
   PUSH TOGGLE — turn system notifications
   on/off for this device. Used in the bell
   panel (compact) and on the Devices page.
========================================= */

function PushToggle({ compact = false, onChange }) {
  const [state, setState] = useState("checking"); // checking | on | off | unsupported | ios-install | denied | busy

  useEffect(() => {
    let alive = true;
    const support = pushSupport();
    if (!support.supported) {
      Promise.resolve().then(() => alive && setState(support.reason === "ios-install" ? "ios-install" : "unsupported"));
    } else {
      getPushSubscription()
        .then((sub) => alive && setState(sub ? "on" : Notification.permission === "denied" ? "denied" : "off"))
        .catch(() => alive && setState("off"));
    }
    return () => {
      alive = false;
    };
  }, []);

  const turnOn = async () => {
    setState("busy");
    try {
      await enablePush();
      setState("on");
      onChange?.();
      toast.success("This device will now get notifications");
    } catch (error) {
      setState(typeof Notification !== "undefined" && Notification.permission === "denied" ? "denied" : "off");
      toast.error(error.message || "Couldn't turn on notifications");
    }
  };

  const turnOff = async () => {
    setState("busy");
    await disablePush().catch(() => {});
    setState("off");
    onChange?.();
  };

  const test = async () => {
    try {
      const result = await sendTestPush();
      toast.success(result?.sent ? `Test sent to ${result.sent} device${result.sent === 1 ? "" : "s"}` : "No devices are subscribed yet");
    } catch {
      toast.error("Couldn't send a test");
    }
  };

  if (state === "unsupported") {
    return compact ? null : <p className="text-small text-muted">This browser can&apos;t receive push notifications. Try Chrome, Edge, Firefox or Safari 16.4+.</p>;
  }

  if (state === "ios-install") {
    return (
      <p className={`flex items-start gap-2 ${compact ? "text-xs" : "text-small"} text-muted`}>
        <Smartphone size={compact ? 14 : 16} className="mt-0.5 shrink-0" />
        <span>
          To get notifications on {isIOS() ? "iPhone/iPad" : "this device"}, tap <b className="text-primary">Share</b> → <b className="text-primary">Add to Home Screen</b>, then open SV Admin from the new icon and turn them on there.
        </span>
      </p>
    );
  }

  if (state === "denied") {
    return (
      <p className={`flex items-start gap-2 ${compact ? "text-xs" : "text-small"} text-muted`}>
        <BellOff size={compact ? 14 : 16} className="mt-0.5 shrink-0" /> Notifications are blocked for this site. Allow them in your browser&apos;s site settings, then try again.
      </p>
    );
  }

  const on = state === "on";

  return (
    <div className="flex items-center gap-3">
      <span className={`flex ${compact ? "h-8 w-8" : "h-10 w-10"} shrink-0 items-center justify-center rounded-xl ${on ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400" : "bg-surface text-muted"}`}>
        {on ? <BellRing size={compact ? 15 : 18} /> : <Smartphone size={compact ? 15 : 18} />}
      </span>
      <p className={`min-w-0 flex-1 ${compact ? "text-xs" : "text-small"}`}>
        <span className="block font-medium text-primary">{on ? "Push is on for this device" : "Get alerts on this device"}</span>
        <span className="block text-muted">{on ? "Alerts arrive even when the app is closed" : `Phone, tablet or computer${isStandalone() ? "" : " · best when installed"}`}</span>
      </p>
      {on ? (
        <div className="flex items-center gap-1">
          <button type="button" onClick={test} title="Send a test notification" aria-label="Send a test notification" className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-primary">
            <Send size={14} />
          </button>
          <button type="button" onClick={turnOff} className="rounded-lg px-2.5 py-1.5 text-xs text-muted hover:bg-surface hover:text-primary">
            Turn off
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={turnOn}
          disabled={state === "busy" || state === "checking"}
          className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-background disabled:opacity-50"
        >
          {state === "busy" ? "…" : "Turn on"}
        </button>
      )}
    </div>
  );
}

export default PushToggle;
