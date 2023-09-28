import { useMemo } from "preact/hooks"

export function GlitterColor({
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
export function GlitterLetters({ text }: { text: string }) {
  return (
    <span>
      {text.split("").map((letter, i) => (
        <GlitterColor key={i}>{letter}</GlitterColor>
      ))}
    </span>
  )
}
