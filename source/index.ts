import { readFile } from "node:fs/promises"
import path from "node:path"
import JSZip from "jszip"
import { XMLParser } from "fast-xml-parser"

export interface ManifestItem {
  id: string
  href: string
  "media-type"?: string
}

export interface EpubMetadata {
  title?: string
  creator?: unknown
  language?: string
  publisher?: string
  contributor?: unknown
  date?: unknown
  description?: string
  rights?: string
  subject?: unknown
  cover?: string
  coverPath?: string
  [key: string]: unknown
}

const FALLBACK_OPF_PATHS = [
  "content.opf",
  "OEBPS/content.opf",
  "OPS/content.opf",
]

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  textNodeName: "text",
  removeNSPrefix: true,
  parseAttributeValue: false,
  parseTagValue: false,
  trimValues: true,
})

function toArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined || value === null) return []
  return Array.isArray(value) ? value : [value]
}

async function findContentOpf(
  zip: JSZip,
): Promise<{ xml: string; contentPath: string }> {
  // The container.xml points to the OPF file — most reliable lookup.
  const containerEntry = zip.file("META-INF/container.xml")
  if (containerEntry) {
    const containerXml = await containerEntry.async("string")
    const container = xmlParser.parse(containerXml) as {
      container?: {
        rootfiles?: {
          rootfile?:
            | { "full-path"?: string }
            | Array<{ "full-path"?: string }>
        }
      }
    }
    const rootfiles = toArray(container.container?.rootfiles?.rootfile)
    const fullPath = rootfiles[0]?.["full-path"]
    if (fullPath) {
      const entry = zip.file(fullPath)
      if (entry) {
        return { xml: await entry.async("string"), contentPath: fullPath }
      }
    }
  }

  for (const candidate of FALLBACK_OPF_PATHS) {
    const entry = zip.file(candidate)
    if (entry) {
      return { xml: await entry.async("string"), contentPath: candidate }
    }
  }

  throw new Error("Unable to locate content.opf in epub")
}

function resolveCoverPath(
  contentPath: string,
  coverId: string | undefined,
  manifestItems: ManifestItem[],
): string | undefined {
  if (!coverId) return undefined
  const item = manifestItems.find((entry) => entry.id === coverId)
  if (!item) return undefined
  return path.posix.join(path.posix.dirname(contentPath), item.href)
}

export async function readEpubMetadata(
  epubPath: string,
): Promise<EpubMetadata> {
  const buffer = await readFile(epubPath)
  const zip = await JSZip.loadAsync(buffer)
  const { xml, contentPath } = await findContentOpf(zip)

  const parsed = xmlParser.parse(xml) as {
    package?: {
      metadata?: Record<string, unknown>
      manifest?: { item?: ManifestItem | ManifestItem[] }
    }
  }

  const pkg = parsed.package
  if (!pkg) {
    throw new Error("Invalid epub: missing <package> element in content.opf")
  }

  const rawMetadata = pkg.metadata ?? {}
  const metadata: EpubMetadata = {}

  // Copy Dublin Core fields straight through (title, creator, language, ...).
  for (const [key, value] of Object.entries(rawMetadata)) {
    if (key === "meta") continue
    metadata[key] = value
  }

  // Promote <meta name="X" content="Y"/> entries onto the metadata object.
  for (const meta of toArray(rawMetadata.meta) as Array<{
    name?: string
    content?: string
  }>) {
    if (meta?.name && meta.content !== undefined) {
      metadata[meta.name] = meta.content
    }
  }

  // Lift identifier schemes (ISBN, UUID, ...) to top-level keys.
  const identifiers = toArray(metadata.identifier) as Array<
    string | { scheme?: string; text?: string }
  >
  for (const ident of identifiers) {
    if (ident && typeof ident === "object" && ident.scheme) {
      metadata[ident.scheme.toLowerCase()] = ident.text
    }
  }
  if (identifiers.length > 0) {
    delete metadata.identifier
  }

  const manifestItems = toArray(pkg.manifest?.item)
  metadata.coverPath = resolveCoverPath(
    contentPath,
    typeof metadata.cover === "string" ? metadata.cover : undefined,
    manifestItems,
  )

  return metadata
}

export default readEpubMetadata
