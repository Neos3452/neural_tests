function toFixed(value, precision) {
    var power = Math.pow(10, precision || 0);
    return String(Math.round(value * power) / power);
}

function NeuronVisualizer(neuron) {
    this.neuron = neuron;
    this.dom = $('<div class="neuron"></div>');
    this.weights = $('<ol></ol>').appendTo(this.dom);
    $(document.createTextNode(' ')).appendTo(this.dom);
    this.neuron.weights.forEach(function(w) { $('<li></li>').appendTo(this.weights).text(toFixed(w, 3)); }.bind(this));
    this.error = $('<span></span>').appendTo(this.dom).text(NaN);
    //this.value = $('<span></span>').appendTo(this.dom).text(toFixed(this.neuron.func.lastValue, 3));
}

NeuronVisualizer.prototype.update = function(error) {
    $('ol li', this.dom).text(function(i) {
        return toFixed(this.neuron.weights[i], 3);
    }.bind(this));
    //this.value.text(toFixed(this.neuron.func.lastValue, 3));
    if (typeof error !== 'undefined') {
        this.error.text(toFixed(error, 3));
    }
}

function LayerVisualizer(layer) {
    this.layer = layer;
    this.neuronsVisualizers = this.layer.neurons.map(function(n) { return new NeuronVisualizer(n); });
    this.dom = $('<div class="layer"></div>');
    this.neurons = $('<ol></ol>').appendTo(this.dom);
    this.neuronsVisualizers.forEach(function(nv) {
        nv.dom.appendTo($('<li></li>').appendTo(this.neurons));
    }.bind(this));
}

LayerVisualizer.prototype.update = function(errors) {
    for (var i = 0; i < this.neuronsVisualizers.length; ++i) {
        this.neuronsVisualizers[i].update(errors[i]);
    }
}

function paintPlot(canvas, xy, classes, clearCavas, xi, yi, bw) {
    clearCavas = clearCavas !== false;
    bw = bw === true;
    xi = (typeof xi !== 'undefined') ? xi : 0;
    yi = (typeof yi !== 'undefined') ? yi : 1;

    var margin = 0;

    var maxClass = Math.max.apply(null, classes);
    var context = canvas.getContext('2d');
    if (clearCavas)
        context.clearRect(0, 0, canvas.width, canvas.height);
    for (var i = 0; i < xy.length; ++i) {
        if (typeof xy[i] === 'undefined' || typeof classes[i]  === 'undefined') continue;

        if (bw)
            context.fillStyle = 'hsl(0, 0%,' + (classes[i] * (100/(maxClass))) + '%)';
        else
            context.fillStyle = 'hsl(' + (classes[i] * (360/(maxClass+1))) + ', 100%,50%)';
        context.beginPath();
        var x = margin + (xy[i][xi] * (canvas.width - 2*margin));
        var y = margin + ((1 - xy[i][yi]) * (canvas.height - 2*margin));
        context.arc(x, y, 2, 0, 2 * Math.PI);
        context.strokeStyle = "black";
        context.stroke();
        context.fill();
    }
}

function visualizeNetwork(canvas, network, clearCavas) {
    clearCavas = clearCavas !== false;

    var margin = 0;

    var pointsPerAxis = 10;
    var intervals = pointsPerAxis-1;
    var step = 1 / intervals;
    //var input = [];
    var output = [];
    //var flatOutput = [];
    for (var i = 0; i < pointsPerAxis; ++i) {
        var row = [];
        for (var j = 0; j < pointsPerAxis; ++j) {
            //input.push([step * j, step * i]);
            let value = network.value([step * j, step * i]);
            //flatOutput.push(value);
            row.push(value);
        }
        output.push(row);
    }
    var context = canvas.getContext('2d');
    if (clearCavas)
        context.clearRect(0, 0, canvas.width, canvas.height);

    var scaleY = canvas.height / (intervals);
    var scaleX = canvas.width / (intervals);
    for (var y = 0; y < canvas.height; ++y) {
        var iyv = y / scaleY;
        var iy0 = Math.floor(iyv);
        var iy1 = Math.ceil(iyv);
        for (var x = 0; x < canvas.width; ++x) {
            var ixv = x / scaleX;
            var ix0 = Math.floor(ixv);
            var ix1 = Math.ceil(ixv);

            var el00 = output[iy0][ix0];
            var el10 = output[iy1][ix0];
            var el01 = output[iy0][ix1];
            var el11 = output[iy1][ix1];

            var dx = ixv - ix0;
            var dy = iyv - iy0;

            function inner(f00, f10, f01, f11, x, y) {
                var un_x = 1.0 - x; var un_y = 1.0 - y;
                return (f00 * un_x * un_y + f10 * x * un_y + f01 * un_x * y + f11 * x * y);
            }

            var inter = [];
            for (var k = 0; k < el00.length; ++k) {
                inter.push(inner(el00[k], el10[k], el01[k], el11[k], dy, dx));
            }

            context.fillStyle = 'hsl(' + (indexOfMax(inter) * (360/(inter.length))) + ', 100%,50%)';
            context.fillRect(x, canvas.height - 1 - y, 1, 1);
        }
    }

    //paintPlot(canvas, input, flatOutput.map(function(x) { return indexOfMax(x); }), false,  0, 1, true);
}
