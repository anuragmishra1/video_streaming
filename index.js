'use strict';

const express = require('express');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types')

const app = express();
const PORT = process.env.PORT || 3003;

app.get('/', (req, res) => {
	res.json('Video Streaming App');
});

app.get('/stream/:file', async (req, res) => {
	const filePath = `./assets/${req.params.file}`;
	let stat;

	try {
		stat = fs.lstatSync(filePath); // throws if path doesn't exist
	} catch (e) {
		return res.status(404).send({
			message: '404 Not Found'
		});
	}

	const mimeType = mime.contentType(path.extname(filePath));

	const fileSize = stat.size;
	const range = req.headers.range;

	if (range) {
		const parts = range.replace(/bytes=/, '').split('-');
		const start = parseInt(parts[0], 10);
		const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
		const chunkSize = (end - start) + 1;

		const file = fs.createReadStream(filePath, { start, end, highWaterMark: 256 * 1024 });
		const head = {
			'Content-Range': `bytes ${start}-${end}/${fileSize}`,
			'Accept-Ranges': 'bytes',
			'Content-Length': chunkSize,
			'Content-Type': mimeType
		};
		res.writeHead(206, head);
		file.pipe(res);
	} else {
		const head = {
			'Content-Length': fileSize,
			'Content-Type': mimeType
		};
		res.writeHead(200, head);
		fs.createReadStream(filePath).pipe(res);
	}
});

app.listen(PORT, () => {
	console.log(`Listening of port ${PORT}`);
});
