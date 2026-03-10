import packageInfo from '../../package.json';

export const environment = {
  production: false,
  version: packageInfo.version + '-dev', // Utile per capire a colpo d'occhio che sei in locale
  apiUrl: 'http://localhost:3000/api',
};
