import Fuse from "fuse.js"
import { useState } from "preact/hooks"
import { FuseResult } from "./App"

const MATCH_DEBUG = false

export default function Match({
  match,
  query,
}: {
  match: FuseResult
  query: string
}) {
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
  let lyricsIsFromStart = false
  let lyricsIsToEnd = false
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

      for (let [start, end] of [...lyricsMatches[0].indices].sort(
        (a, b) => a[0] - b[0],
      )) {
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

    lyricsIsFromStart = firstIndex === 0
    lyricsIsToEnd = lastIndex === match.item.lyricsWords.length - 1

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
                `../img/albumart/${match.item.albumId}.jpg`,
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
                  isCollapsedFromStart={lyricsIsFromStart}
                  isCollapsedFromEnd={lyricsIsToEnd}
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

function MatchLyrics({
  lyrics,
  fullLyrics,
  isCollapsedFromStart,
  isCollapsedFromEnd,
}) {
  const [expanded, setExpanded] = useState(false)
  return (
    <span
      class="group"
      onClick={() =>
        document.getSelection().type !== "Range" && setExpanded(!expanded)
      }
    >
      <span class="mr-3">
        {!isCollapsedFromStart && !expanded && "… "}
        {expanded ? fullLyrics : lyrics}
        {!isCollapsedFromEnd && !expanded && " …"}{" "}
      </span>
      <button class="text-neutral-200 group-hover:text-neutral-300 group-hover:underline">
        {expanded ? "View Match" : "View All"}
      </button>
    </span>
  )
}
