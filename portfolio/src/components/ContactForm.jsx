import { IoIosSend } from "react-icons/io";
import { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

const ContactForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = {
      apikey: "eaf38cfa-2b7d-48f1-8bad-b9b489e95b50",
      subject: "New Contact Form Submission",
      name,
      email,
      message,
    };

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Message sent successfully!");
        setName("");
        setEmail("");
        setMessage("");
      } else {
        toast.error("Failed to send message. Please try again.");
      }
    } catch (error) {
      console.error("Failed to send message. Please try again", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false); // Re-enable the button after the process finishes
    }
  };

  return (
    <>
      <ToastContainer />
      <div>
        <form
          className="flex flex-col bg-white shadow:xl dark:bg-neutral-800 rounded-xl gap-4"
          onSubmit={handleSubmit}
        >
          <div className="py-4 text-center text-black dark:text-white font-semibold">
            <h1 className="text-3xl">Get in Touch</h1>
          </div>
          <input type="hidden" name="apikey" value="eaf38cfa-2b7d-48f1-8bad-b9b489e95b50" />
          <input
            type="hidden"
            name="subject"
            value="New Contact Form Submission"
          />
          
          <input
            type="text"
            name="name"
            className="text-black dark:text-white bg-gray-100 dark:bg-neutral-700 px-4 py-2 mx-4 my-2 rounded-lg border border-gray-200 dark:border-neutral-700 shadow-sm placeholder:text-gray-500 focus:outline-none"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="email"
            name="email"
            className="text-black dark:text-white bg-gray-100 dark:bg-neutral-700 px-4 py-2 mx-4 my-2 rounded-lg border border-gray-200 dark:border-neutral-700 shadow-sm placeholder:text-gray-500 focus:outline-none"
            placeholder="Enter your email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <textarea
            name="message"
            className="resize-none text-black dark:text-white bg-gray-100 dark:bg-neutral-700 px-4 py-2 mx-4 my-2 rounded-lg border border-gray-200 dark:border-neutral-700 shadow-sm placeholder:text-gray-500 focus:outline-none"
            placeholder="Enter your message"
            required
            rows={7}
            cols={20}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          ></textarea>

          <button
            className={`px-4 py-2 bg-transparent border-black hover:bg-black hover:text-white dark:hover:bg-white dark:text-white dark:hover:text-black transition-colors border dark:border-white cursor-pointer mx-4 my-4 rounded-md ${
              isSubmitting ? "opacity-50 cursor-not-allowed" : ""
            }`}
            type="submit"
            disabled={isSubmitting}
          >
            <span>
              {isSubmitting ? "Sending..." : "Send Message"}
              <IoIosSend className="inline-block ml-2" />
            </span>
          </button>
        </form>
      </div>
    </>
  );
};

export default ContactForm;
