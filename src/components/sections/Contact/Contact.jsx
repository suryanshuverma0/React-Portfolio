import {
  motion,
} from "framer-motion";

import {
  Send,
} from "lucide-react";

import Container from "../../ui/Container";

import SectionTitle from "../../ui/SectionTitle";

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

          title={contactContent.title}

          description={contactContent.description}
        />

        {/* GRID */}

        <div
          className="
            grid

            grid-cols-1
            lg:grid-cols-[0.9fr_1.1fr]

            gap-5
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

              h-full

              flex
              flex-col
              justify-between
            "
          >

            <div>

              {/* TOP */}

              <div
                className="
                  flex
                  items-center

                  gap-2

                  mb-6
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

                  mb-8
                "
              >

                Open to backend engineering, blockchain development, freelance collaborations, and product-focused opportunities.

              </p>

              {/* CONTACT ITEMS */}

              <div
                className="
                  flex
                  flex-col

                  gap-5
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

                          gap-4
                        "
                      >

                        {/* ICON */}

                        <div
                          className="
                            h-11
                            w-11

                            rounded-2xl

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
                            size={18}
                          />

                        </div>

                        {/* CONTENT */}

                        <div>

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
                  mt-10

                  pt-6

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

                    gap-3
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
                            h-11
                            w-11

                            rounded-2xl

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
                          "
                        >

                          <Icon
                            size={18}
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
                mt-10

                pt-6

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

                gap-5
              "
            >

              {/* NAME */}

              <div>

                <label
                  className="
                    text-muted

                    block

                    mb-2
                  "
                >

                  Full Name

                </label>

                <input

                  type="text"

                  placeholder="John Doe"

                  className="
                    w-full

                    h-control

                    px-control

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

              {/* EMAIL */}

              <div>

                <label
                  className="
                    text-muted

                    block

                    mb-2
                  "
                >

                  Email Address

                </label>

                <input

                  type="email"

                  placeholder="john@example.com"

                  className="
                    w-full

                    h-control

                    px-control

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

              {/* SUBJECT */}

              <div>

                <label
                  className="
                    text-muted

                    block

                    mb-2
                  "
                >

                  Subject

                </label>

                <input

                  type="text"

                  placeholder="Project Collaboration"

                  className="
                    w-full

                    h-control

                    px-control

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

                  rows={6}

                  placeholder="Tell me about your project or opportunity..."

                  className="
                    w-full

                    px-control
                    py-4

                    rounded-[24px]

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
                  h-control

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

export default Contact;