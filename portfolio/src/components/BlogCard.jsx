import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MdArrowForward } from "react-icons/md";

const BlogCard = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className="mt-12 w-full"
    >
      <Link
        to="/blog"
        className="bg-gray-200 dark:bg-neutral-900 rounded-lg flex flex-col gap-3 items-center shadow-xl dark:shadow-glow px-4 py-4 hover:scale-105 delay-100 transition-transform duration-500 max-h-44 h-full"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Read My Blog
            </h3>
            <p className="text-sm text-gray-600 dark:text-neutral-400 max-w-md">
              Explore tutorials, insights, and stories on web development, tech, and creativity.
            </p>
          </div>
          <MdArrowForward className="text-gray-900 dark:text-white text-2xl group-hover:translate-x-1 transition-transform duration-300" />
        </div>
      </Link>
    </motion.div>
  );
};

export default BlogCard;
