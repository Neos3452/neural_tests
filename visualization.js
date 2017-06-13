(function(window) {
    'use strict';

    function toFixed(value, precision) {
        const power = Math.pow(10, precision || 0);
        return String(Math.round(value * power) / power);
    }
    window.toFixed = toFixed;

    function inner(f00, f10, f01, f11, x, y) {
        const un_x = 1.0 - x;
        const un_y = 1.0 - y;
        return (f00 * un_x * un_y + f10 * x * un_y + f01 * un_x * y + f11 * x * y);
    }

    function NeuronVisualizer(neuron) {
        this.neuron = neuron;
        this.dom = $('<div class="neuron"></div>');
        this.weights = $('<ol></ol>').appendTo(this.dom);
        $(document.createTextNode(' ')).appendTo(this.dom);
        this.neuron.weights.forEach((function (w) {
            $('<li></li>').appendTo(this.weights).text(toFixed(w, 3));
        }).bind(this));
        this.error = $('<span></span>').appendTo(this.dom).text(NaN);
        //this.value = $('<span></span>').appendTo(this.dom).text(toFixed(this.neuron.func.lastValue, 3));
    }

    NeuronVisualizer.prototype.update = function (error) {
        $('ol li', this.dom).text((function (i) {
            return toFixed(this.neuron.weights[i], 3);
        }).bind(this));
        //this.value.text(toFixed(this.neuron.func.lastValue, 3));
        if (typeof error !== 'undefined') {
            this.error.text(toFixed(error, 3));
        }
    };
    window.NeuronVisualizer = NeuronVisualizer;

    function LayerVisualizer(layer) {
        this.layer = layer;
        this.neuronsVisualizers = this.layer.neurons.map(function (n) {
            return new NeuronVisualizer(n);
        });
        this.dom = $('<div class="layer"></div>');
        this.neurons = $('<ol></ol>').appendTo(this.dom);
        this.neuronsVisualizers.forEach((function (nv) {
            nv.dom.appendTo($('<li></li>').appendTo(this.neurons));
        }).bind(this));
    }

    LayerVisualizer.prototype.update = function (errors) {
        this.neuronsVisualizers.forEach(function(nv, i) {
            nv.update(errors[i]);
        });
    };
    window.LayerVisualizer = LayerVisualizer;

    window.paintPlot = function (canvas, xy, classes, clearCanvas, xi, yi, bw) {
        clearCanvas = clearCanvas !== false;
        bw = bw === true;
        xi = (typeof xi !== 'undefined') ? xi : 0;
        yi = (typeof yi !== 'undefined') ? yi : 1;

        const margin = 0;

        const maxClass = Math.max.apply(null, classes);
        const context = canvas.getContext('2d');
        if (clearCanvas) {
            context.clearRect(0, 0, canvas.width, canvas.height);
        }
        // for (var i = 0; i < xy.length; ++i) {
        xy.forEach(function(xy, i) {
            if (typeof xy === 'undefined' || typeof classes[i] === 'undefined') {
                return;
            }

            if (bw) {
                context.fillStyle = 'hsl(0, 0%,' + (classes[i] * (100 / (maxClass))) + '%)';
            } else {
                context.fillStyle = 'hsl(' + (classes[i] * (360 / (maxClass + 1))) + ', 100%,50%)';
            }
            context.beginPath();
            const x = margin + (xy[xi] * (canvas.width - 2 * margin));
            const y = margin + ((1 - xy[yi]) * (canvas.height - 2 * margin));
            context.arc(x, y, 2, 0, 2 * Math.PI);
            context.strokeStyle = "black";
            context.stroke();
            context.fill();
        });
    };

    window.visualizeNetwork = function (canvas, network, clearCavas) {
        clearCavas = clearCavas !== false;

        const margin = 0;

        const pointsPerAxis = 10;
        const intervals = pointsPerAxis - 1;
        const step = 1 / intervals;
        //var input = [];
        const output = [];
        //var flatOutput = [];
        for (let i = 0; i < pointsPerAxis; ++i) {
            const row = [];
            for (let j = 0; j < pointsPerAxis; ++j) {
                //input.push([step * j, step * i]);
                let value = network.value([step * j, step * i]);
                //flatOutput.push(value);
                row.push(value);
            }
            output.push(row);
        }
        const context = canvas.getContext('2d');
        if (clearCavas) {
            context.clearRect(0, 0, canvas.width, canvas.height);
        }

        const scaleY = canvas.height / (intervals);
        const scaleX = canvas.width / (intervals);
        for (let y = 0; y < canvas.height; ++y) {
            const iyv = y / scaleY;
            const iy0 = Math.floor(iyv);
            const iy1 = Math.ceil(iyv);
            for (let x = 0; x < canvas.width; ++x) {
                const ixv = x / scaleX;
                const ix0 = Math.floor(ixv);
                const ix1 = Math.ceil(ixv);

                const el00 = output[iy0][ix0];
                const el10 = output[iy1][ix0];
                const el01 = output[iy0][ix1];
                const el11 = output[iy1][ix1];

                const dx = ixv - ix0;
                const dy = iyv - iy0;

                const inter = [];
                for (let k = 0; k < el00.length; ++k) {
                    inter.push(inner(el00[k], el10[k], el01[k], el11[k], dy, dx));
                }

                context.fillStyle = 'hsl(' + (indexOfMax(inter) * (360 / (inter.length))) + ', 100%,50%)';
                context.fillRect(x, canvas.height - 1 - y, 1, 1);
            }
        }

        //paintPlot(canvas, input, flatOutput.map(function(x) { return indexOfMax(x); }), false,  0, 1, true);
    };

}(this));
