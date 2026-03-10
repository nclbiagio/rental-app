import packageInfo from '../../package.json';

export const environment = {
  production: true,
  version: packageInfo.version,
  apiUrl: '/api', // In prod, di solito FE e BE girano sullo stesso dominio
};
