import {
  motion,
} from "framer-motion";

import {
  ArrowUpRight,
  Check,
  Copy,
  Send,
} from "lucide-react";

import {
  useState,
  useEffect,
} from "react";

import { toast } from "react-toastify";

import Container
from "../../ui/Container";

import SectionTitle
from "../../ui/SectionTitle";

import {
  iconMap,
} from "../../constants/iconMap";

import {
  contactContent,
} from "../../content/contactContent";

import { getPublicSettings } from "../../../services/public.settings.service";
import { socialsObjectToArray } from "../../../lib/socials";
import { sendMessage } from "../../../services/public.contact.service";
import { trackEvent } from "../../../lib/tracker";
import Magnetic from "../../motion/Magnetic";

function Contact() {

  const [settings, setSettings] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast.error("Please fill in your name, email, and message");
      return;
    }

    try {
      setSending(true);

      await sendMessage(formData);

      trackEvent("form_submit", {
        label: "Contact form",
        section: "contact",
        meta: {
          name: formData.name.trim().slice(0, 100),
          email: formData.email.trim().slice(0, 150),
          ...(formData.subject?.trim() && { subject: formData.subject.trim().slice(0, 150) }),
        },
      });

      setSent(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
      toast.success("Message sent — thanks for reaching out!");
    } catch (error) {
      if (error.response?.status === 429) {
        const retryAfter = error.response.data?.retryAfter;

        toast.error(
          `Too many messages sent. Try again in ${retryAfter} seconds.`,
        );

        return;
      }

      const firstError = error.response?.data?.errors?.[0]?.message;

      toast.error(
        firstError || error.response?.data?.message || "Failed to send message",
      );
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await getPublicSettings();

        setSettings(data);
      } catch (error) {
        console.error("Failed to load settings", error);
      }
    };

    loadSettings();
  }, []);

  const settingsContacts = [];

  if (settings?.contactEmail) {
    settingsContacts.push({
      type: "email",
      label: "Email",
      value: settings.contactEmail,
      href: `mailto:${settings.contactEmail}`,
    });
  }

  if (settings?.contactPhone) {
    settingsContacts.push({
      type: "phone",
      label: "Phone",
      value: settings.contactPhone,
      href: `tel:${settings.contactPhone.replace(/\s+/g, "")}`,
    });
  }

  const contacts = settingsContacts.length
    ? settingsContacts
    : contactContent.contacts;

  const settingsSocials = socialsObjectToArray(settings?.socials);
  const socials = settingsSocials.length ? settingsSocials : contactContent.socials;

  const primaryEmail = contacts.find((item) => item.type === "email");
  const otherContacts = contacts.filter((item) => item !== primaryEmail);

  const copyEmail = async () => {
    if (!primaryEmail) return;

    try {
      await navigator.clipboard.writeText(primaryEmail.value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — select the address instead");
    }
  };

  // Last two words of the heading get the serif accent.
  const titleWords = contactContent.title.split(" ");
  const titleLead = titleWords.slice(0, -2).join(" ");
  const titleAccent = titleWords.slice(-2).join(" ");

  return (
    <section id="contact" className="section relative">
      <Container>
        <SectionTitle
          index="10"
          eyebrow="Contact"
          title={
            <>
              {titleLead} <span className="text-accent">{titleAccent}</span>
            </>
          }
          description={contactContent.description}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-5 lg:gap-6">
          {/* LEFT */}

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col"
          >
            {/* EMAIL — the main call to action */}

            {primaryEmail && (
              <div className="panel p-5 sm:p-7">
                <p className="text-eyebrow mb-5">Write to me</p>

                <a
                  href={primaryEmail.href}
                  className="
                    group

                    inline-flex
                    items-start

                    gap-2

                    max-w-full

                    text-[22px]
                    sm:text-[30px]

                    font-semibold

                    leading-tight

                    tracking-[-0.04em]

                    break-all
                  "
                >
                  <span className="bg-[linear-gradient(currentColor,currentColor)] bg-no-repeat bg-[length:0%_1px] bg-[position:0_100%] transition-[background-size] duration-500 group-hover:bg-[length:100%_1px]">
                    {primaryEmail.value}
                  </span>

                  <ArrowUpRight
                    size={22}
                    aria-hidden="true"
                    className="mt-1 shrink-0 text-muted transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary"
                  />
                </a>

                <div className="mt-6 flex flex-wrap gap-2">
                  <Magnetic>
                    <a href={primaryEmail.href} className="btn btn-primary">
                      Send an email
                    </a>
                  </Magnetic>

                  <button type="button" onClick={copyEmail} className="btn btn-outline">
                    {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
                    {copied ? "Copied" : "Copy address"}
                  </button>
                </div>
              </div>
            )}

            {/* OTHER CHANNELS */}

            <div className="panel mt-5 p-5 sm:p-7 flex-1 flex flex-col">
              {otherContacts.length > 0 && (
                <dl className="flex flex-col gap-5 mb-7">
                  {otherContacts.map((item, index) => {
                    const Icon = iconMap[item.type];

                    return (
                      <div key={index} className="flex items-center gap-4">
                        <span className="h-11 w-11 shrink-0 rounded-full border border-border bg-background flex items-center justify-center">
                          {Icon && <Icon size={15} />}
                        </span>

                        <div className="min-w-0">
                          <dt className="text-eyebrow mb-1.5">{item.label}</dt>
                          <dd className="text-label break-all">
                            {item.href ? (
                              <a href={item.href} className="hover:opacity-70 transition-opacity">
                                {item.value}
                              </a>
                            ) : (
                              item.value
                            )}
                          </dd>
                        </div>
                      </div>
                    );
                  })}
                </dl>
              )}

              <p className="text-eyebrow mb-4">Elsewhere</p>

              <div className="flex flex-wrap gap-2">
                {socials.map((item, index) => {
                  const Icon = iconMap[item.icon];

                  if (!Icon) return null;

                  return (
                    <a
                      key={index}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={item.icon}
                      className="
                        h-11
                        w-11

                        rounded-full

                        border
                        border-border

                        bg-background

                        flex
                        items-center
                        justify-center

                        text-secondary

                        transition-all
                        duration-300

                        hover:bg-primary
                        hover:border-primary
                        hover:text-background
                      "
                    >
                      <Icon size={16} />
                    </a>
                  );
                })}
              </div>

              <p className="mt-auto pt-7 flex items-center gap-2.5 text-small">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-primary" />
                Usually responds within 24 hours.
              </p>
            </div>
          </motion.div>

          {/* FORM */}

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="panel p-5 sm:p-8"
          >
            {sent ? (
              <div className="h-full min-h-[420px] flex flex-col items-center justify-center text-center gap-3 py-10">
                <div className="h-14 w-14 rounded-full bg-primary text-background flex items-center justify-center mb-2">
                  <Check size={22} aria-hidden="true" />
                </div>

                <p className="text-[22px] font-semibold tracking-[-0.03em]">Message sent</p>

                <p className="text-small max-w-xs">
                  Thanks for reaching out — I&apos;ve received your message and
                  will get back to you soon.
                </p>

                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="btn btn-outline mt-4"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <p className="text-eyebrow text-primary! mb-1">Send a message</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField
                    label="Full name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    autoComplete="name"
                  />

                  <FormField
                    label="Email address"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    autoComplete="email"
                  />
                </div>

                <FormField
                  label="Subject"
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Project collaboration"
                />

                <div>
                  <label htmlFor="contact-message" className="text-eyebrow block mb-2.5">
                    Message
                  </label>

                  <textarea
                    id="contact-message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={6}
                    placeholder="Tell me about your project or opportunity…"
                    className={`${fieldClass} py-3.5 resize-none`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="btn btn-primary w-full h-12! disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? "Sending…" : "Send message"}
                  <Send size={15} aria-hidden="true" />
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </Container>
    </section>
  );
}

/* ========================================
   FORM FIELD
======================================== */

const fieldClass = `
  w-full

  px-4

  rounded-2xl

  bg-background

  border
  border-border

  outline-none

  text-[15px]

  text-primary

  placeholder:text-muted

  transition-[border-color,box-shadow]
  duration-200

  hover:border-border-strong

  focus:border-primary
  focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-primary)_8%,transparent)]
`;

function FormField({
  label,
  type,
  name,
  value,
  onChange,
  placeholder,
  autoComplete,
}) {
  const id = `contact-${name}`;

  return (
    <div>
      <label htmlFor={id} className="text-eyebrow block mb-2.5">
        {label}
      </label>

      <input
        id={id}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`${fieldClass} h-12`}
      />
    </div>
  );
}

export default Contact;
