import * as fs from "fs"
import FuseModule from "fuse.js"
import { parseTracks } from "../src/tracksearch.ts"
import LYRICS from "./run/lyrics.json" assert { type: "json" }
import _TRACKS_BY_ALBUM from "./tracks.json" assert { type: "json" }

const Fuse = FuseModule as unknown as typeof FuseModule.default

function isAlpha(string: string) {
  return /^[A-z]+$/.test(string)
}

function isLowerCase(string: string) {
  return string === string.toLowerCase() && string !== string.toUpperCase()
}

function isUpperCase(string: string) {
  return string === string.toUpperCase() && string !== string.toLowerCase()
}

function splitByLetters(string: string): string[] {
  const words: string[] = [""] // first word is empty if first char is alpha
  string.split("").forEach((letter, i) => {
    const prev = i == 0 ? null : string[i - 1]
    if (letter === "0" && prev === "1") {
      // ATW*T*MV
      words[words.length - 1] = words[words.length - 1].slice(0, -1)
      words.push("10")
    } else if (
      (isAlpha(letter) &&
        (prev == null ||
          (!isAlpha(prev) && prev !== "'" && prev !== "’") ||
          // e.g. Tim McGraw
          (isLowerCase(prev) && isUpperCase(letter)) ||
          (prev === "'" && string[i - 2] === " "))) ||
      letter === "&"
    ) {
      words.push(letter)
    } else {
      words[words.length - 1] += letter
    }
  })
  return words
}

const TRACKS = _TRACKS_BY_ALBUM
  .map(album =>
    album.tracks.map(title => {
      const titleWords = splitByLetters(title)

      let lyrics = LYRICS[album.id] && LYRICS[album.id][title]
      let lyricsWords: string[] | null = null
      if (lyrics) {
        lyrics = lyrics.replace(/[",]/g, " ").replace(/\s+/g, " ").toLowerCase()
        lyricsWords = splitByLetters(lyrics)
      }

      console.assert(title === titleWords.join(""), title, titleWords)
      console.assert(
        lyricsWords == null || lyrics === lyricsWords.join(""),
        lyrics,
        lyricsWords,
      )

      return {
        title,
        titleWords,
        lyrics,
        lyricsWords,
        albumId: album.id,
      }
    }),
  )
  .flat()

const handleError = err => {
  if (err) {
    console.error(err)
    return
  }
  console.log("File has been created")
}

const SRC_TRACKS = TRACKS.map(t => ({
  titleWords: t.titleWords,
  lyricsWords: t.lyricsWords,
  albumId: t.albumId,
}))

fs.writeFile("../src/tracks.json", JSON.stringify(SRC_TRACKS), handleError)

fs.writeFile(
  "./run/tracks.pretty.json",
  JSON.stringify(
    SRC_TRACKS.map(t => ({
      titleWords: t.titleWords,
      lyricsLetters:
        t.lyricsWords &&
        t.lyricsWords.map(w => (w.length ? w[0] : "")).join(""),
      albumId: t.albumId,
    })),
    null,
    2,
  ),
  handleError,
)

const index = Fuse.createIndex(
  ["title", "titleLetters", "lyricsLetters"],
  parseTracks(SRC_TRACKS),
)

fs.writeFile("../src/tracks_index.json", JSON.stringify(index), handleError)
