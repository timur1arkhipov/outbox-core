export const DOCUMENTATION_HOST =
  'blablabla';

export const WORKDIR = process.env['NODE_ENV']?.startsWith('local')
  ? './src'
  : './dist';
