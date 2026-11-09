import { Fragment, useEffect, useMemo } from "react";

import { TEMPLATE_BY_ID, TEMPLATES, buildView, ensureResumeFont, fontStack } from "./resumeModel";
import "./resume.css";

/* ========================================
   RESUME DOCUMENT — renders a resume config
   + resolved data with one of the template
   designs. Pure text, single column, links
   are real links: ATS-friendly and prints
   to a searchable PDF.
========================================= */

const PAGE = {
  a4: { width: "210mm", minHeight: "297mm" },
  letter: { width: "8.5in", minHeight: "11in" },
};

function Heading({ title, design, accent }) {
  const colored = design.accentOn?.includes("heading");
  const color = colored ? accent : "inherit";

  switch (design.heading) {
    case "smallcaps-rule":
      return <h2 className="rs-h rs-h-rule" style={{ fontVariant: "small-caps", letterSpacing: "0.02em", color, borderColor: colored ? accent : "currentColor" }}>{title}</h2>;
    case "rule":
      return <h2 className="rs-h rs-h-rule" style={{ textTransform: "uppercase", letterSpacing: "0.04em", color, borderColor: colored ? accent : "currentColor" }}>{title}</h2>;
    case "caps":
      return <h2 className="rs-h rs-h-thinrule" style={{ textTransform: "uppercase", letterSpacing: "0.06em", color }}>{title}</h2>;
    case "accent-bar":
      return <h2 className="rs-h rs-h-bar" style={{ color, borderLeftColor: accent }}>{title}</h2>;
    case "accent-underline":
      return <h2 className="rs-h rs-h-underline" style={{ color, borderColor: accent }}>{title}</h2>;
    case "double-rule":
      return <h2 className="rs-h rs-h-double" style={{ textTransform: "uppercase", letterSpacing: "0.08em", color, borderColor: colored ? accent : "currentColor" }}>{title}</h2>;
    case "center-rule":
      return (
        <h2 className="rs-h rs-h-centerrule" style={{ color }}>
          <span>{title}</span>
        </h2>
      );
    case "center-caps":
      return <h2 className="rs-h" style={{ textAlign: "center", textTransform: "uppercase", letterSpacing: "0.22em", fontWeight: 400, color }}>{title}</h2>;
    case "band":
      return <h2 className="rs-h rs-h-band" style={{ textAlign: "center", textTransform: "uppercase", letterSpacing: "0.05em", color }}>{title}</h2>;
    case "minimal":
    default:
      return <h2 className="rs-h rs-h-minimal" style={{ color: colored ? accent : undefined }}>{title}</h2>;
  }
}

function Bullets({ items, bullet }) {
  if (!items?.length) return null;
  return (
    <ul className="rs-bullets" style={{ "--rs-bullet": `"${bullet}"` }}>
      {items.map((b, i) => (
        <li key={i}>{b}</li>
      ))}
    </ul>
  );
}

function Links({ links }) {
  if (!links?.length) return null;
  return (
    <span className="rs-links">
      {links.map((l, i) => (
        <Fragment key={l.href}>
          {i > 0 && " · "}
          <a href={l.href}>{l.label}</a>
        </Fragment>
      ))}
    </span>
  );
}

function Entry({ entry, design, sectionId }) {
  const tech = entry.tech ? <span className={design.monoTech ? "rs-tech rs-mono" : "rs-tech"}>{entry.tech}</span> : null;

  if (design.entry === "inline") {
    return (
      <div className="rs-entry">
        <div className="rs-row">
          <span>
            <b>{entry.title}</b>
            {entry.org && <>, <span className="rs-em">{entry.org}</span></>}
            {entry.place && <span className="rs-muted"> — {entry.place}</span>}
            {tech && <span className="rs-muted"> | {tech}</span>}
            {entry.links && <Links links={entry.links} />}
          </span>
          {entry.date && <span className="rs-date">{entry.date}</span>}
        </div>
        <Bullets items={entry.bullets} bullet={design.bullet} />
      </div>
    );
  }

  if (design.entry === "stacked") {
    const meta = [entry.org, entry.place, entry.date].filter(Boolean).join("  ·  ");
    return (
      <div className="rs-entry">
        <div className="rs-row">
          <b>{entry.title}</b>
          {entry.links && <Links links={entry.links} />}
        </div>
        {meta && <div className="rs-muted rs-small">{meta}</div>}
        {tech && <div className="rs-small">{tech}</div>}
        <Bullets items={entry.bullets} bullet={design.bullet} />
      </div>
    );
  }

  // "jake": bold title left / date right, italic sub-line left / place right.
  const projectsLine = sectionId === "projects";
  return (
    <div className="rs-entry">
      <div className="rs-row">
        <span>
          <b>{entry.title}</b>
          {projectsLine && tech && <span> | <span className="rs-em">{tech}</span></span>}
          {entry.links && <Links links={entry.links} />}
        </span>
        {entry.date && <span className="rs-date">{entry.date}</span>}
      </div>
      {(entry.org || entry.place) && (
        <div className="rs-row rs-em">
          <span>{entry.org}</span>
          {entry.place && <span className="rs-date">{entry.place}</span>}
        </div>
      )}
      {!projectsLine && tech && <div className="rs-small rs-muted">{tech}</div>}
      <Bullets items={entry.bullets} bullet={design.bullet} />
    </div>
  );
}

function Skills({ groups, design, layout }) {
  const mode = layout && layout !== "auto" ? layout : design.skills;
  if (mode === "inline") {
    return <p className="rs-p">{groups.flatMap((g) => g.items).join(", ")}</p>;
  }
  return (
    <div className={mode === "grid" ? "rs-skills-grid" : "rs-skills"}>
      {groups.map((g) => (
        <p key={g.category} className="rs-p">
          <b>{g.category}:</b> <span className={design.monoTech ? "rs-mono" : ""}>{g.items.join(", ")}</span>
        </p>
      ))}
    </div>
  );
}

function Header({ view, design, accent }) {
  const nameStyle = {
    fontSize: `${design.name.size}em`,
    fontWeight: design.name.weight,
    fontVariant: design.name.caps === "small" ? "small-caps" : undefined,
    textTransform: design.name.caps === "upper" ? "uppercase" : undefined,
    letterSpacing: design.name.tracking,
    color: design.accentOn?.includes("name") ? accent : undefined,
  };
  const headlineStyle = { color: design.accentOn?.includes("headline") ? accent : undefined };
  const contacts = view.contacts.map((c, i) => (
    <Fragment key={c.type}>
      {i > 0 && <span className="rs-sep">{design.sep}</span>}
      {c.href ? <a href={c.href}>{c.label}</a> : <span>{c.label}</span>}
    </Fragment>
  ));

  if (design.header === "split") {
    return (
      <header className="rs-header rs-header-split">
        <div>
          <h1 className="rs-name" style={nameStyle}>{view.name}</h1>
          {view.headline && <p className="rs-headline" style={headlineStyle}>{view.headline}</p>}
        </div>
        <div className="rs-contacts-stack">
          {view.contacts.map((c) => (c.href ? <a key={c.type} href={c.href}>{c.label}</a> : <span key={c.type}>{c.label}</span>))}
        </div>
      </header>
    );
  }

  const align = design.header === "center" ? "center" : "left";
  return (
    <header className={`rs-header ${design.header === "left-rule" ? "rs-header-rule" : ""}`} style={{ textAlign: align, borderColor: accent }}>
      <h1 className="rs-name" style={nameStyle}>{view.name}</h1>
      {view.headline && <p className="rs-headline" style={headlineStyle}>{view.headline}</p>}
      {view.contacts.length > 0 && <p className="rs-contacts">{contacts}</p>}
    </header>
  );
}

// config + data → the printable sheet. `paged` draws page-break guides on screen.
function ResumeDocument({ config, data, siteUrl, paged = true, className = "" }) {
  const template = TEMPLATE_BY_ID.get(config?.template) || TEMPLATES[0];
  const style = { ...template.defaults, ...(config?.style || {}) };
  const design = template.design;
  const view = useMemo(() => buildView(config || {}, data || {}, siteUrl), [config, data, siteUrl]);
  const page = PAGE[style.pageSize] || PAGE.a4;

  useEffect(() => {
    ensureResumeFont(style.font);
  }, [style.font]);

  return (
    <article
      className={`resume-sheet ${paged ? "resume-paged" : ""} ${className}`}
      data-page={style.pageSize || "a4"}
      style={{
        "--rs-font": fontStack(style.font),
        "--rs-size": `${style.fontSize}pt`,
        "--rs-line": style.lineHeight,
        "--rs-margin": `${style.margin}in`,
        "--rs-gap": style.sectionSpacing ?? 1,
        "--rs-accent": style.accent,
        "--rs-page-h": page.minHeight,
        width: page.width,
        minHeight: page.minHeight,
      }}
    >
      <Header view={view} design={design} accent={style.accent} />
      {view.sections.map((s) => (
        <section key={s.id} className="rs-section">
          <Heading title={s.title} design={design} accent={style.accent} />
          {s.text && <p className="rs-p">{s.text}</p>}
          {s.groups && <Skills groups={s.groups} design={design} layout={config?.options?.skillsLayout} />}
          {s.entries?.map((e) => (
            <Entry key={e.id} entry={e} design={design} sectionId={s.id} />
          ))}
        </section>
      ))}
    </article>
  );
}

export default ResumeDocument;
