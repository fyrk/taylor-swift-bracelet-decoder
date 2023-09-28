export function parseTracks(
  tracks: Array<{
    titleWords: string[]
    lyricsWords: string[] | null
    albumId: string
  }>,
) {
  return tracks.map(t => ({
    ...t,
    title: t.titleWords.join(""),
    titleLetters: t.titleWords
      .slice(1)
      .map(w => (w.length ? w[0] : ""))
      .join(""),
    lyricsLetters:
      t.lyricsWords &&
      t.lyricsWords
        .slice(1)
        .map(w => (w.length ? w[0] : ""))
        .join(""),
  }))
}
