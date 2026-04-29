import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, writeFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import JSZip from "jszip"
import { readEpubMetadata } from "../dist/index.js"

const containerXml = `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`

const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="2.0" unique-identifier="bookid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:title>Test Book</dc:title>
    <dc:creator opf:file-as="Doe, Jane" opf:role="aut">Jane Doe</dc:creator>
    <dc:language>en</dc:language>
    <dc:publisher>Test Press</dc:publisher>
    <dc:identifier id="bookid" opf:scheme="ISBN">9781234567890</dc:identifier>
    <dc:identifier opf:scheme="UUID">urn:uuid:12345</dc:identifier>
    <meta name="cover" content="cover-image"/>
  </metadata>
  <manifest>
    <item id="cover-image" href="images/cover.jpg" media-type="image/jpeg"/>
  </manifest>
</package>`

async function withEpub(buildZip, fn) {
  const zip = new JSZip()
  zip.file("mimetype", "application/epub+zip")
  buildZip(zip)
  const buffer = await zip.generateAsync({ type: "nodebuffer" })

  const dir = await mkdtemp(path.join(tmpdir(), "epub-test-"))
  const file = path.join(dir, "test.epub")
  await writeFile(file, buffer)
  try {
    return await fn(file)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

test("reads core metadata via container.xml lookup", async () => {
  await withEpub(
    (zip) => {
      zip.file("META-INF/container.xml", containerXml)
      zip.file("OEBPS/content.opf", contentOpf)
    },
    async (file) => {
      const metadata = await readEpubMetadata(file)
      assert.equal(metadata.title, "Test Book")
      assert.equal(metadata.language, "en")
      assert.equal(metadata.publisher, "Test Press")
      assert.deepEqual(metadata.creator, {
        "file-as": "Doe, Jane",
        role: "aut",
        text: "Jane Doe",
      })
      assert.equal(metadata.isbn, "9781234567890")
      assert.equal(metadata.uuid, "urn:uuid:12345")
      assert.equal(metadata.cover, "cover-image")
      assert.equal(metadata.coverPath, "OEBPS/images/cover.jpg")
      assert.equal(metadata.identifier, undefined)
    },
  )
})

test("falls back to common opf paths when container.xml is absent", async () => {
  await withEpub(
    (zip) => {
      zip.file("OEBPS/content.opf", contentOpf)
    },
    async (file) => {
      const metadata = await readEpubMetadata(file)
      assert.equal(metadata.title, "Test Book")
      assert.equal(metadata.coverPath, "OEBPS/images/cover.jpg")
    },
  )
})

test("throws when no content.opf can be located", async () => {
  await withEpub(
    () => {
      // empty zip apart from mimetype
    },
    async (file) => {
      await assert.rejects(readEpubMetadata(file), /content\.opf/)
    },
  )
})
