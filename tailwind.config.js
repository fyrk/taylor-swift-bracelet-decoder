/** @type {import('tailwindcss').Config} */
const defaultTheme = require("tailwindcss/defaultTheme")

const ALBUM_COLORS = {
  DEBUT: "#bad3b6",
  FEARLESS: "#f3c88a",
  SPEAK_NOW: "#c8aaca",
  RED: "#c6586e",
  _1989: "#b9e7f9",
  REPUTATION: "#7f787b",
  LOVER: "#f7b2cf",
  FOLKLORE: "#d0cbc5",
  EVERMORE: "#c7ad92",
  MIDNIGHTS: "#6976b7",
}

const ALBUM_COUNT = Object.keys(ALBUM_COLORS).length

export default {
  content: ["./index.html", "./src/**/*.tsx"],
  theme: {
    fontFamily: {
      sans: ["Roboto", ...defaultTheme.fontFamily.sans],
      slab: ["Roboto Slab", ...defaultTheme.fontFamily.sans],
    },
    extend: {
      color: {
        debut: ALBUM_COLORS.DEBUT,
        fearless: ALBUM_COLORS.FEARLESS,
        speaknow: ALBUM_COLORS.SPEAK_NOW,
        red: ALBUM_COLORS.RED,
        1989: ALBUM_COLORS._1989,
        reputation: ALBUM_COLORS.REPUTATION,
        lover: ALBUM_COLORS.LOVER,
        folklore: ALBUM_COLORS.FOLKLORE,
        evermore: ALBUM_COLORS.EVERMORE,
        midnights: ALBUM_COLORS.MIDNIGHTS,
      },
      animation: {
        glitter: "glitter 10s infinite",
        "glitter-bg-slow": "glitter-bg 30s infinite",
      },
      keyframes: {
        glitter: {
          ...Object.fromEntries(
            [...Array(ALBUM_COUNT)].map((_, i) => {
              return [
                `${(i / ALBUM_COUNT) * 100}%`,
                {
                  color: ALBUM_COLORS[Object.keys(ALBUM_COLORS)[i]],
                },
              ]
            }),
          ),
          "100%": {
            color: ALBUM_COLORS.DEBUT,
          },
        },
        "glitter-bg": {
          ...Object.fromEntries(
            [...Array(ALBUM_COUNT)].map((_, i) => {
              return [
                `${(i / ALBUM_COUNT) * 100}%`,
                {
                  borderColor: ALBUM_COLORS[Object.keys(ALBUM_COLORS)[i]],
                  backgroundColor:
                    ALBUM_COLORS[Object.keys(ALBUM_COLORS)[i]] + "4d",
                },
              ]
            }),
          ),
          "100%": {
            borderColor: ALBUM_COLORS.DEBUT,
            backgroundColor: ALBUM_COLORS.DEBUT + "4d",
          },
        },
      },
    },
  },
  plugins: [],
}
