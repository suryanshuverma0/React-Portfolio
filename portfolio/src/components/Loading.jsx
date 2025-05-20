
// const Loading = () => {
//   return (
//     <div className="fixed inset-0 flex items-center justify-center bg-neutral-950">
//       <div className="w-64 h-1 bg-gray-700 rounded-full overflow-hidden">
//         <div className="w-1/2 h-full bg-red-500 animate-[progress_2s_ease-in-out]"></div>
//       </div>
//     </div>
//   );
// };

// export default Loading;


import { Typewriter } from 'react-simple-typewriter';

const Loading = () => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-neutral-950 text-white z-50 animate-fadeIn">
      {/* Typing Name Effect */}
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-wider mb-6 font-mono">
        <Typewriter
          words={['Suryanshu Verma']}
          loop={1}
          cursor
          cursorStyle="|"
          typeSpeed={100}
          deleteSpeed={50}
          delaySpeed={1000}
        />
      </h1>

      {/* Smooth Progress Bar */}
      <div className="w-64 h-1 bg-neutral-800 rounded-full overflow-hidden">
        <div className="h-full bg-red-500 rounded-full animate-loader"></div>
      </div>

      {/* Custom Animations */}
      {/* <style>
        {`
          @keyframes loader {
            0% { transform: translateX(-100%); width: 30%; }
            50% { transform: translateX(50%); width: 70%; }
            100% { transform: translateX(100%); width: 30%; }
          }

          .animate-loader {
            animation: loader 2s ease-in-out infinite;
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          .animate-fadeIn {
            animation: fadeIn 0.6s ease-out;
          }
        `}
      </style> */}
    </div>
  );
};

export default Loading;
