import Fuse from "fuse.js"
import { useMemo, useState } from "preact/hooks"
import TRACKS from "./tracks.json"
import TRACK_INDEX from "./tracks_index.json"

const TRACKS_FUSE = new Fuse(
  TRACKS,
  {
    keys: ["title", "titleLetters"],
    includeMatches: true,
    includeScore: true,
    ignoreFieldNorm: true,
  },
  Fuse.parseIndex(TRACK_INDEX),
)

const findMatches = (letters: string) => {
  return TRACKS_FUSE.search(letters, { limit: 8 })
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

  if (
    titleLettersMatchLetterCount >= titleMatchLetterCount ||
    (titleMatches.length > 0 &&
      titleMatches[0].indices.length > 1 &&
      titleLettersMatches.length > 0 &&
      titleLettersMatches[0].indices.length <= 3)
  ) {
    titleLettersMatches[0].indices.forEach(([start, end]) => {
      for (let i = start; i <= end; i++) {
        let indices = match.item.titleLettersIndices[i]
        if (typeof indices === "number") {
          highlightIndices[indices] = true
        } else {
          indices.forEach((index: number) => {
            highlightIndices[index] = true
          })
        }
      }
    })
  } else {
    titleMatches[0].indices.forEach(([start, end]) => {
      for (let i = start; i <= end; i++) {
        highlightIndices[i] = true
      }
    })
  }

  // build title
  let largeTitleParts = []
  let smallTitleParts = []
  let small = false
  match.item.title.split("").forEach((letter, i) => {
    const elem = (
      <span
        class={highlightIndices[i] ? "font-bold" : "text-neutral-400"}
        key={i}
      >
        {letter}
      </span>
    )
    if ((letter === "-" && match.item.title[i - 1] === " ") || letter === "(")
      small = true
    if (small) {
      smallTitleParts.push(elem)
    } else {
      largeTitleParts.push(elem)
    }
  })

  const titleElement = (
    <div class="font-slab">
      {MATCH_DEBUG && match.score}
      <div class="text-2xl">{largeTitleParts}</div>
      {smallTitleParts.length > 0 && (
        <div class="text-sm">{smallTitleParts}</div>
      )}
    </div>
  )

  const imgUrl = new URL(
    `./img/albumart/${match.item.albumId}.jpg`,
    import.meta.url,
  ).href
  console.log(
    import.meta.url,
    `./img/albumart/${match.item.albumId}.jpg`,
    imgUrl,
  )

  return (
    <div class="mx-auto mt-6 max-w-xl text-left">
      <div class="grid grid-cols-[4rem_1fr] gap-4">
        <div>
          <img src={imgUrl} alt="" class="h-16 w-16" />
        </div>
        <div class="font-slab text-xl">{titleElement}</div>
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

export function App() {
  const [matches, setMatches] = useState<FuseResult[]>([])

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
            Enter letters to find matching songs
          </div>
          <input
            type="text"
            autofocus
            spellcheck={false}
            enterkeyhint="done"
            class="w-full animate-glitter-bg-slow appearance-none rounded-2xl border-4 p-4 font-slab text-2xl uppercase tracking-widest focus:outline-none"
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

      <footer class="mt-16 shrink pb-8 text-center">
        <p class="mb-2">
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
        </p>

        <p class="mx-auto max-w-xs">
          <small class="">
            This is a Swiftie-made project neither affiliated with nor endorsed
            by Taylor Alison Swift.
          </small>
        </p>
      </footer>
    </div>
  )
}
