// Auto-discovered by web-ext (build/sign/lint/run) — no --config flag needed.
// Excludes dev tooling and design-system sources that the extension never
// loads at runtime. node_modules/ and dotfiles are already excluded by
// web-ext's own defaults.
module.exports = {
  ignoreFiles: [
    'components/**',
    'stories/**',
    '.storybook/**',
    'harvester/**',
    'screenshots/**',
    'wireframes/**',
    'storybook-static/**',
    'web-ext-artifacts/**',
    'pages/components.js',
    'tokens/tokens.json',
    'package.json',
    'package-lock.json',
    'progress.md',
    'prompts.md',
    'README.md',
    'web-ext-config.cjs',
  ],
};
