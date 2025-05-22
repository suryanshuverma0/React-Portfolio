import { useEffect, useState } from "react";
import { client } from "../sanity";
import { PortableText } from "@portabletext/react";
import { Link } from "react-router-dom";
import { FaMoon } from "react-icons/fa";
import { LuSun } from "react-icons/lu";

const Blog = () => {
  const [posts, setPosts] = useState([]);
  const [mode, setMode] = useState(() => localStorage.getItem("theme") || "dark");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", mode === "dark");
    localStorage.setItem("theme", mode);
  }, [mode]);

  const handleToggle = () => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  useEffect(() => {
    client
      .fetch(`*[_type == "post"]{title, slug, body}`)
      .then((data) => setPosts(data))
      .catch(console.error);
  }, []);

  return (
    <div className="bg-white dark:bg-neutral-900 min-h-screen py-10 px-4 sm:px-8 lg:px-16 text-gray-900 dark:text-gray-100">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-4xl font-bold tracking-tight">My Blog</h1>
        <button onClick={handleToggle} className="text-2xl">
          {mode === "dark" ? <LuSun /> : <FaMoon />}
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3 sm:grid-cols-2">
        {posts.map((post) => (
          <div
            key={post.slug.current}
            className="bg-gray-100 dark:bg-neutral-800 rounded-xl shadow-md hover:shadow-xl transition-shadow p-6 flex flex-col justify-between"
          >
            <h2 className="text-2xl font-semibold mb-4">{post.title}</h2>
            <div className="line-clamp-4 mb-4 prose prose-neutral dark:prose-invert text-sm">
              <PortableText value={post.body} />
            </div>
            <Link
              to={`/blog/${post.slug.current}`}
              className="self-start mt-2 px-4 py-2 rounded-lg border border-gray-800 dark:border-gray-100 text-gray-900 dark:text-white hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-black"
            >
              Read More →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Blog;
