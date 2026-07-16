import {
	getCameraErrorMessage,
	logError
} from '../core/utils.js';

class CameraService {
	constructor() {
		this.stream = null;
		this.video = null;
		this.canvas = null;
		this.config = null;

		this.initializeElements();
		this.init();
	}

	// TODO [Basic] Implementasikan metode untuk menginisialisasi elemen DOM yang diperlukan
	initializeElements() {
		this.video = document.getElementById('videoElement');
		this.canvas = document.getElementById('canvasElement');
		this.cameraSelect = document.getElementById('camera-select');
	}

	async init() {
		await this.loadCameras();
	}

	// TODO [Basic] Implementasikan metode untuk memuat daftar kamera yang tersedia
	async loadCameras() {
		try {
			const devices = await navigator.mediaDevices.enumerateDevices();
			const videoDevices = devices.filter(device => device.kind === 'videoinput');

			if (this.cameraSelect) {
				this.cameraSelect.innerHTML = '';
				if (videoDevices.length > 0) {
					videoDevices.forEach((device, index) => {
						const option = document.createElement('option');
						option.value = device.deviceId;
						option.text = device.label || `Kamera ${index + 1}`;
						this.cameraSelect.appendChild(option);
					});
				} else {
					const option = document.createElement('option');
					option.text = 'Tidak ada kamera tersedia';
					option.disabled = true;
					this.cameraSelect.appendChild(option);
				}
			}
		} catch (error) {
			logError('Gagal memuat kamera', error);
			throw new Error(`Akses kamera gagal: ${error.message}`);
		}
	}

	// TODO [Basic] Implementasikan metode untuk memulai kamera dengan constraints yang sesuai
	async startCamera() {
		try {
			if (this.stream) {
				this.stopCamera();
			}

			const deviceId = this.cameraSelect ? this.cameraSelect.value : undefined;
			const constraints = {
				video: {
					deviceId: deviceId ? { exact: deviceId } : undefined,
					facingMode: deviceId ? undefined : 'environment',
					width: { ideal: 640 },
					height: { ideal: 480 }
				},
				audio: false
			};

			this.stream = await navigator.mediaDevices.getUserMedia(constraints);
			
			if (this.video) {
				this.video.srcObject = this.stream;
				return new Promise((resolve) => {
					this.video.onloadedmetadata = () => {
						this.video.play();
						resolve();
					};
				});
			}
		} catch (error) {
			logError('Gagal memulai kamera', error);
			const errorMessage = getCameraErrorMessage(error);
			throw new Error(errorMessage);
		}
	}

	// TODO [Basic] Implementasikan metode untuk menghentikan kamera
	stopCamera() {
		if (this.stream) {
			this.stream.getTracks().forEach(track => track.stop());
			this.stream = null;
		}
		if (this.video) {
			this.video.srcObject = null;
		}
	}

	// TODO [Skilled] Implementasikan metode untuk mengatur FPS kamera
	setFPS(fps) {
		if (this.stream) {
			const videoTrack = this.stream.getVideoTracks()[0];
			if (videoTrack) {
				videoTrack.applyConstraints({
					frameRate: { ideal: fps }
				}).catch(err => logError('Failed to set FPS', err));
			}
		}
	}

	// TODO [Basic] Periksa apakah kamera sedang aktif
	isActive() {
		return this.stream !== null && this.stream.active;
	}

	// TODO [Basic] Periksa apakah kamera siap untuk digunakan
	isReady() {
		return this.video && this.video.readyState >= 2;
	}
}

export default CameraService;
