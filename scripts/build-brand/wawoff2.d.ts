declare module 'wawoff2' {
  const wawoff2: {
    decompress(data: Uint8Array): Promise<Uint8Array>;
    compress(data: Uint8Array): Promise<Uint8Array>;
  };
  export default wawoff2;
}
