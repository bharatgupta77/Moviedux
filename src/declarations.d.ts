// Tells TypeScript that importing .css files is valid.
// CRA's webpack handles the actual CSS loading at runtime.
declare module '*.css';
declare module '*.svg' {
  const content: string;
  export default content;
}
declare module '*.png';
declare module '*.jpg';