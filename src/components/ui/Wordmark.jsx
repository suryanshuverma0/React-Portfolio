import PropTypes from "prop-types";

/*
  Typographic logo — the name itself, set tight, with a live status dot.
  Replaces the old "SV" badge so the brand reads as a person, not a
  placeholder monogram.
*/
function Wordmark({ name = "Suryanshu Verma", subtitle, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-2.5 min-w-0 ${className}`}>
      <span aria-hidden="true" className="relative flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-40 animate-ping" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
      </span>

      <span className="flex flex-col min-w-0 leading-none">
        <span className="text-[15px] font-semibold tracking-[-0.03em] truncate">
          {name}
        </span>

        {subtitle && (
          <span className="text-eyebrow mt-1.5 truncate">{subtitle}</span>
        )}
      </span>
    </span>
  );
}

Wordmark.propTypes = {
  name: PropTypes.string,
  subtitle: PropTypes.string,
  className: PropTypes.string,
};

export default Wordmark;
