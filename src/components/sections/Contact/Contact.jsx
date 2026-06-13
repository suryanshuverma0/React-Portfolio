import {
  motion,
} from "framer-motion";

import {
  Send,
} from "lucide-react";

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

function Contact() {

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

                {contactContent.contacts.map(
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

                  {contactContent.socials.map(
                    (
                      item,
                      index
                    ) => {

                      const Icon =
                        iconMap[item.icon];

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

            <form
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
                placeholder="John Doe"
              />

              {/* EMAIL */}

              <FormField
                label="Email Address"
                type="email"
                placeholder="john@example.com"
              />

              {/* SUBJECT */}

              <FormField
                label="Subject"
                type="text"
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
                "
              >

                Send Message

                <Send
                  size={16}
                />

              </button>

            </form>

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
