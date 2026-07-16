import { logError } from '../core/utils.js';

class FunFactService {
	constructor() {
		this.generator = null;
		this.isModelLoaded = false;
		this.isGenerating = false;
		this.config = null;
		this.currentBackend = null;
	}

	// TODO [Basic] Implementasikan metode untuk memuat model Transformers.js
	// TODO [Advance] Gunakan strategi Backend Adaptive seperti yang telah dipelajari sebelumnya
	async loadModel() {
		try {
			const { pipeline, env } = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.0/dist/transformers.min.js');
			
			env.allowLocalModels = false;
			env.useBrowserCache = true;
			
			let device = 'webgpu';
			if (!navigator.gpu) {
				device = 'wasm';
			}

			try {
				this.generator = await pipeline('text-generation', 'onnx-community/Qwen2.5-0.5B-Instruct', { device: device, dtype: 'q8' });
				this.currentBackend = device;
			} catch (e) {
				logError('WebGPU fallback to wasm', e);
				this.generator = await pipeline('text-generation', 'onnx-community/Qwen2.5-0.5B-Instruct', { device: 'wasm', dtype: 'q8' });
				this.currentBackend = 'wasm';
			}
			this.isModelLoaded = true;
		} catch (error) {
			logError('Error loading Transformers.js model', error);
			throw new Error(`Failed to load FunFact model: ${error.message}`);
		}
	}

	// TODO [Basic] Implementasikan metode untuk menghasilkan fun fact tentang sayuran
	// TODO [Basic] Tambahkan validasi untuk maksimum panjang input dan pembersihan input terhadap karakter khusus untuk mengatasi prompt injection
	// TODO [Advanced] Gunakan parameter `tone` untuk variasi personalitas
	async generateFunFact(vegetable, tone = 'normal') {
		if (!this.isModelLoaded || this.isGenerating) {
			throw new Error('Model belum siap atau sedang menghasilkan fakta');
		}

		if (!vegetable || typeof vegetable !== 'string') {
			throw new Error('Nama sayuran yang valid diperlukan');
		}

		// Validation and sanitization
		const maxLength = 50;
		let sanitizedVegetable = vegetable.trim().substring(0, maxLength).replace(/[^a-zA-Z0-9 ]/g, '');
		if (!sanitizedVegetable) {
			throw new Error('Nama sayuran tidak valid setelah dibersihkan');
		}

		this.isGenerating = true;

		try {
			let prompt = '';
			switch(tone) {
				case 'funny':
					prompt = `Tuliskan satu fakta lucu dan singkat tentang sayuran ${sanitizedVegetable} dalam bahasa Indonesia. Fakta harus terdiri dari 1 hingga 2 kalimat saja.`;
					break;
				case 'professional':
					prompt = `Berikan satu fakta ilmiah singkat mengenai ${sanitizedVegetable} dalam bahasa Indonesia. Fakta harus terdiri dari 1 hingga 2 kalimat.`;
					break;
				case 'casual':
					prompt = `Beri tahu saya fakta unik tentang ${sanitizedVegetable} secara santai dalam bahasa Indonesia. Maksimal 2 kalimat.`;
					break;
				case 'normal':
				default:
					prompt = `Berikan satu fakta menarik dan unik tentang ${sanitizedVegetable} dalam bahasa Indonesia. Cukup 1 atau 2 kalimat saja.`;
					break;
			}

			const messages = [
				{ role: 'system', content: 'Anda adalah asisten cerdas yang memberikan satu fakta singkat tentang sayuran. Berikan jawaban tanpa basa-basi.' },
				{ role: 'user', content: prompt }
			];

			const response = await this.generator(messages, { max_new_tokens: 64, temperature: 0.7 });
			
			// The response format depends on Transformers.js version and model, usually it returns an array
			const outputText = response[0]?.generated_text?.[2]?.content || response[0]?.generated_text || 'Fakta menarik gagal dihasilkan.';
			
			return typeof outputText === 'string' ? outputText : outputText.content || 'Fakta menarik gagal dihasilkan.';
		} catch (error) {
			logError('Error generating fun fact', error);
			throw new Error(`Failed to generate fun fact: ${error.message}`);
		} finally {
			this.isGenerating = false;
		}
	}

	// TODO [Basic] Periksa apakah model siap dan tidak sedang menghasilkan fakta
	isReady() {
		return this.isModelLoaded && !this.isGenerating;
	}
}

export default FunFactService;
