import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { client, urlFor } from "../sanity";
import { PortableText } from "@portabletext/react";
import { Helmet } from "react-helmet";
import {
  FacebookShareButton,
  TwitterShareButton,
  LinkedinShareButton,
  WhatsappShareButton,
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon,
  WhatsappIcon,
} from "react-share";

const BlogPostDetail = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [prevPost, setPrevPost] = useState(null);
  const [nextPost, setNextPost] = useState(null);
  const currentUrl = window.location.href;

  // PortableText custom components
  const components = {
    types: {
      image: ({ value }) => {
        if (!value || !value.asset) return null; // Defensive
        return (
          <img
            src={urlFor(value).width(800).url()}
            alt={value.alt || "Blog image"}
            className="rounded-xl my-8 mx-auto"
          />
        );
      },
    },
    block: {
      normal: ({ children }) => <p>{children}</p>,
      h1: ({ children }) => (
        <h1 className="text-3xl font-bold my-4">{children}</h1>
      ),
      h2: ({ children }) => (
        <h2 className="text-2xl font-semibold my-4">{children}</h2>
      ),
      h3: ({ children }) => (
        <h3 className="text-xl font-semibold my-4">{children}</h3>
      ),
      blockquote: ({ children }) => (
        <blockquote className="border-l-4 pl-4 italic my-4">{children}</blockquote>
      ),
      _: ({ children }) => <p>{children}</p>,
    },
    marks: {
      strong: ({ children }) => <strong>{children}</strong>,
      em: ({ children }) => <em>{children}</em>,
      link: ({ value, children }) => (
        <a
          href={value?.href || "#"}
          className="text-blue-500 underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {children}
        </a>
      ),
    },
    list: ({ children }) => <ul className="list-disc pl-5">{children}</ul>,
    listItem: ({ children }) => <li className="my-2">{children}</li>,
    code: ({ value }) => (
      <code className="bg-gray-200 p-1 rounded">{value}</code>
    ),
  };

  // Extract plain text for meta description
  const extractPlainText = (blocks) => {
    if (!blocks) return "";
    return blocks
      .map((block) => {
        if (block._type === "block" && Array.isArray(block.children)) {
          return block.children.map((child) => child.text).join("");
        }
        return "";
      })
      .join(" ")
      .trim();
  };

  useEffect(() => {
    if (!slug) return;

    client
      .fetch(
        `*[_type == "post" && slug.current == $slug][0]{
          title,
          body,
          publishedAt,
          author->{name, image, bio},
          mainImage,
          "prev": *[_type == "post" && publishedAt < ^.publishedAt] | order(publishedAt desc)[0]{
            title, slug
          },
          "next": *[_type == "post" && publishedAt > ^.publishedAt] | order(publishedAt asc)[0]{
            title, slug
          }
        }`,
        { slug }
      )
      .then((data) => {
        setPost(data);
        setPrevPost(data?.prev || null);
        setNextPost(data?.next || null);
      })
      .catch((error) => {
        console.error("Sanity fetch error:", error);
        setPost(null);
      });
  }, [slug]);

  if (!post) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-100 flex items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{post.title} | Blog</title>
        <meta
          name="description"
          content={extractPlainText(post.body).slice(0, 150)}
        />
      </Helmet>

      <div className="bg-slate-200 dark:bg-neutral-900 min-h-screen p-4 sm:p-6 md:p-10 text-gray-800 dark:text-gray-200 max-w-full mx-auto">
        <Link
          to="/blog"
          className="bg-blue-500 dark:bg-blue-600 hover:bg-blue-700 mb-6 px-4 py-2 rounded-lg inline-block text-white dark:text-gray-100 transition-colors duration-300 cursor-pointer"
        >
          ← Back to Blog
        </Link>

        {post.mainImage && post.mainImage.asset && (
          <img
            src={urlFor(post.mainImage).width(1200).url()}
            alt={post.title}
            className="rounded-xl mb-8 w-full max-h-[500px] object-cover shadow-lg"
          />
        )}

        <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
          {post.title}
        </h1>

        <div className="text-sm text-gray-600 dark:text-gray-400 mb-10 flex flex-wrap items-center gap-4">
          <span>
            By <span className="font-semibold">{post.author?.name || "Unknown"}</span>
          </span>
          <span>•</span>
          <span>{new Date(post.publishedAt).toDateString()}</span>
          <span>•</span>
          <span>
            {post.body
              ? Math.ceil(
                  post.body
                    .map((block) => block.children?.reduce((acc, c) => acc + c.text.length, 0) || 0)
                    .reduce((a, b) => a + b, 0) / 200
                )
              : 1}{" "}
            min read
          </span>
        </div>

        {/* Blog Post Body */}
        <PortableText value={post.body} components={components} />

        {/* Author Bio Box */}
        {post.author?.bio && (
          <div className="mt-16 flex items-start gap-4 border-t pt-10">
            {post.author?.image && post.author.image.asset && (
              <img
                src={urlFor(post.author.image).width(80).height(80).url()}
                alt={post.author.name}
                className="w-20 h-20 rounded-full object-cover"
              />
            )}
            <div>
              <h3 className="text-lg font-semibold mb-1">{post.author.name}</h3>
              <PortableText
                className="text-gray-600 dark:text-gray-400 text-sm"
                value={post.author.bio}
                components={components}
              />
            </div>
          </div>
        )}

        {/* Share Buttons */}
        <div className="mt-16 border-t pt-10">
          <h2 className="text-xl font-semibold mb-4">Share this post</h2>
          <div className="flex gap-4 flex-wrap">
            <FacebookShareButton url={currentUrl}>
              <FacebookIcon size={36} round />
            </FacebookShareButton>
            <TwitterShareButton url={currentUrl}>
              <TwitterIcon size={36} round />
            </TwitterShareButton>
            <LinkedinShareButton url={currentUrl}>
              <LinkedinIcon size={36} round />
            </LinkedinShareButton>
            <WhatsappShareButton url={currentUrl}>
              <WhatsappIcon size={36} round />
            </WhatsappShareButton>
          </div>
        </div>

        {/* Previous / Next Posts */}
        <div className="mt-16 border-t pt-10 flex justify-between items-center text-sm text-blue-600 dark:text-blue-400">
          {prevPost ? (
            <Link
              to={`/blog/${prevPost.slug.current}`}
              className="hover:underline"
            >
              ← {prevPost.title}
            </Link>
          ) : (
            <span />
          )}
          {nextPost ? (
            <Link
              to={`/blog/${nextPost.slug.current}`}
              className="hover:underline ml-auto"
            >
              {nextPost.title} →
            </Link>
          ) : (
            <span />
          )}
        </div>

        {/* Comments Placeholder */}
        <div className="mt-16 border-t pt-10">
          <h2 className="text-2xl font-semibold mb-4">Comments</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Comments section coming soon...
          </p>
        </div>
      </div>
    </>
  );
};

export default BlogPostDetail;
