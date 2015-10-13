var fsp = require('fs-promise'),
	JsZip = require('jszip'),
	xmlMapping = require('xml-mapping')

module.exports = function (epubPath) {

	return fsp
		.readFile(epubPath)
		.then(function (fileContent) {
			var epub = new JsZip(fileContent),
				xml = epub
					.folder('OEBPS')
					.file('content.opf')
					.asText(),
				json = xmlMapping.load(xml, {longTag: true}),
				metadata = {},
				key

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
					this[key] = value['$text']
				}

				return value
			}

			// This is a little hack to iterate recursively over an object
			JSON.stringify(metadata, cleanUpMetadata)

			// Use keys for identifiers
			metadata.identifier.forEach(function (identifier) {
				metadata[identifier.scheme.toLowerCase()] = identifier.text
			})

			delete metadata.identifier

			console.log(metadata);

			return metadata
		})
		.catch(function (error) {
			console.error(error.stack)
		})
}
