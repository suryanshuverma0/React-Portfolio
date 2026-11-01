import { useEffect, useRef, useState } from "react";

import PropTypes from "prop-types";

import { animate, useInView, useReducedMotion } from "framer-motion";

/*
  Counts a stat like "15+" up from zero the first time it scrolls into
  view, keeping any prefix/suffix. Values without a number (or with
  reduced motion) render as-is.
*/
function CountUp({ value }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduceMotion = useReducedMotion();

  const match = String(value).match(/^(\D*)(\d+(?:\.\d+)?)(.*)$/);

  const target = match ? Number(match[2]) : 0;
  const decimals = match?.[2].includes(".") ? match[2].split(".")[1].length : 0;

  const [display, setDisplay] = useState(match && !reduceMotion ? 0 : target);

  useEffect(() => {
    if (!match || reduceMotion || !inView) return undefined;

    const controls = animate(0, target, {
      duration: 1.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => setDisplay(latest),
    });

    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, target, reduceMotion]);

  if (!match) return <span ref={ref}>{value}</span>;

  return (
    <span ref={ref}>
      {match[1]}
      {display.toFixed(decimals)}
      {match[3]}
    </span>
  );
}

CountUp.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

export default CountUp;
