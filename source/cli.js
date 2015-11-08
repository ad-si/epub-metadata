#! /usr/bin/env node
'use strict'

const epubMetadata = require('./index.js')

epubMetadata(process.argv[2])
	.then(metadata => {
		console.log(metadata)
	})
