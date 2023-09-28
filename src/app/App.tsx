import Fuse from "fuse.js"
import { useState } from "preact/hooks"
import _TRACKS from "../tracks.json"
import TRACK_INDEX from "../tracks_index.json"
import Match from "./Match"
import { GlitterColor, GlitterLetters } from "./glitter"
import { parseTracks } from "./trackutils"

export type FuseResult = Fuse.FuseResult<(typeof TRACKS)[0]>

const TRACKS = parseTracks(_TRACKS)

const TRACKS_FUSE = new Fuse(
  TRACKS,
  {
    keys: [
      {
        name: "title",
        weight: 0.5,
      },
      "titleLetters",
      "lyricsLetters",
    ],
    includeMatches: true,
    includeScore: true,
    ignoreFieldNorm: true,
    ignoreLocation: true,
  },
  Fuse.parseIndex(TRACK_INDEX),
)

const search = (query: string) => {
  const matches = TRACKS_FUSE.search(query, { limit: 8 })
  if (matches.length === 0) return null
  return { matches, query }
}

export default function App() {
  const [results, setResults] = useState<{
    matches: FuseResult[]
    query: string
  }>(null)

  return (
    <div class="flex h-full flex-col p-3 text-center sm:p-5">
      <div class="flex-grow">
        <h1 class="mt-5 grow text-[max(min(4rem,6vw),2.5rem)] font-medium leading-[1.2] sm:mt-10">
          Taylor&nbsp;Swift Bracelet&nbsp;Decoder
        </h1>
        <div class="mt-2 font-slab text-[max(min(2.5rem,4vw),1.5rem)] font-medium uppercase tracking-wider sm:mt-4">
          <GlitterLetters text="hey kids, spelling is fun!" />
        </div>
        <div class="mx-auto mt-8 max-w-lg p-2 sm:mt-10">
          <label>
            <div class="mb-4 text-lg text-neutral-400 sm:text-xl">
              Enter letters to find matching song titles and lyrics
            </div>
            <input
              type="text"
              autofocus
              spellcheck={false}
              enterkeyhint="done"
              class="w-full animate-glitter-bg-slow appearance-none rounded-2xl border-4 p-4 font-slab text-2xl uppercase tracking-widest focus:outline-none"
              onInput={e => setResults(search(e.currentTarget.value))}
              onKeyUp={e => e.key === "Enter" && e.currentTarget.blur()}
            />
          </label>
          <div class="mb-8 mt-9 px-5">
            {results &&
              results.matches.map((match, i) => (
                <Match match={match} query={results.query} key={i} />
              ))}
          </div>
        </div>
      </div>

      <footer class="mt-16 shrink pb-4 text-center">
        Made with{" "}
        <GlitterColor slow={true} randomStart={false}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            class="inline-block h-6 w-6"
          >
            <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
          </svg>
          <span class="text-body"> by </span>
          <a
            class="hover:underline"
            href="https://github.com/FlorianRaediker"
            target="_blank"
            rel="noopener noreferrer"
          >
            flo (Taylor’s Version)
          </a>
        </GlitterColor>{" "}
      </footer>
    </div>
  )
}
