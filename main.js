const COLORS = [
  '#e63946','#f4a261','#2a9d8f','#457b9d','#9b5de5',
  '#f15bb5','#00b4d8','#06d6a0','#fb8500','#8338ec',
  '#ef233c','#4cc9f0','#43aa8b','#f72585','#7209b7',
  '#3a86ff','#ff006e','#fb5607','#8ac926','#1982c4'
];

let segments = [
  'Приз 1','Приз 2','Ничего','Приз 3',
  'Попробуй ещё','Приз 4','Джекпот!','Приз 5'
];

let history = [];
let isSpinning = false;
let currentAngle = 0;
let animFrame;

const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');

function resize() {
  const size = canvas.parentElement.offsetWidth;
  canvas.width = size;
  canvas.height = size;
  drawWheel();
}

function drawWheel() {
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2;
  const R = Math.min(W, H) / 2 - 4;
  const n = segments.length;
  const arc = (2 * Math.PI) / n;

  ctx.clearRect(0, 0, W, H);
    if (segments.length === 0) {
    canvas.style.display = 'none';
    document.getElementById('spinBtn').style.display = 'none';
    document.querySelector('.pointer').style.display = 'none';

    let empty = document.getElementById('emptyState');
    if (!empty) {
      empty = document.createElement('div');
      empty.id = 'emptyState';
      empty.className = 'empty-state';
      empty.innerHTML = `
        <strong>Нет вариантов</strong>
        <span>Добавьте хотя бы один вариант,<br>чтобы колесо появилось</span>
      `;
      canvas.parentElement.appendChild(empty);
      const box = document.getElementById('resultBox');
      box.className = 'result-box';
      document.querySelector('.result-box').style.display = 'none';
      document.querySelector('.result-empty').style.display = 'none';
    }
    return;
  }

  // убираем пустой стейт если есть
  canvas.style.display = 'block';
  document.getElementById('spinBtn').style.display = '';
  document.querySelector('.pointer').style.display = '';
  const empty = document.getElementById('emptyState');
  if (empty) empty.remove();

  
    document.querySelector('.result-box').style.display = '';
      document.querySelector('.result-empty').style.display = '';
  for (let i = 0; i < n; i++) {
    const startA = currentAngle + i * arc - Math.PI / 2;
    const endA = startA + arc;
    const color = COLORS[i % COLORS.length];

    // заливка 
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, startA, endA);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // Разделетель
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, startA, endA);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // текст
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(startA + arc / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fff';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 3;
    const fontSize = Math.max(10, Math.min(15, R * 0.12));
    ctx.font = `${500} ${fontSize}px 'Inter', sans-serif`;

    const maxLen = R * 0.55;
    let label = segments[i];
    ctx.save();
    while (ctx.measureText(label).width > maxLen && label.length > 3) {
      label = label.slice(0, -1);
    }
    if (label !== segments[i]) label = label.slice(0, -1) + '…';
    ctx.fillText(label, R - 10, fontSize * 0.38);
    ctx.restore();
    ctx.restore();
  }

  // центрик круга
  ctx.beginPath();
  ctx.arc(cx, cy, 36, 0, Math.PI * 2);
  ctx.fillStyle = '#0d0d14';
  ctx.fill();
  ctx.strokeStyle = '#f5c842';
  ctx.lineWidth = 3;
  ctx.stroke();
}

function getWinner(angle) {
  const n = segments.length;
  const arc = 360 / n;
  let deg = ((-angle * 180 / Math.PI) % 360 + 360) % 360;
  let idx = Math.floor(deg / arc) % n;
  return { index: idx, label: segments[idx], color: COLORS[idx % COLORS.length] };
}

function spin() {
  if (isSpinning ) return;
  isSpinning = true;

  const btn = document.getElementById('spinBtn');
  btn.disabled = true;

  const extraSpins = (5 + Math.floor(Math.random() * 5)) * 2 * Math.PI;
  const randomStop = Math.random() * 2 * Math.PI;
  const target = currentAngle + extraSpins + randomStop;

  const duration = 3500 + Math.random() * 1200;
  const start = performance.now();
  const startAngle = currentAngle;

  function easeOut(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  function step(now) {
    const elapsed = now - start;
    const t = Math.min(elapsed / duration, 1);
    currentAngle = startAngle + (target - startAngle) * easeOut(t);
    drawWheel();

    if (t < 1) {
      animFrame = requestAnimationFrame(step);
    } else {
      currentAngle = target;
      drawWheel();
      isSpinning = false;
      btn.disabled = false;
      showResult();
    }
  }

  requestAnimationFrame(step);
}

function showResult() {
  const winner = getWinner(currentAngle);
  const box = document.getElementById('resultBox');
  box.className = 'result-box winner';
  box.innerHTML = `<span class="result-label" style="color:${winner.color}">${winner.label}</span>`;

  history.unshift(winner);
  renderHistory();
}

function renderSegList() {
  const ul = document.getElementById('segList');
  ul.innerHTML = segments.map((s, i) => `
    <li class="seg-item">
      <span class="seg-dot" style="background:${COLORS[i % COLORS.length]}"></span>
      <span class="seg-text" title="${s}">${s}</span>
      <button class="seg-remove" onclick="removeSegment(${i})" title="Удалить">×</button>
    </li>
  `).join('');
}

function renderHistory() {
  const ul = document.getElementById('historyList');
  if (!history.length) {
    ul.innerHTML = '<li style="color:var(--muted);font-size:0.82rem">Пока пусто</li>';
    return;
  }
  ul.innerHTML = history.slice(0, 20).map(h => `
    <li class="history-item">
      <span class="dot" style="background:${h.color}"></span>
      ${h.label}
    </li>
  `).join('');
}

function addSegment() {
  const input = document.getElementById('newSeg');
  const val = input.value.trim();
  if (!val) return;
  segments.push(val);
  input.value = '';
  renderSegList();
  drawWheel();
}

function removeSegment(i) {
  segments.splice(i, 1);
  renderSegList();
  drawWheel();
}

function clearHistory() {
  history = [];
  renderHistory();
  const box = document.getElementById('resultBox');
  box.className = 'result-box';
  box.innerHTML = '<span class="result-empty">Нажмите SPIN</span>';
}


canvas.addEventListener('click', spin);


window.addEventListener('resize', resize);
resize();
renderSegList();
renderHistory();