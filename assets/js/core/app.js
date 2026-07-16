import UIHandler from '../ui/ui.handler.js';
import { APP_CONFIG } from './config.js';
import { logError } from './utils.js';
import CameraService from '../services/camera.service.js';
import DetectionService from '../services/detection.service.js';
import FunFactService from '../services/facts.service.js';

class RootFactsApp {
	constructor() {
		this.detector = new DetectionService();
		this.camera = new CameraService();
		this.funFactGenerator = new FunFactService();
		this.ui = new UIHandler();
		this.isRunning = false;
		this.currentLoopId = null;
		this.config = APP_CONFIG;
		this.currentFunFact = '';

		// TODO [Advanced] Tambahkan properti untuk tone yang dipilih
		this.currentTone = 'normal';

		this.ui.disableButton();

		this.bindEvents();
		this.init();
		// TODO [Basic] Panggil registerServiceWorker()
		if ('serviceWorker' in navigator) {
			window.addEventListener('load', () => {
				navigator.serviceWorker.register('/sw.js').catch(err => {
					logError('SW registration failed', err);
				});
			});
		}
	}

	// TODO [Basic] Bind toggle camera event dengan nama onToggleCamera
	// TODO [Basic] Bind camera change event dengan nama onCameraChange
	// TODO [Skilled] Bind FPS change event dengan nama onFPSChange
	// TODO [Skilled] Bind copy fun fact event dengan nama onCopy
	// TODO [Advanced] Bind tone change event dengan nama onToneChange
	bindEvents() {
		this.ui.bindEvents({
			onToggleCamera: () => this.toggleCamera(),
			onCameraChange: () => {
				if (this.camera.isActive()) {
					this.camera.stopCamera();
					this.startCamera();
				}
			},
			onFPSChange: (fps) => this.camera.setFPS(fps),
			onCopy: () => this.copyFunFact(),
			onToneChange: (tone) => { this.currentTone = tone; }
		});
	}
	
	// TODO [Skilled] Perbarui status header UI menjadi 'Memuat model...' saat memulai inisialisasi
	// TODO [Basic] Lengkapi inisialisasi kemampuan aplikasi
	// TODO [Skilled] Perbarui status header UI menjadi 'Siap'
	async init() {
		try {
			this.ui.updateHeaderStatus('Memuat model...', true);
			await Promise.all([
				this.detector.loadModel(),
				this.funFactGenerator.loadModel()
			]);
			this.ui.updateHeaderStatus('Siap', false);
			this.ui.enableButton();
		} catch (error) {
			logError('Gagal menginisialisasi aplikasi', error);
			// TODO [Skilled] Perbarui status header UI menjadi 'Error' jika inisialisasi gagal
			this.ui.updateHeaderStatus('Error', false);
			this.ui.showError(`Gagal menginisialisasi: ${error.message}`);
			this.ui.disableButton();
		}
	}

	// TODO [Basic] Buatlah berkas sw.js di root project dan konfigurasikan precaching di dalamnya menggunakan Workbox
	// TODO [Basic] Registrasikan Service Worker
	// TODO [Skilled] Buatlah metode untuk menyalin fun fact ke clipboard
	copyFunFact() {
		const text = this.ui.getFunFactText();
		if (text) {
			navigator.clipboard.writeText(text).then(() => {
				this.ui.setCopyButtonCopied();
				setTimeout(() => this.ui.resetCopyButton(), 2000);
			}).catch(err => logError('Failed to copy', err));
		}
	}

	// TODO [Basic] Implementasikan metode untuk mengaktifkan atau menonaktifkan kamera
	toggleCamera() {
		if (this.camera.isActive()) {
			this.stopDetection();
			this.stopCamera();
		} else {
			this.startCamera();
		}
	}

	// TODO [Basic] Implementasikan metode untuk memulai kamera
	async startCamera() {
		try {
			this.ui.switchToState('loading');
			await this.camera.startCamera();
			this.ui.updateCameraUI(true);
			this.startDetection();
		} catch (error) {
			this.ui.showError('Gagal memulai kamera');
		}
	}

	// TODO [Basic] Implementasikan metode untuk menghentikan kamera
	stopCamera() {
		this.camera.stopCamera();
		this.ui.updateCameraUI(false);
		this.ui.switchToState('idle');
	}

	// TODO [Basic] Implementasikan metode untuk memulai deteksi
	startDetection() {
		if (!this.isRunning) {
			this.isRunning = true;
			this.currentLoopId = requestAnimationFrame((time) => this.detectLoop(time));
		}
	}

	// TODO [Basic] Implementasikan metode untuk menghentikan deteksi
	stopDetection() {
		this.isRunning = false;
		if (this.currentLoopId) {
			cancelAnimationFrame(this.currentLoopId);
			this.currentLoopId = null;
		}
	}

	// TODO [Basic] Implementasikan metode deteksi utama
	async detectLoop(loopId) {
		if (!this.isRunning || !this.camera.isReady() || !this.detector.isLoaded()) {
			if (this.isRunning) {
				this.currentLoopId = requestAnimationFrame((time) => this.detectLoop(time));
			}
			return;
		}

		try {
			const result = await this.detector.predict(this.camera.video);
			
			if (result.isValid && result.confidence >= this.config.detectionConfidenceThreshold) {
				this.stopDetection();
				await this.generateAndShowResults({
					className: result.label,
					confidence: Math.round(result.confidence * 100)
				});
				return;
			}
		} catch (error) {
			logError('Detection loop error', error);
		}

		if (this.isRunning) {
			this.currentLoopId = requestAnimationFrame((time) => this.detectLoop(time));
		}
	}

	// TODO [Basic] Implementasikan metode untuk menghasilkan dan menampilkan fun fact
	async generateAndShowResults(detectionResult) {
		try {
			this.ui.showResults(detectionResult, null);
			this.currentFunFact = await this.funFactGenerator.generateFunFact(detectionResult.className, this.currentTone);
			this.ui.updateFunFactState('success', { funFact: this.currentFunFact });
		} catch (error) {
			logError('Gagal menampilkan hasil', error);
			this.ui.updateFunFactState('error');
		}
	}
}

document.addEventListener('DOMContentLoaded', () => {
	const app = new RootFactsApp();

	if (typeof lucide !== 'undefined') {
		lucide.createIcons();
	}
});

export default RootFactsApp;
