(function () {

  var COLORS = ['#ff7a6b', '#ffc247', '#43d3c3', '#8e9bff', '#ff9cc0', '#9bdc6a'];
  var INK = '#14232e';
  var TAU = Math.PI * 2;

  var canvas = document.getElementById('wheel');
  var ctx = canvas.getContext('2d');
  var textarea = document.getElementById('opts');
  var spinButton = document.getElementById('spin');
  var resultEl = document.getElementById('result');
  var hintEl = document.getElementById('hint');
  var removeBox = document.getElementById('remove');

  var items = [];
  var angle = 0;
  var spinning = false;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function mod(x, m) {
    return ((x % m) + m) % m;
  }

  function readItems() {
    items = textarea.value
      .split('\n')
      .map(function (line) { return line.trim(); })
      .filter(Boolean);

    spinButton.disabled = spinning || items.length < 2;
    hintEl.textContent = items.length < 2
      ? 'Add at least two options to spin.'
      : items.length + ' options';
  }

  function draw() {
    var size = canvas.clientWidth || 400;
    var dpr = window.devicePixelRatio || 1;

    canvas.width = canvas.height = Math.round(size * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    var center = size / 2;
    var radius = center - 4;
    var count = items.length;

    ctx.lineWidth = 3;
    ctx.strokeStyle = INK;

    if (!count) {
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, TAU);
      ctx.fillStyle = '#c9d6df';
      ctx.fill();
      ctx.stroke();
      return;
    }

    var slice = TAU / count;

    var fontFamily = '"Bricolage Grotesque", system-ui, sans-serif';
    var textStart = radius - 14;
    var hubEdge = size * 0.06 + 10;
    var fontSize = Math.max(8, Math.min(22, size * 0.05, radius * 0.35 * slice / 1.2));
    var innerLimit = Math.max(hubEdge, fontSize * 1.2 / slice);
    var maxWidth = textStart - innerLimit;

    // With many options the slices get too thin for outlines or text
    var rimArc = radius * slice;                 // slice width at the rim, in px
    var lineW = rimArc > 14 ? 2 : (rimArc > 7 ? 1 : 0);
    var showText = maxWidth > fontSize * 3 && rimArc > 8;
    var overlap = lineW ? 0 : 0.003;             // hide hairline gaps between slices

    for (var i = 0; i < count; i++) {
      var start = angle + i * slice;

      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, start, start + slice + overlap);
      ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      if (lineW) {
        ctx.lineWidth = lineW;
        ctx.stroke();
      }

      if (!showText) continue;

      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(start + slice / 2);
      ctx.fillStyle = INK;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.font = '800 ' + fontSize + 'px ' + fontFamily;

      var label = items[i];
      while (label.length > 1 && ctx.measureText(label).width > maxWidth) {
        label = label.slice(0, -2).trimEnd() + '…';
      }

      ctx.fillText(label, textStart, 0);
      ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(center, center, radius, 0, TAU);
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(center, center, size * 0.06, 0, TAU);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.stroke();
  }


  function spin() {
    if (spinning || items.length < 2) return;

    spinning = true;
    spinButton.disabled = true;
    resultEl.textContent = 'Spinning…';

    var count = items.length;
    var slice = TAU / count;
    var winnerIndex = Math.floor(Math.random() * count);
    var offsetInSlice = (0.15 + Math.random() * 0.7) * slice;
    var targetAngle = mod(1.5 * Math.PI - (winnerIndex * slice + offsetInSlice), TAU);

    var extraTurns = reduceMotion ? 1 : 5 + Math.floor(Math.random() * 3);
    var distance = mod(targetAngle - angle, TAU) + TAU * extraTurns;

    var startAngle = angle;
    var duration = reduceMotion ? 600 : 4800;
    var startTime = performance.now();

    function frame(now) {
      var progress = Math.min(1, (now - startTime) / duration);
      var eased = 1 - Math.pow(1 - progress, 4);

      angle = startAngle + distance * eased;
      draw();

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        finish(winnerIndex);
      }
    }

    requestAnimationFrame(frame);
  }

  function finish(winnerIndex) {
    spinning = false;
    var winner = items[winnerIndex];

    // Show the result
    resultEl.innerHTML = '';
    var caption = document.createElement('small');
    caption.textContent = 'Winner';
    resultEl.appendChild(caption);
    resultEl.appendChild(document.createTextNode(winner));

    if (removeBox.checked) {
      var lines = textarea.value.split('\n');
      for (var i = 0; i < lines.length; i++) {
        if (lines[i].trim() === winner) {
          lines.splice(i, 1);
          textarea.value = lines.join('\n');
          break;
        }
      }
    }

    readItems();
    draw();
  }

  spinButton.addEventListener('click', spin);
  canvas.addEventListener('click', spin);

  textarea.addEventListener('input', function () {
    readItems();
    draw();
  });

  window.addEventListener('resize', draw);

  readItems();
  draw();

})();
