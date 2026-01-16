export async function preloadFont(fontFamily: string, url: string | URL, signal: AbortSignal | undefined = undefined): Promise<void> {
  try {
    const response = await fetch(url, {
      headers: {
        "cache-control": "max-age=31536000",
      },
      signal,
    });
    const data = await response.arrayBuffer();
    const font = await new FontFace(fontFamily, data).load();
    document.fonts.add(font);
    console.info(`Font ${fontFamily} preload done.`);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    console.error(error);
  }
}
