# Epub Metadata

Reads metadata from an epub file.

Written in modern TypeScript with native ES modules. Requires Node.js 18+.


## Installation

```sh
npm install epub-metadata
```


## Usage

```ts
import { readEpubMetadata } from "epub-metadata"

const metadata = await readEpubMetadata("path/to/a/book.epub")
console.log(metadata)
```

A default export is also available:

```ts
import readEpubMetadata from "epub-metadata"
```

Example output:

```js
{
  title: 'Der Hundertjährige, der aus dem Fenster stieg und verschwand',
  creator: {
    'file-as': 'Jonas Jonasson',
    role: 'aut',
    text: 'Jonas Jonasson',
  },
  language: 'de',
  publisher: 'E-Books der Verlagsgruppe Random House GmbH',
  contributor: {
    role: 'bkp',
    text: 'calibre (0.9.13) [http://calibre-ebook.com]',
  },
  date: '2015-10-13',
  uuid: 'urn:uuid:3839f3f2-c31f-430e-a78f-b69b03cd5188',
  'mobi-asin': 'B005IVZVT6',
  isbn: '9783641056681',
  coverPath: 'images/cover.jpg',
}
```


## CLI

```sh
npx epub-metadata path/to/a/book.epub
```


## Development

```sh
npm install
npm run build       # compile TypeScript to dist/
npm run typecheck   # type-check without emitting
```
