import themes from "./themes/index.js"

type TileOrientType =
  | "upright"       // upright tile
  | "sideways"      // sideways tile
  | "sidewaysTop"   // top part of a stacked kan tile

type tileRenderProfile = {
  type: "tile"
  tileKey: string
  tileOrient: TileOrientType
}

type spaceRenderProfile = {
  type: "space"
}

type RenderProfile = tileRenderProfile | spaceRenderProfile

const genRenderProfiles = (mpsz: string): RenderProfile[] => {
  const result: (tileRenderProfile | spaceRenderProfile)[] = []
  const numQtBuffer: string[] = []  // e.g.,　0,1',2",X,Q'
  let qtBuffer: string[] = []  // e.g., `'`, `"`

  for (let i = 0;i < mpsz.length;i++) {
    const char = mpsz[i]

    if (/[0-9XQ]/.test(char)) {
      numQtBuffer.push(char)
    } else if (char === "'" || char === '"') {
      const lastNumQt = numQtBuffer.pop()
      numQtBuffer.push((lastNumQt || "Q") + char)
    } else if (/[mpszqx]/.test(char)) {

      if (numQtBuffer.length === 0) {
        result.push({
          type: "tile",
          tileKey: char === "x" ? "x" : "q",
          tileOrient: "upright"
        })
        continue
      }

      for (let j = 0;j < numQtBuffer.length;j++) {
        const numQt = numQtBuffer[j]
        const num = numQt[0]
        const qt = numQt.slice(1)

        let tileKey = ""
        if (char === "x" || char === "q") {
          tileKey = char
        } else if (num === "X" || num === "Q") {
          tileKey = num.toLowerCase()
        } else {
          tileKey = `${num}${char}`.toLowerCase()
        }

        if (!qt) {
          result.push({ type: "tile", tileKey, tileOrient: "upright" })
        } else if (qt === "'") {
          result.push({ type: "tile", tileKey, tileOrient: "sideways" })
        } else if (qt === "''") {
          result.push({ type: "tile", tileKey, tileOrient: "sidewaysTop" })
        } else if (qt === "\"") {
          result.push({ type: "tile", tileKey, tileOrient: "sideways" })
          result.push({ type: "tile", tileKey, tileOrient: "sidewaysTop" })
        } else { // written mpsz may not be correct.
          result.push({ type: "tile", tileKey, tileOrient: "upright" })
        }
      }
      numQtBuffer.length = 0

    } else if (char === "-") {
      result.push({ type: "space" })
    }
  }
  return result
}

const genSVG = (renderProfiles: RenderProfile[]) => {
  const theme = themes.default.getThemeVariables()
  const tileDesigns = theme.tileDesigns
  const tileWidth = theme.tileWidth
  const tileHeight = theme.tileHeight
  const tileGap = theme.tileGap
  const spaceWidth = theme.spaceWidth
  const svgHeight = Math.max(tileHeight, tileWidth * 2 + tileGap)
  let svgInner = ""

  let xPosition = 0
  for (const entry of renderProfiles) {
    if (entry.type === "tile" && entry.tileOrient === "upright") {
      svgInner += `<image href="${tileDesigns["base"]}" x="${xPosition}" y="${svgHeight - tileHeight}" width="${tileWidth}" height="${tileHeight}" /><image href="${tileDesigns[entry.tileKey]}" x="${xPosition}" y="${svgHeight - tileHeight}" width="${tileWidth}" height="${tileHeight}" />`
      xPosition += tileWidth + tileGap
    } else if (entry.type === "tile" && entry.tileOrient === "sideways") {
      svgInner += `<image href="${tileDesigns["base"]}" x="${-svgHeight}" y="${xPosition}" width="${tileWidth}" height="${tileHeight}" transform="rotate(-90)" /><image href="${tileDesigns[entry.tileKey]}" x="${-svgHeight}" y="${xPosition}" width="${tileWidth}" height="${tileHeight}" transform="rotate(-90)" />`
      xPosition += tileHeight + tileGap
    } else if (entry.type === "tile" && entry.tileOrient === "sidewaysTop") {
      svgInner += `<image href="${tileDesigns["base"]}" x="${tileWidth - svgHeight + tileGap}" y="${xPosition - tileHeight - tileGap}" width="${tileWidth}" height="${tileHeight}" transform="rotate(-90)" /><image href="${tileDesigns[entry.tileKey]}" x="${tileWidth - svgHeight + tileGap}" y="${xPosition - tileHeight - tileGap}" width="${tileWidth}" height="${tileHeight}" transform="rotate(-90)" />`
    } else {
      xPosition += Math.max(spaceWidth)
    }
  }
  return `<div style="background-color: green; padding: 0.375rem; border-radius: 6px;"><svg width="100%" height="${svgHeight}" style="display: block;">${svgInner}</svg></div>`

}

const render = (mpsz: string) => {
  const svgProfiles = genRenderProfiles(mpsz)
  return genSVG(svgProfiles)
}


export const merjongAPI = Object.freeze({
  render
})

export default merjongAPI