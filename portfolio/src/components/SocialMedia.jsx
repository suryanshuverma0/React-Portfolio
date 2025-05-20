import {
  FaLinkedin,
  FaGithub,
  FaFacebook,
  FaInstagram,
  FaEnvelope
} from "react-icons/fa";
import { FaSquareXTwitter } from "react-icons/fa6";

const socialLinks = [
  {
    href: "https://www.linkedin.com/in/suryanshu-verma0/",
    icon: <FaLinkedin />,
    className: "text-blue-700",
    ariaLabel: "LinkedIn"
  },
  {
    href: "https://github.com/suryanshuverma0",
    icon: <FaGithub />,
    className: "text-black dark:text-white",
    ariaLabel: "GitHub"
  },
  {
    href: "https://x.com/SuryanshuVerma5",
    icon: <FaSquareXTwitter />,
    className: "text-black dark:text-white",
    ariaLabel: "X (Twitter)"
  },
  {
    href: "https://www.instagram.com/suryanshu_0/",
    icon: <FaInstagram />,
    className: "text-pink-500",
    ariaLabel: "Instagram"
  },
  {
    href: "https://www.facebook.com/suryanshu010",
    icon: <FaFacebook />,
    className: "text-blue-600",
    ariaLabel: "Facebook"
  },
  {
    href: "mailto:veenasa676@gamil.com",
    icon: <FaEnvelope />,
    className: "text-red-500",
    ariaLabel: "Email"
  }
];

const SocialMedia = () => {
  return (
    <div className="flex gap-8 justify-center items-center text-lg md:text-2xl lg:text-2xl transition-transform bg-gray-200 dark:bg-neutral-900">
      {socialLinks.map(({ href, icon, className, ariaLabel }, index) => (
        <a
          key={index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`cursor-pointer hover:scale-125 ${className}`}
          aria-label={ariaLabel}
        >
          {icon}
        </a>
      ))}
    </div>
  );
};

export default SocialMedia;
