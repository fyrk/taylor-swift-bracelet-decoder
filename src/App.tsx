import Fuse from "fuse.js"
import { useMemo, useState } from "preact/hooks"
import TRACKS from "./tracks.json"
import TRACK_INDEX from "./tracks_index.json"

const TRACKS_FUSE = new Fuse(
  TRACKS,
  {
    keys: ["title", "titleLetters"],
    includeMatches: true,
    ignoreFieldNorm: true,
  },
  Fuse.parseIndex(TRACK_INDEX),
)

const findMatches = (letters: string) => {
  return TRACKS_FUSE.search(letters, { limit: 8 })
}

type FuseResult = Fuse.FuseResult<(typeof TRACKS)[0]>

function GlitterLetters({ text }: { text: string }) {
  const letters = text.split("")
  const delays = useMemo(
    () => [...Array(text.length)].map(() => `-${Math.random() * 10}s`),
    [text],
  )
  return (
    <span>
      {letters.map((letter, i) => (
        <span
          class="motion-safe:animate-glitter"
          style={{
            animationDelay: delays[i],
          }}
          key={i}
        >
          {letter}
        </span>
      ))}
    </span>
  )
}

const MATCH_DEBUG = false

function Match({ match }: { match: FuseResult }) {
  let highlightIndices: boolean[] = Array(match.item.title.length).fill(false)

  const titleMatches = match.matches.filter(m => m.key === "title")
  const titleLettersMatches = match.matches.filter(
    m => m.key === "titleLetters",
  )

  const titleMatchLetterCount =
    titleMatches.length > 0
      ? titleMatches[0].indices.reduce((p, [s, e]) => p + (e - s + 1), 0)
      : 0
  const titleLettersMatchLetterCount =
    titleLettersMatches.length > 0
      ? titleLettersMatches[0].indices.reduce((p, [s, e]) => p + (e - s + 1), 0)
      : 0

  if (titleLettersMatchLetterCount >= titleMatchLetterCount) {
    titleLettersMatches[0].indices.forEach(([start, end]) => {
      for (let i = start; i <= end; i++) {
        highlightIndices[match.item.titleLettersIndices[i]] = true
      }
    })
  } else {
    titleMatches[0].indices.forEach(([start, end]) => {
      for (let i = start; i <= end; i++) {
        highlightIndices[i] = true
      }
    })
  }

  const titleElement = (
    <div class="font-slab text-2xl">
      {match.item.title.split("").map((letter, i) => (
        <span
          class={highlightIndices[i] ? "font-bold" : "text-neutral-400"}
          key={i}
        >
          {letter}
        </span>
      ))}
    </div>
  )

  return (
    <div class="mx-auto mt-4 max-w-xl text-left">
      <div class="font-slab text-xl">{titleElement}</div>
      {MATCH_DEBUG && (
        <span>
          {JSON.stringify(
            match.matches.map(m => ({
              key: m.key,
              indices: m.indices,
              value: m.value,
            })),
          )}
        </span>
      )}
    </div>
  )
}

export function App() {
  const [matches, setMatches] = useState<FuseResult[]>([])

  return (
    <div class="p-3 text-center sm:p-5">
      <h1 class="mt-5 text-[max(min(4rem,6vw),2.5rem)] font-medium leading-[1.2] sm:mt-10">
        Taylor&nbsp;Swift Bracelet&nbsp;Decoder
      </h1>
      <div class="font-slab mt-2 text-[max(min(2.5rem,4vw),1.5rem)] font-medium uppercase tracking-wider sm:mt-4">
        <GlitterLetters text="hey kids, spelling is fun!" />
      </div>
      <div class="mx-auto mt-8 max-w-lg p-2 sm:mt-10">
        <label>
          <div class="mb-4 text-lg text-neutral-400 sm:text-xl">
            Enter letters to find matching songs
          </div>
          <input
            type="text"
            autofocus
            spellcheck={false}
            enterkeyhint="done"
            class="font-slab animate-glitter-bg-slow w-full appearance-none rounded-2xl border-4 p-4 text-2xl uppercase tracking-widest focus:outline-none"
            onInput={e => setMatches(findMatches(e.currentTarget.value))}
            onKeyUp={e => e.key === "Enter" && e.currentTarget.blur()}
          />
        </label>
        <div class="mb-8 mt-9 px-5">
          {matches.map((match, i) => (
            <Match match={match} key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
