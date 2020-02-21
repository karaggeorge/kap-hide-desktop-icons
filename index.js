'use strict';
const fs = require('fs');
const path = require('path');
const stream = require('stream');
const {promisify} = require('util');
const desktopIcons = require('hide-desktop-icons');
const urlRegex = require('url-regex');
const got = require('got');

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
	'High Sierra': 'https://512pixels.net/downloads/macos-wallpapers/10-13.jpg',
	'Mojave - Light': 'https://2ig18m1zutag3bjpoclbo8am-wpengine.netdna-ssl.com/wp-content/uploads/2019/10/10-14-Mojave-1.jpg',
	'Mojave - Dark': 'https://2ig18m1zutag3bjpoclbo8am-wpengine.netdna-ssl.com/wp-content/uploads/2019/10/10-14-Mojave-2.jpg',
	'Catalina - Light': 'https://2ig18m1zutag3bjpoclbo8am-wpengine.netdna-ssl.com/wp-content/uploads/2019/10/10-15-1-Dawn.jpg',
	'Catalina - Dark': 'https://2ig18m1zutag3bjpoclbo8am-wpengine.netdna-ssl.com/wp-content/uploads/2019/10/10-15-8-Night.jpg'
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
	},
	cacheUrl: {
		title: 'Cache URL',
		description: 'Only applicable if you are using the URL field above. Caching the image and re-using it will speed up time-to-record.',
		type: 'boolean',
		default: true
	}
};

const fetchImage = async (url, filePath) => {
	try {
		await pipeline(
			got.stream(url),
			fs.createWriteStream(filePath)
		);

		return filePath;
	} catch {}
};

const downloadWallpaper = async config => {
	const {wallpaper, url} = config.store;

	if (wallpaper === 'Current wallpaper') {
		return;
	}

	if (wallpaper === 'Custom file or URL' && !regex.test(url)) {
		if (fs.existsSync(url)) {
			return url;
		}
	}

	const remoteUrl = wallpaper === 'Custom file or URL' ? url : wallpapers[wallpaper];
	const filePath = path.resolve(path.dirname(config.path), `hdi-wallpaper${path.extname(remoteUrl)}`);

	const result = await fetchImage(remoteUrl, filePath);
	config.set('cachedFilePath', result);
	return result;
};

const willStartRecording = async ({config}) => {
	const {wallpaper, url, cacheUrl, cachedFilePath} = config.store;

	if (wallpaper === 'Current Wallpaper') {
		return desktopIcons.hide();
	}

	if (wallpaper === 'Custom file or URL') {
		if (!regex.test(url)) {
			return desktopIcons.hide(url);
		}

		if (!cacheUrl) {
			return desktopIcons.hide(await downloadWallpaper(config));
		}
	}

	if (cachedFilePath && fs.existsSync(cachedFilePath)) {
		return desktopIcons.hide(cachedFilePath);
	}

	return desktopIcons.hide(await downloadWallpaper(config));
};

const didStopRecording = async () => {
	return desktopIcons.show();
};

const didConfigChange = async (newValues, oldValues, config) => {
	return downloadWallpaper(config);
}

const hideDesktopIcons = {
	title: 'Hide Desktop Icons',
	config,
	willStartRecording,
	didStopRecording
};

exports.recordServices = [hideDesktopIcons];
exports.didConfigChange = didConfigChange;
