#!/usr/bin/env node
import { readEpubMetadata } from "./index.js"

const epubPath = process.argv[2]
if (!epubPath) {
  console.error("Usage: epub-metadata <path-to-epub>")
  process.exit(1)
}

try {
  const metadata = await readEpubMetadata(epubPath)
  console.log(metadata)
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}
