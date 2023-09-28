import Fuse from "fuse.js"
import { useMemo, useState } from "preact/hooks"
import _TRACKS from "./tracks.json"
import TRACK_INDEX from "./tracks_index.json"
import { parseTracks } from "./tracksearch"

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

type FuseResult = Fuse.FuseResult<(typeof TRACKS)[0]>

function GlitterColor({
  children,
  slow,
  randomStart,
}: {
  children
  slow?: boolean
  randomStart?: boolean
}) {
  const delay = useMemo(
    () => (randomStart != false ? `-${Math.random() * 10}s` : null),
    [children, randomStart],
  )
  return (
    <span
      class={
        slow
          ? "motion-safe:animate-glitter-slow"
          : "motion-safe:animate-glitter"
      }
      style={{
        animationDelay: delay,
      }}
    >
      {children}
    </span>
  )
}

function GlitterLetters({ text }: { text: string }) {
  return (
    <span>
      {text.split("").map((letter, i) => (
        <GlitterColor key={i}>{letter}</GlitterColor>
      ))}
    </span>
  )
}

const MATCH_DEBUG = false

function Match({ match, query }: { match: FuseResult; query: string }) {
  const titleMatches = match.matches.filter(m => m.key === "title")
  const titleLetterMatches = match.matches.filter(m => m.key === "titleLetters")
  const lyricsMatches = match.matches.filter(m => m.key === "lyricsLetters")

  // ============= =============
  // TITLE
  const titleMatchLetterCount =
    titleMatches.length > 0
      ? titleMatches[0].indices.reduce((p, [s, e]) => p + (e - s + 1), 0)
      : 0
  const titleLetterMatchLetterCount =
    titleLetterMatches.length > 0
      ? titleLetterMatches[0].indices.reduce((p, [s, e]) => p + (e - s + 1), 0)
      : 0
  const largeTitle = []
  const smallTitle = []
  let isSmallTitle = false
  const addTitle = (text: string, highlight: boolean, checkSmall = true) => {
    if (checkSmall && (text.includes(" -") || text.includes("("))) {
      const [title, ...suffixes] = text.split(/( -|\()/)
      const suffix = suffixes.join("")
      addTitle(title, highlight, false)
      isSmallTitle = true
      addTitle(suffix, highlight, false)
      return
    }
    if (text.length === 0) return
    let title = isSmallTitle ? smallTitle : largeTitle
    title.push(
      <span
        class={highlight ? "font-bold" : "text-neutral-400"}
        key={title.length}
      >
        {text}
      </span>,
    )
  }
  const highlightLetterMatches = (
    add: (text: string, highlight: boolean) => void,
    indices: readonly Fuse.RangeTuple[],
    words: string[],
  ) => {
    add(words[0], false)
    words.slice(1).forEach((w, i) => {
      if (indices.some(([s, e]) => s <= i && i <= e)) {
        add(w[0], true)
        add(w.slice(1), false)
      } else {
        add(w, false)
      }
    })
  }
  if (
    titleLetterMatches.length > 0 &&
    (titleLetterMatchLetterCount >= titleMatchLetterCount ||
      (titleMatches.length > 0 &&
        titleMatches[0].indices.length > 1 &&
        titleLetterMatches.length > 0 &&
        titleLetterMatches[0].indices.length <= 3))
  ) {
    // use letters match for highlight
    highlightLetterMatches(
      addTitle,
      titleLetterMatches[0].indices,
      match.item.titleWords,
    )
  } else if (titleMatches.length > 0) {
    // use full title match for highlight
    const indices = titleMatches[0].indices
    const title = match.item.title
    let prevEnd = -1
    for (let [start, end] of indices) {
      addTitle(title.slice(prevEnd + 1, start), false)
      addTitle(title.slice(start, end + 1), true)
      prevEnd = end
    }
    addTitle(title.slice(prevEnd + 1), false)
  } else {
    addTitle(match.item.title, false)
  }
  const titleElement = (
    <div class="font-slab">
      {MATCH_DEBUG && match.score}
      <div class="text-2xl">{largeTitle}</div>
      {smallTitle.length > 0 && <div class="text-sm">{smallTitle}</div>}
    </div>
  )

  // ============= =============
  // LYRICS MATCHES
  let lyricsElem = null
  let fullLyricsElem = null
  let lyricsIsExact = false
  if (lyricsMatches.length > 0) {
    const queryStart = match.item.lyricsLetters.indexOf(query)
    lyricsIsExact = queryStart >= 0

    lyricsElem = []
    fullLyricsElem = []
    const addLyrics = (elem, text: string, highlight: boolean) => {
      if (text.length === 0) return
      elem.push(
        <span
          class={highlight ? "font-bold" : "text-neutral-400"}
          key={elem.length}
        >
          {text}
        </span>,
      )
    }

    let indices
    if (lyricsIsExact) {
      indices = [[queryStart, queryStart + query.length - 1]]
    } else {
      // group indices into groups with at most 1 non-matching letter in between
      const groups = []
      let group = []
      let prevEnd = -1
      for (let [start, end] of lyricsMatches[0].indices) {
        if (start > prevEnd + 2) {
          groups.push(group)
          group = []
        }
        group.push([start, end])
        prevEnd = end
      }
      groups.push(group)
      // select first largest (by indices) group
      indices = groups.reduce(
        (p, c) => {
          const size = c.reduce((p, [s, e]) => p + (e - s + 1), 0)
          if (size > p.size) return { size, group: c }
          return p
        },
        { size: 0, group: [] },
      )
      indices = indices.group
    }

    const firstIndex = Math.max(indices[0][0] - 1, 0)
    const lastIndex = Math.min(
      indices[indices.length - 1][1] + 3,
      match.item.lyricsWords.length - 1,
    )
    highlightLetterMatches(
      addLyrics.bind(null, lyricsElem),
      indices.map(
        ([s, e]) => [s - firstIndex, e - firstIndex] as Fuse.RangeTuple,
      ),
      match.item.lyricsWords.slice(firstIndex, lastIndex + 1),
    )

    highlightLetterMatches(
      addLyrics.bind(null, fullLyricsElem),
      lyricsMatches[0].indices,
      match.item.lyricsWords,
    )
  }

  return (
    <div class="mx-auto mt-6 max-w-xl text-left">
      <div class="grid grid-cols-[4rem_1fr] gap-4">
        <div>
          <img
            src={
              new URL(
                `./img/albumart/${match.item.albumId}.jpg`,
                import.meta.url,
              ).href
            }
            alt=""
            class="h-16 w-16"
          />
        </div>
        <div class="font-slab text-xl">
          <div>{titleElement}</div>
          {lyricsElem && (
            <div class="mt-2 grid grid-cols-[1rem_1fr] gap-2">
              <div class="h-4 w-4 text-neutral-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M17.721 1.599a.75.75 0 01.279.584v11.29a2.25 2.25 0 01-1.774 2.198l-2.041.442a2.216 2.216 0 01-.938-4.333l2.662-.576a.75.75 0 00.591-.734V6.112l-8 1.73v7.684a2.25 2.25 0 01-1.774 2.2l-2.042.44a2.216 2.216 0 11-.935-4.33l2.659-.574A.75.75 0 007 12.53V4.237a.75.75 0 01.591-.733l9.5-2.054a.75.75 0 01.63.149z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div class="text-xs">
                <MatchLyrics
                  lyrics={lyricsElem}
                  fullLyrics={fullLyricsElem}
                  key={match.item.title}
                />
              </div>
            </div>
          )}
        </div>
      </div>

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

function MatchLyrics({ lyrics, fullLyrics }: { lyrics; fullLyrics }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <>
      <span class="mr-1">{expanded ? fullLyrics : lyrics} </span>
      <button
        class="text-neutral-300 hover:text-neutral-500"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? "LESS" : "MORE"}
      </button>
    </>
  )
}

export function App() {
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
