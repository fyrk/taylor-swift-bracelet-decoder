import "dotenv/config"
import * as fs from "node:fs/promises"
import { ProviderMusixmatch } from "./ProviderMusixmatch.js"
import TRACKS from "./tracks.json" assert { type: "json" }

const { findLyrics, getKaraoke, getSynced, getUnsynced, getTranslation } =
  ProviderMusixmatch

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const LYRICS = JSON.parse(await fs.readFile("./run/lyrics.json", "utf-8"))

for (const album of TRACKS) {
  if (album.lyrics == false) continue
  if (!LYRICS[album.id]) {
    LYRICS[album.id] = {}
  }
  for (const track of album.tracks) {
    if (!LYRICS[album.id][track]) {
      console.log(`Fetching lyrics for ${track} (${album.name})`)
      const body = await findLyrics({
        album: album.name,
        artist: "Taylor Swift",
        title: track,
        token: process.env.MUSIXMATCH_TOKEN,
      })
      if (body.error) {
        throw new Error(body.error)
      }
      const lyrics = getUnsynced(body)
      if (!lyrics) {
        throw new Error(`No lyrics found for ${track} (${album.name})`)
      }
      LYRICS[album.id][track] = lyrics
      await fs.writeFile("./run/lyrics.json", JSON.stringify(LYRICS, null, 2))
      await sleep(30000 + Math.random() * 5000)
    }
  }
}
