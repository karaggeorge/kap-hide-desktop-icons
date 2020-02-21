'use strict';
const fs = require('fs');
const path = require('path');
const stream = require('stream');
const {promisify} = require('util');
const desktopIcons = require('hide-desktop-icons');
const urlRegex = require('url-regex');
const got = require('got');
const tempfile = require('tempfile');

const pipeline = promisify(stream.pipeline);

const regex = urlRegex({exact: true});

const wallpapers = {
	Cheetah: 'http://512pixels.net/downloads/macos-wallpapers/10-0_10.1.png',
	Puma: 'http://512pixels.net/downloads/macos-wallpapers/10-0_10.1.png',
	Jaguar: 'http://512pixels.net/downloads/macos-wallpapers/10-2.png',
	Panther: 'http://512pixels.net/downloads/macos-wallpapers/10-3.png',
	Tiger: 'http://512pixels.net/downloads/macos-wallpapers/10-4.png',
	Leopard: 'http://512pixels.net/downloads/macos-wallpapers/10-5.png',
	'Snow Leopard': 'http://512pixels.net/downloads/macos-wallpapers/10-6.png',
	Lion: 'http://512pixels.net/downloads/macos-wallpapers/10-7.png',
	'Mountain Lion': 'http://512pixels.net/downloads/macos-wallpapers/10-8.jpg',
	Mavericks: 'http://512pixels.net/downloads/macos-wallpapers/10-9.jpg',
	Yosemite: 'http://512pixels.net/downloads/macos-wallpapers/10-10.jpg',
	'El-Capitan': 'http://512pixels.net/downloads/macos-wallpapers/10-11.jpg',
	Sierra: 'http://512pixels.net/downloads/macos-wallpapers/10-12.jpg',
	'High Sierra': 'https://512pixels.net/downloads/macos-wallpapers/10-13.jpg'
};

const config = {
	wallpaper: {
		title: 'Wallpaper',
		description: 'You can use your current wallpaper, one of the past macOS default wallpapers, or your own.',
		enum: [
			'Current wallpaper',
			...Object.keys(wallpapers),
			'Custom file or URL'
		],
		required: true,
		default: 'Current wallpaper'
	},
	url: {
		title: 'File or URL',
		description: 'Will only be used if the option above is set to custom file or URL.\nIf you use a remote url, the image will need to be fetched before starting to record, which might slow down the process.',
		type: 'string',
		default: '',
		// eslint-disable-next-line no-useless-escape
		pattern: new RegExp(`(^$)|(${regex.source})|(^\/([A-z0-9-_+]+\/)*([A-z0-9]+\.([A-z0-9-_+]+))$)`, 'i').source
	}
};

const fetchImage = async url => {
	try {
		const file = tempfile(path.extname(url));

		await pipeline(
			got.stream(url),
			fs.createWriteStream(file)
		);

		return file;
	} catch {}
};

const willStartRecording = async ({config}) => {
	const wallpaper = config.get('wallpaper');

	let filePath;
	if (wallpaper !== 'Current wallpaper') {
		if (wallpaper === 'Custom file or URL') {
			const url = config.get('url');

			if (regex.test(url)) {
				filePath = await fetchImage(url);
			} else if (fs.existsSync(url)) {
				filePath = url;
			}
		}
	}

	return desktopIcons.hide(filePath);
};

const didStopRecording = async () => {
	return desktopIcons.show();
};

const hideDesktopIcons = {
	title: 'Hide Desktop Icons',
	config,
	willStartRecording,
	didStopRecording
};

exports.recordServices = [hideDesktopIcons];
