import { useRef } from "react";

import PropTypes from "prop-types";

import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";

/*
  Pulls its child a little toward the pointer and springs back on leave —
  makes primary buttons feel physical. Mouse only: touch pointers and
  reduced-motion users get a plain wrapper.
*/
function Magnetic({ children, strength = 0.3, className = "" }) {
  const ref = useRef(null);
  const reduceMotion = useReducedMotion();

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, { stiffness: 260, damping: 18, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 260, damping: 18, mass: 0.4 });

  const onMove = (event) => {
    if (reduceMotion || event.pointerType !== "mouse" || !ref.current) return;

    const rect = ref.current.getBoundingClientRect();

    x.set((event.clientX - (rect.left + rect.width / 2)) * strength);
    y.set((event.clientY - (rect.top + rect.height / 2)) * strength);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.span
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      style={{ x: springX, y: springY }}
      className={`inline-flex ${className}`}
    >
      {children}
    </motion.span>
  );
}

Magnetic.propTypes = {
  children: PropTypes.node.isRequired,
  strength: PropTypes.number,
  className: PropTypes.string,
};

export default Magnetic;
