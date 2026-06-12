// Permet les imports CSS (ex. global.css pour les polices web) hors du
// expo-env.d.ts généré, afin que `tsc --noEmit` passe sans `expo start`.
declare module '*.css';
