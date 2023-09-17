const z95 = 1.6449;
const z80 = 0.8416;
const DATA = [];
const MINX = -2;
const MAXX = 4;
const NX = 500;
let SE = 1;
let DELTA = 2;
let MDE_MODE = false;
let POWER = null;

// Taken from https://stackoverflow.com/a/59217784
function norm_cdf(x, mu, std) {
    var x = (x - mu) / std;
    var t = 1 / (1 + 0.2315419 * Math.abs(x));
    var d = 0.3989423 * Math.exp((-x * x) / 2);
    var prob =
        d *
        t *
        (0.3193815 +
            t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    if (x > 0) prob = 1 - prob;
    return prob;
}

function norm_pdf(xs, mu, sigma, xmin, xmax) {
    const ys = new Array(xs.length);
    const prefactor = 1.0 / Math.sqrt(2 * Math.PI) / sigma;

    for (let i = 0; i < xs.length; i++) {
        if ((xmin != null && xs[i] < xmin) || (xmax != null && xs[i] > xmax)) {
            ys[i] = null;
        } else {
            ys[i] = prefactor * Math.exp(-Math.pow((xs[i] - mu) / sigma, 2));
        }
    }

    return ys;
}

function decision_threshold(mu, se, n) {
    return mu + se * z95;
}

function get_se(mu, sigma, n) {
    return (sigma / mu) * Math.sqrt(2 / n);
}

function create_chart(element_id, se, delta, minx, maxx, nx) {
    const opts = {
        width: 800,
        height: 400,
        drawOrder: ["series", "axes"],
        id: element_id,
        scales: {
            x: {
                time: false,
            },
        },
        legend: {
            show: false,
        },
        // cursor: { show: false },
        axes: [
            {
                label: "Estimated Effect Size",
                grid: {
                    show: false,
                },
            },
            {
                label: "PDF",
                grid: {
                    show: false,
                },
            },
        ],
        series: [
            {},
            {
                stroke: "black",
                width: 2,
            },
            {
                stroke: "black",
                width: 2,
            },
            {
                fill: "rgba(0,158,115,0.5)",
            },
            {
                fill: "rgba(213,94,0,0.8)",
            },
        ],
    };

    const xs = new Array(nx);
    const dx = (maxx - minx) / (nx - 1);

    for (let i = 0; i < nx; i++) {
        xs[i] = minx + dx * i;
    }

    DATA[0] = xs;
    update_data();
    return new uPlot(opts, DATA, document.getElementById(element_id));
}

function update_data() {
    xs = DATA[0];
    c = SE * z95;
    mde = (z95 + z80) * SE;

    if (MDE_MODE) {
        delta = mde;
        document.getElementById("delta-input").value = delta;
    } else {
        delta = DELTA;
    }

    power = 1 - norm_cdf(c, delta, SE);
    document.getElementById("power-display").innerHTML =
        Math.round(power * 100).toString() + "%";

    document.getElementById("se-display").innerHTML = SE.toFixed(2);
    document.getElementById("delta-display").innerHTML = delta.toFixed(2);

    DATA[1] = norm_pdf(xs, 0, SE);
    DATA[2] = norm_pdf(xs, delta, SE);
    DATA[3] = norm_pdf(xs, delta, SE, c);
    DATA[4] = norm_pdf(xs, 0, SE, c);
}

function update_chart(se, delta) {
    if (se) {
        SE = parseFloat(se);
    }

    if (delta) {
        DELTA = parseFloat(delta);
    }

    update_data();
    CHART.setData(DATA);
}

document.getElementById("fixpower").addEventListener("change", function (event) {
    MDE_MODE = event.target.checked;
    update_chart();
});

document.getElementById("se-input").addEventListener("input", function (event) {
    update_chart(event.target.value);
});

document.getElementById("delta-input").addEventListener("input", function (event) {
    update_chart(null, event.target.value);
});

const CHART = create_chart("chart", SE, DELTA, MINX, MAXX, NX);
update_chart();
