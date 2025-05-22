import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { client, urlFor } from "../sanity";
import { PortableText } from "@portabletext/react";
import { Helmet } from "react-helmet";
// import { motion } from 'framer-motion';
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

  const components = {
    types: {
      image: ({ value }) => (
        <img
          src={urlFor(value).width(800).url()}
          alt={value.alt || "Blog image"}
          className="rounded-xl my-8 mx-auto"
        />
      ),
    },
  };

  useEffect(() => {
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
        setPrevPost(data.prev);
        setNextPost(data.next);
      })
      .catch(console.error);
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
          content={post.body[0]?.children[0]?.text?.slice(0, 150)}
        />
      </Helmet>

      <div
        // initial={{ opacity: 0, y: 20 }}
        // animate={{ opacity: 1, y: 0 }}
        // transition={{ duration: 0.5 }}
        className="bg-slate-200 dark:bg-neutral-900 min-h-screen p-4 sm:p-6 md:p-10 text-gray-800 dark:text-gray-200 max-w-full mx-auto"
      >
        <Link
          to="/blog"
          className="bg-blue-500 dark:bg-blue-600 hover:bg-blue-700 mb-6 px-4 py-2 rounded-lg inline-block text-white dark:text-gray-100 transition-colors duration-300 cursor-pointer"
        >
          ← Back to Blog
        </Link>

        {post.mainImage && (
          <img
            src={urlFor(post.mainImage).url()}
            alt={post.title}
            className="rounded-xl mb-8 w-full max-h-[500px] object-cover shadow-lg"
          />
        )}

        <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
          {post.title}
        </h1>

        <div className="text-sm text-gray-600 dark:text-gray-400 mb-10 flex flex-wrap items-center gap-4">
          <span>
            By <span className="font-semibold">{post.author?.name}</span>
          </span>
          <span>•</span>
          <span>{new Date(post.publishedAt).toDateString()}</span>
          <span>•</span>
          <span>{Math.ceil(post.body.length / 200)} min read</span>
        </div>

        {/* Blog Post Body */}
          <PortableText  className="prose prose-neutral dark:prose-invert max-w-none" value={post.body} components={components} />
        

        {/* Author Bio Box */}
        {post.author?.bio && (
          <div className="mt-16 flex items-start gap-4 border-t pt-10">
            {post.author?.image && (
              <img
                src={urlFor(post.author.image).width(80).height(80).url()}
                alt={post.author.name}
                className="w-20 h-20 rounded-full object-cover"
              />
            )}
            <div>
              <h3 className="text-lg font-semibold mb-1">{post.author.name}</h3>
              
                {/* {post.author.bio} */}
                <PortableText className="text-gray-600 dark:text-gray-400 text-sm" value={post.author.bio} components={components} />
              
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
