var fsp = require('fs-promise'),
	JsZip = require('jszip'),
	xmlMapping = require('xml-mapping')

module.exports = function (epubPath) {

	return fsp
		.readFile(epubPath)
		.then(function (fileContent) {

			var epub = new JsZip(fileContent),
				metadata = {},
				contentPaths = [
					'content.opf',
					'OEBPS/content.opf'
				],
				json,
				key,
				xml

			contentPaths.some(function (contentPath) {
				xml = epub.file(contentPath)
				return Boolean(xml)
			})

			if (!xml)
				throw new Error(
					'The software was not able to locate ' +
					'a content.opf file in ' + epubPath
				)

			json = xmlMapping.load(xml.asText(), {longTag: true})

			for (key in json.package.metadata) {
				if (key.search('dc') === 0)
					metadata[key.replace(/^dc\$/, '')] = json
						.package.metadata[key]
			}

			function cleanUpMetadata (key, value) {
				// Remove namespace part from keys
				if (typeof key === 'string' && /\$/.test(key)) {
					var newKey = key.split('$')[1]
					this[newKey] = value
					delete this[key]
					key = newKey
				}

				// Make text property the actual value
				if (value.hasOwnProperty('$text') &&
					Object.keys(value).length === 1) {
					this[key] = value.$text
				}

				return value
			}

			// This is a little hack to iterate recursively over an object
			JSON.stringify(metadata, cleanUpMetadata)

			// Use keys for identifiers
			if (!Array.isArray(metadata.identifier))
				metadata.identifier = [metadata.identifier]

			metadata.identifier.forEach(function (identifier) {
				metadata[identifier.scheme.toLowerCase()] = identifier.text
			})

			delete metadata.identifier

			return metadata
		})
		.catch(function (error) {
			console.error(error.stack)
		})
}
