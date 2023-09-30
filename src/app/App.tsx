import { HeartIcon } from "@heroicons/react/24/solid"
import sync from "css-animation-sync"
import Fuse from "fuse.js"
import { debounce } from "lodash"
import { useCallback, useEffect, useState } from "preact/hooks"
import _TRACKS from "../tracks.json"
import TRACK_INDEX from "../tracks_index.json"
import Match from "./Match"
import ShareButton from "./ShareButton"
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
  const results = TRACKS_FUSE.search(query, { limit: 8 })
  if (results.length === 0) return null
  return { query, results }
}

export default function App() {
  useEffect(() => {
    sync("glitter-bg", "glitter")
  }, [])

  const [query, setQuery] = useState(window.location.hash.slice(1))

  const [results, setResults] = useState<{
    results: FuseResult[]
    query: string
  }>(null)

  const debouncedSearch = useCallback(
    debounce(query => {
      history.replaceState(null, "", query ? "#" + query.toUpperCase() : " ")
      setResults(search(query))
    }),
    [debounce, setResults, search],
  )

  useEffect(() => {
    debouncedSearch(query)
  }, [query])

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
          <label class="w-full">
            <div class="mb-4 text-lg text-neutral-400 sm:text-xl">
              Enter letters to find matching song titles and lyrics
            </div>

            <div class="flex flex-col gap-4 lg:flex-row lg:items-center">
              <input
                type="search"
                value={query}
                autofocus
                autocapitalize="characters"
                autocomplete="off"
                autocorrect="off"
                spellcheck={false}
                enterkeyhint="done"
                class="w-full animate-glitter-bg-slow appearance-none rounded-2xl border-4 p-4 font-slab text-2xl uppercase tracking-widest focus:outline-none"
                onInput={e => setQuery(e.currentTarget.value)}
                onKeyUp={e => e.key === "Enter" && e.currentTarget.blur()}
              />

              <div class="lg:mr-[-100%]">{results && <ShareButton />}</div>
            </div>
          </label>

          {results && (
            <div class="mb-8 mt-4 px-5">
              {results.results.map((match, i) => (
                <Match match={match} query={results.query} key={i} />
              ))}
            </div>
          )}
        </div>
      </div>

      <footer class="mt-16 shrink pb-10 text-center">
        Made with{" "}
        <GlitterColor slow={true} randomStart={false}>
          <HeartIcon class="inline h-6 w-6" />
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
