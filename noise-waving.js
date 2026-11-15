class BandNoiseProcessor extends AudioWorkletProcessor {

    constructor() {
        super();

        this.seed = 123456789;

        this.x1 = 0;
        this.x2 = 0;
        this.y1 = 0;
        this.y2 = 0;

        this.sampleRate = sampleRate;

        // Current center frequency
        this.center = 300;

        // Width of the noise band
        this.bandwidth = 200;

        this.updateFilter();
    }


    random() {

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

        const Q = f0 / bw;

        const omega =
            2 * Math.PI * f0 / this.sampleRate;

        const alpha =
            Math.sin(omega) / (2 * Q);

        const cosw =
            Math.cos(omega);


        const b0 = alpha;
        const b1 = 0;
        const b2 = -alpha;

        const a0 = 1 + alpha;
        const a1 = -2 * cosw;
        const a2 = 1 - alpha;


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

            /*
             * Frequency modulation
             *
             * 400 = midpoint
             * 200 = amplitude
             *
             * Therefore:
             *
             * minimum = 200 Hz
             * maximum = 600 Hz
             *
             * Period = 2 seconds
             */

            const t =
                currentTime +
                i / this.sampleRate;

            this.center =
                400 +
                200 *
                Math.sin(
                    2 * Math.PI * t / 5
                );


            // Update filter
            this.updateFilter();


            // Generate random noise
            const noise =
                this.random() * 2 - 1;


            // Band-pass filter
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
    "band-noise-processor",
    BandNoiseProcessor
);