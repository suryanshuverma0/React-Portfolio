// /** @type {import('tailwindcss').Config} */
// export default {
//   darkMode:'class',
//   content: [
//     "./index.html",
//     "./src/**/*.{js,ts,jsx,tsx}",
//   ],
//   theme: {
//     extend: {
//       boxShadow: {
//         glow: '0 0 15px 5px rgba(255, 255, 255, 0.2)', 
//       },
//       keyframes: {
//         progress: {
//           '0%': { transform: 'translateX(-100%)' },
//           '50%': { transform: 'translateX(50%)' },
//           '100%': { transform: 'translateX(100%)' },
//         }
//       },
//       animation: {
//         'progress': 'progress 2s ease-in-out',
//       }
//     },
//   },
//   plugins: [],
// }

import typography from '@tailwindcss/typography'
import lineClamp from '@tailwindcss/line-clamp';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        glow: '0 0 15px 5px rgba(255, 255, 255, 0.2)',
      },
      // keyframes: {
      //   progress: {
      //     '0%': { transform: 'translateX(-100%)' },
      //     '50%': { transform: 'translateX(50%)' },
      //     '100%': { transform: 'translateX(100%)' },
      //   },
      // },
      // animation: {
      //   progress: 'progress 2s ease-in-out',
      // },
    },
  },
  plugins: [typography,lineClamp],
}
