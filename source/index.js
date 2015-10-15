var path = require('path'),

	fsp = require('fs-promise'),
	JsZip = require('jszip'),
	xmlMapping = require('xml-mapping')


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

function loadDcMetadata (json, metadata) {
	for (var key in json.package.metadata) {
		if (key.search('dc') === 0) {
			!function () {
				var newKey = key.replace(/^dc\$/, '')
				metadata[newKey] = json.package.metadata[key]
			}()
		}
	}
}

function rewriteMetaElements (json) {
	json.package.metadata.meta.forEach(function (meta) {
		json.package.metadata['dc$' + meta.name] = meta.content
	})
	delete json.package.metadata.meta
}

function getCoverImagePath (contentPath, coverId, json) {
	var href = ''
	json.package.manifest.item.some(function (item) {
		if (item.id === coverId) {
			href = path.join(contentPath, '..', item.href)
			return true
		}
	})
	return href
}

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
				contentPath,
				json,
				xml

			contentPaths.some(function (contentFilePath) {
				xml = epub.file(contentFilePath)
				contentPath = contentFilePath
				return Boolean(xml)
			})

			if (!xml)
				throw new Error(
					'The software was not able to locate ' +
					'a content.opf file in ' + epubPath
				)

			json = xmlMapping.load(xml.asText(), {longTag: true})

			rewriteMetaElements(json)

			loadDcMetadata(json, metadata)

			// This is a little hack to iterate recursively over an object
			JSON.stringify(metadata, cleanUpMetadata)

			// Use keys for identifiers
			if (!Array.isArray(metadata.identifier))
				metadata.identifier = [metadata.identifier]

			metadata.identifier.forEach(function (identifier) {
				metadata[identifier.scheme.toLowerCase()] = identifier.text
			})

			delete metadata.identifier

			metadata.coverPath = getCoverImagePath(
				contentPath,
				metadata.cover,
				json
			)

			return metadata
		})
		.catch(function (error) {
			console.error(error.stack)
		})
}
