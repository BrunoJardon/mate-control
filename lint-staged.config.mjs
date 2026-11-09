export default {
  '*.{js,jsx,ts,tsx,json,md,css,yml,yaml}': 'prettier --write',
  'apps/api/**/*.ts': () => 'pnpm --filter api lint',
  'apps/web/**/*.{ts,tsx,js,jsx}': () => 'pnpm --filter web lint',
};
