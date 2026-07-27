import { useEffect, useRef, useState } from "react";

import PropTypes from "prop-types";

import { GoogleLogin } from "@react-oauth/google";

/* ========================================
   DARK MODE DETECTION

   Theme is toggled by adding/removing a
   "dark" class on <html> (see ThemeToggle).
   We mirror that here so Google's button
   matches the current theme.
========================================= */

function useIsDarkMode() {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    const root = document.documentElement;

    const observer = new MutationObserver(() => {
      setIsDark(root.classList.contains("dark"));
    });

    observer.observe(root, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return isDark;
}

function GoogleAuthButton({ text = "continue_with", onSuccess, onError }) {
  const isDark = useIsDarkMode();

  const containerRef = useRef(null);

  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (containerRef.current) {
      setWidth(containerRef.current.offsetWidth);
    }
  }, []);

  const handleSuccess = (credentialResponse) => {
    if (!credentialResponse?.credential) {
      onError?.(new Error("Google did not return a credential"));

      return;
    }

    onSuccess(credentialResponse.credential);
  };

  const handleError = () => {
    onError?.(new Error("Google sign-in failed"));
  };

  return (
    <div ref={containerRef} className="flex w-full justify-center">
      {width > 0 && (
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={handleError}
          theme={isDark ? "filled_black" : "outline"}
          shape="pill"
          size="large"
          text={text}
          width={width}
        />
      )}
    </div>
  );
}

GoogleAuthButton.propTypes = {
  text: PropTypes.oneOf([
    "signin_with",
    "signup_with",
    "continue_with",
    "signin",
  ]),
  onSuccess: PropTypes.func.isRequired,
  onError: PropTypes.func,
};

export default GoogleAuthButton;
