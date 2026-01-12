import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const projectRoot = path.resolve(__dirname, "..")
const assetsDir = path.join(projectRoot, "assets")
const iconPath = path.join(assetsDir, "icon.png")

async function fileExists(p) {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

async function ensureIconPng() {
  if (await fileExists(iconPath)) {
    return
  }

  await fs.mkdir(assetsDir, { recursive: true })

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#111827"/>
      <stop offset="1" stop-color="#0ea5e9"/>
    </linearGradient>
  </defs>
  <rect x="64" y="64" width="896" height="896" rx="192" fill="url(#g)"/>
  <path d="M308 332h104l92 140 92-140h104l-144 216 152 232H700l-104-156-104 156H388l152-232-144-216z"
        fill="#ffffff"/>
</svg>`

  try {
    const sharpModule = await import("sharp")
    const sharp = sharpModule.default ?? sharpModule
    await sharp(Buffer.from(svg)).png().toFile(iconPath)
  } catch (e) {
    // Fallback: 1x1 PNG (valid). This should be rare (e.g. sharp not available).
    const base64 =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMBAAZgmXcAAAAASUVORK5CYII="
    await fs.writeFile(iconPath, Buffer.from(base64, "base64"))
  }
}

await ensureIconPng()
