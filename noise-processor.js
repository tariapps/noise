
class BandNoiseProcessor extends AudioWorkletProcessor {

	constructor() {
		super();

		// Two independent random generators.
		// We use a simple deterministic PRNG rather than
		// Math.random() for every audio sample.
		this.seed = 123456789;

		// State for a 2nd-order resonant band-pass filter.
		this.x1 = 0;
		this.x2 = 0;
		this.y1 = 0;
		this.y2 = 0;

		this.sampleRate = sampleRate;

		// Center frequency of the band.
		this.center = 300;

		// Bandwidth approximately 2000 Hz.
		this.bandwidth = 200;

		// Filter coefficients.
		this.updateFilter();
	}

	random() {
		// Fast xorshift32 PRNG.
		let x = this.seed;

		x ^= x << 13;
		x ^= x >>> 17;
		x ^= x << 5;

		this.seed = x;

		return (x >>> 0) / 4294967296;
	}

	updateFilter() {

		const f0 = this.center;
		const bw = this.bandwidth;

		// Quality factor.
		const Q = f0 / bw;

		const omega = 2 * Math.PI * f0 / this.sampleRate;

		const alpha = Math.sin(omega) / (2 * Q);

		const cosw = Math.cos(omega);

		// Band-pass biquad.
		let b0 = alpha;
		let b1 = 0;
		let b2 = -alpha;

		let a0 = 1 + alpha;
		let a1 = -2 * cosw;
		let a2 = 1 - alpha;

		// Normalize.
		this.b0 = b0 / a0;
		this.b1 = b1 / a0;
		this.b2 = b2 / a0;
		this.a1 = a1 / a0;
		this.a2 = a2 / a0;
	}

	process(inputs, outputs) {

		const output = outputs[0];
		const channel = output[0];

		for (let i = 0; i < channel.length; i++) {

			// White random noise.
			const noise = this.random() * 2 - 1;

			// Biquad band-pass filter.
			const y =
				this.b0 * noise +
				this.b1 * this.x1 +
				this.b2 * this.x2 -
				this.a1 * this.y1 -
				this.a2 * this.y2;

			this.x2 = this.x1;
			this.x1 = noise;

			this.y2 = this.y1;
			this.y1 = y;

			channel[i] = y * 2.5;
		}

		return true;
	}
}

registerProcessor(
	'band-noise-processor',
	BandNoiseProcessor
);