function isWebKit() {
	// return false;
	return !!window.webkitRequestFileSystem;
}

function b64toBlob(b64Data) {
	return fetch(b64Data)
		.then(res => res.blob());
}

function changeExtension(path, ext) {
	const pos = path.lastIndexOf('.');
	return (pos > -1 ? path.substring(0, pos + 1) : path) + ext;
}

function biggestAxis(image) {
	return Math.max(image.bitmap.height, image.bitmap.width)
}

window.addEventListener('DOMContentLoaded', () => {
	const fileForm = document.getElementById('fileForm');
	const fileInput = document.getElementById('fileInput');
	const fileQualityToggle = document.getElementById('fileQualityToggle');
	const fileQuality = document.getElementById('fileQuality');
	const fileSize = document.getElementById('fileSize');

	let files = [];

	function updateQualityRange() {
		return fileQuality.disabled = !fileQualityToggle.checked;
	}

	fileQualityToggle.addEventListener('change', updateQualityRange);

	fileInput.addEventListener('change', async () => {
		files = Promise.all([...fileInput.files].map(file => {
					const reader = new FileReader();
		
					const loaded = new Promise((res, rej) => {
						reader.addEventListener('load', res);
						reader.addEventListener('error', rej);
					});
		
					reader.readAsDataURL(file);
		
					return loaded
						.then(() => jimp.read(reader.result))
						.then(image => {
							return {
								file,
								image
							};
						});
				}));

		files
			.then(content => {
				const images = content.map(c => c.image);
				const size = images.map(image => biggestAxis(image)).reduce((a, b) => a + b) / images.length;

				fileSize.value = size.toFixed(1);
			});
	});

	fileForm.addEventListener('submit', async (e) => {
		e.preventDefault();

		const content = await files;

		for (var i = 0; i < content.length; i++) {
			const fileQualityEnabled = fileQualityToggle.checked;

			const { file, image } = content[i];

			const size = parseInt(fileSize.value);

			image
				.scaleToFit(size, size);

			if (fileQualityEnabled) image.quality(Math.max(parseInt(fileQuality.value), 1));
				
			const mime = fileQualityEnabled ? jimp.MIME_JPEG : image.getMIME();

			const base64Image = await image.getBase64Async(mime);

			const filename = changeExtension(file.name, fileQualityEnabled ? 'jpeg' : image.getExtension());

			download(base64Image, filename, mime);

			// saveAs(base64Image, filename, { type: jimp.MIME_JPEG });


			// window.open(base64Image);

			// window.location.href = base64Image;

			// const downloadElement = document.createElement('a');
			// downloadElement.href = await image.getBase64Async(jimp.MIME_JPEG);
			// downloadElement.download = file.name;

			// downloadElement.click();
		}
	});
});