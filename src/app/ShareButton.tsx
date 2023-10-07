import { CheckIcon, ShareIcon } from "@heroicons/react/20/solid"
import { ClipboardIcon } from "@heroicons/react/24/outline"
import { useMemo, useState } from "preact/hooks"
import { PlausibleEvent, trackPlausibleEvent } from "../helpers/plausible"

export default function ShareButton() {
  const [isCopied, setIsCopied] = useState(false)

  const [url, canShare] = useMemo(() => {
    const search = new URLSearchParams(window.location.search)
    search.set("source", "share")
    const url = new URL(window.location.href)
    url.search = search.toString()
    return [
      url.href,
      navigator.canShare &&
        navigator.share &&
        navigator.canShare({ url: url.href }),
    ]
  }, [
    window.location.search,
    window.location.href,
    navigator.canShare,
    navigator.share,
  ])

  return (
    <button
      class="animate-glitter-bg-slow rounded-xl border-2 p-2 text-sm tracking-wider"
      onClick={() => {
        if (canShare) {
          navigator.share({ url })
        } else {
          navigator.clipboard.writeText(url).then(() => {
            setIsCopied(true)
            setTimeout(() => setIsCopied(false), 750)
          })
        }
        trackPlausibleEvent(PlausibleEvent.Share, {
          props: { type: canShare ? "share" : "copy" },
        })
      }}
    >
      <div class="flex items-center gap-1 lg:flex-col lg:gap-0">
        {canShare ? (
          <>
            <ShareIcon class="inline h-[1.2em] w-[1.2em]" />
            <div>Share results</div>
          </>
        ) : (
          <>
            <div class="flex items-center gap-2">
              <div class="relative inline h-7 w-7">
                <ClipboardIcon class="inline h-7 w-7" />
                {isCopied && (
                  <CheckIcon class="absolute left-[25%] top-[30%] inline h-[50%] w-[50%]" />
                )}
              </div>
              <div>
                Copy link
                <br />
                to results
              </div>
            </div>
          </>
        )}
      </div>
    </button>
  )
}
