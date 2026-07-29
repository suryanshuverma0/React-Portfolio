import {
  motion,
} from "framer-motion";

import {
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

function Contact() {

  const [settings, setSettings] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [sending, setSending] = useState(false);
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

  return (

    <section
      id="contact"

      className="
        section
      "
    >

      <Container>

        {/* TITLE */}

        <SectionTitle

          eyebrow="Contact"

          title={
            contactContent.title
          }

          description={
            contactContent.description
          }
        />

        {/* GRID */}

        <div
          className="
            grid

            grid-cols-1
            xl:grid-cols-[0.92fr_1.08fr]

            gap-4
            md:gap-5
          "
        >

          {/* LEFT */}

          <motion.div

            initial={{
              opacity: 0,
              y: 20,
            }}

            whileInView={{
              opacity: 1,
              y: 0,
            }}

            viewport={{
              once: true,
            }}

            transition={{
              duration: 0.4,
            }}

            className="
              card

              flex
              flex-col
              justify-between

              h-full
            "
          >

            <div>

              {/* HEADER */}

              <div
                className="
                  flex
                  items-center

                  gap-2

                  mb-5
                "
              >

                <div
                  className="
                    h-2
                    w-2

                    rounded-full

                    bg-blue-500
                  "
                />

                <p
                  className="
                    text-label
                  "
                >

                  Contact Information

                </p>

              </div>

              {/* DESCRIPTION */}

              <p
                className="
                  text-body

                  mb-7
                "
              >

                Open to backend engineering,
                blockchain development,
                freelance collaborations,
                and product-focused opportunities.

              </p>

              {/* CONTACT ITEMS */}

              <div
                className="
                  flex
                  flex-col

                  gap-4
                "
              >

                {contacts.map(
                  (
                    item,
                    index
                  ) => {

                    const Icon =
                      iconMap[item.type];

                    return (

                      <div
                        key={index}

                        className="
                          flex
                          items-start

                          gap-3
                        "
                      >

                        {/* ICON */}

                        <div
                          className="
                            h-10
                            w-10

                            rounded-xl

                            bg-surface

                            border
                            border-border

                            flex
                            items-center
                            justify-center

                            shrink-0
                          "
                        >

                          <Icon
                            size={16}
                          />

                        </div>

                        {/* CONTENT */}

                        <div
                          className="
                            min-w-0
                          "
                        >

                          <p
                            className="
                              text-muted

                              mb-1
                            "
                          >

                            {item.label}

                          </p>

                          {item.href ? (

                            <a

                              href={item.href}

                              className="
                                text-label

                                break-all

                                hover:opacity-70

                                transition-opacity
                              "
                            >

                              {item.value}

                            </a>

                          ) : (

                            <p
                              className="
                                text-label

                                break-all
                              "
                            >

                              {item.value}

                            </p>

                          )}

                        </div>

                      </div>

                    );
                  }
                )}

              </div>

              {/* SOCIALS */}

              <div
                className="
                  mt-8

                  pt-5

                  border-t
                  border-border
                "
              >

                <p
                  className="
                    text-muted

                    mb-4
                  "
                >

                  Social Links

                </p>

                <div
                  className="
                    flex
                    flex-wrap

                    gap-2
                  "
                >

                  {socials.map(
                    (
                      item,
                      index
                    ) => {

                      const Icon =
                        iconMap[item.icon];

                      if (!Icon) return null;

                      return (

                        <a
                          key={index}

                          href={item.href}

                          target="_blank"

                          rel="noreferrer"

                          className="
                            h-10
                            w-10

                            rounded-xl

                            bg-surface

                            border
                            border-border

                            flex
                            items-center
                            justify-center

                            text-secondary

                            transition-all
                            duration-300

                            hover:text-primary
                            hover:bg-background
                          "
                        >

                          <Icon
                            size={16}
                          />

                        </a>

                      );
                    }
                  )}

                </div>

              </div>

            </div>

            {/* FOOTER */}

            <div
              className="
                mt-7

                pt-5

                border-t
                border-border
              "
            >

              <p
                className="
                  text-small
                "
              >

                Usually responds within 24 hours.

              </p>

            </div>

          </motion.div>

          {/* FORM */}

          <motion.div

            initial={{
              opacity: 0,
              y: 20,
            }}

            whileInView={{
              opacity: 1,
              y: 0,
            }}

            viewport={{
              once: true,
            }}

            transition={{
              duration: 0.4,
              delay: 0.08,
            }}

            className="
              card
            "
          >

            {sent ? (
              <div
                className="
                  h-full

                  flex
                  flex-col
                  items-center
                  justify-center

                  text-center

                  gap-3

                  py-10
                "
              >
                <div
                  className="
                    h-11
                    w-11

                    rounded-2xl

                    bg-primary

                    text-background

                    flex
                    items-center
                    justify-center

                    text-sm
                    font-semibold
                  "
                >
                  ✓
                </div>

                <p className="text-label">Message sent</p>

                <p className="text-small max-w-xs">
                  Thanks for reaching out — I've received your message and
                  will get back to you soon.
                </p>

                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="
                    mt-2

                    text-small

                    text-primary

                    hover:opacity-70

                    transition-opacity
                  "
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="
                  flex
                  flex-col

                  gap-4
                "
              >

                {/* NAME */}

                <FormField
                  label="Full Name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                />

                {/* EMAIL */}

                <FormField
                  label="Email Address"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                />

                {/* SUBJECT */}

                <FormField
                  label="Subject"
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Project Collaboration"
                />

                {/* MESSAGE */}

                <div>

                  <label
                    className="
                      text-muted

                      block

                      mb-2
                    "
                  >

                    Message

                  </label>

                  <textarea

                    name="message"

                    value={formData.message}

                    onChange={handleChange}

                    rows={5}

                    placeholder="
                      Tell me about your project
                      or opportunity...
                    "

                    className="
                      w-full

                      px-4
                      py-3

                      rounded-[22px]

                      bg-surface

                      border
                      border-border

                      outline-none

                      resize-none

                      text-label

                      transition-all
                      duration-300

                      focus:border-primary
                    "
                  />

                </div>

                {/* BUTTON */}

                <button

                  type="submit"

                  disabled={sending}

                  className="
                    h-10
                    md:h-11

                    px-control

                    rounded-control

                    bg-primary

                    text-background

                    inline-flex
                    items-center
                    justify-center

                    gap-2

                    text-label

                    transition-all
                    duration-300

                    hover:opacity-90

                    disabled:opacity-50
                    disabled:cursor-not-allowed
                  "
                >

                  {sending ? "Sending..." : "Send Message"}

                  <Send
                    size={16}
                  />

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

function FormField({
  label,
  type,
  name,
  value,
  onChange,
  placeholder,
}) {

  return (

    <div>

      <label
        className="
          text-muted

          block

          mb-2
        "
      >

        {label}

      </label>

      <input

        type={type}

        name={name}

        value={value}

        onChange={onChange}

        placeholder={placeholder}

        className="
          w-full

          h-10
          md:h-11

          px-4

          rounded-control

          bg-surface

          border
          border-border

          outline-none

          text-label

          transition-all
          duration-300

          focus:border-primary
        "
      />

    </div>

  );
}

export default Contact;
