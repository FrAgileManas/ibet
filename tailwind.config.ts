import type { Config } from 'tailwindcss'

const config: Config = {
  // content is an array of paths to all of your template files.
  // Tailwind will scan these files for class names and generate the corresponding CSS.
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // The theme object is where you define your project's color palette,
  // type scale, fonts, breakpoints, border radius values, and more.
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  // The plugins array allows you to register new plugins with Tailwind.
  // Plugins can be used to add new utilities, components, base styles, or variants.
  plugins: [],
}
export default config
