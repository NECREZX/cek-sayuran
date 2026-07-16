import { logError, validateModelMetadata } from '../core/utils.js';

class DetectionService {
	constructor() {
		this.model = null;
		this.labels = [];
		this.config = null;
	}

	// TODO [Basic] Implementasikan metode untuk memuat model TensorFlow.js
	// TODO [Basic] Gunakan validateModelMetadata() untuk memeriksa metadata model
	// TODO [Advance] Gunakan strategi Backend Adaptive seperti yang telah dipelajari sebelumnya
	async loadModel() {
		try {
			await tf.setBackend('webgpu');
			await tf.ready();
			
			this.model = await tf.loadLayersModel('./model/model.json');
			
			const response = await fetch('./model/metadata.json');
			const metadata = await response.json();
			if (!validateModelMetadata(metadata)) {
				throw new Error('Invalid metadata');
			}
			this.labels = metadata.labels;
			
			const dummyInput = tf.zeros([1, 224, 224, 3]);
			this.model.predict(dummyInput).dispose();
			dummyInput.dispose();
		} catch (error) {
			logError('Failed to load model', error);
			try {
				await tf.setBackend('webgl');
				await tf.ready();
				this.model = await tf.loadLayersModel('./model/model.json');
				
				const response = await fetch('./model/metadata.json');
				const metadata = await response.json();
				if (!validateModelMetadata(metadata)) {
					throw new Error('Invalid metadata');
				}
				this.labels = metadata.labels;
			} catch (fallbackError) {
				throw new Error(`Failed to load model: ${fallbackError.message}`);
			}
		}
	}

	// TODO [Basic] Implementasikan metode untuk melakukan prediksi pada elemen gambar
	async predict(imageElement) {
		let tensor = null;
		let predictions = null;
		try {
			tensor = tf.browser.fromPixels(imageElement)
				.resizeNearestNeighbor([224, 224])
				.toFloat()
				.div(tf.scalar(255.0))
				.expandDims();
			
			predictions = await this.model.predict(tensor);
			const data = await predictions.data();
			
			const maxConfidence = Math.max(...data);
			const maxIndex = data.indexOf(maxConfidence);
			
			return {
				isValid: true,
				label: this.labels[maxIndex] || 'Unknown',
				confidence: maxConfidence
			};
		} catch (error) {
			logError('Prediction error', error);
			throw new Error(`Prediksi gagal: ${error.message}`);
		} finally {
			// TODO [Basic] Dispose tensor dan predictions untuk menghindari memory leak
			if (tensor) tensor.dispose();
			if (predictions) predictions.dispose();
		}
	}

	// TODO [Basic] Periksa apakah model sudah dimuat
	isLoaded() {
		return this.model !== null;
	}
}

export default DetectionService;
