# Epub Metadata

Reads metadata from an epub file


## Installation

`npm install --save epub-metadata`


## Usage

```js
var epubMetadata = require('epub-metadata')

epubMetadata('path/to/a/book.epub')
	.then(function (metadata) {
		console.log(metadata)
	})
```

Example output:

```json
{ title: 'Der Hundertjährige, der aus dem Fenster stieg und verschwand',
  creator:
   { 'file-as': 'Jonas Jonasson',
     role: 'aut',
     text: 'Jonas Jonasson' },
  language: 'de',
  publisher: 'E-Books der Verlagsgruppe Random House GmbH',
  contributor:
   { role: 'bkp',
     text: 'calibre (0.9.13) [http://calibre-ebook.com]' },
  date: { event: 'modification', text: '2015-10-13' },
  uuid: 'urn:uuid:3839f3f2-c31f-430e-a78f-b69b03cd5188',
  'mobi-asin': 'B005IVZVT6',
  isbn: '9783641056681' }
```
