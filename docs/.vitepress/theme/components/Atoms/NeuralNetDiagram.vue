<script setup>
import { ref, onMounted } from 'vue'

const tipEl = ref(null)

onMounted(() => {
  const COL_INFO = {
    1: { title: 'Input Tokens', body: 'BPE SentencePiece 分词。输入 "sunny day" 被切为 [CLS], sun, ##ny, day, [SEP], [PAD]，共 6 个 token。' },
    2: { title: 'Token Embeddings', body: '每个 token 查词表得到 384 维向量。词表约 250K 词，嵌入矩阵可随微调更新。' },
    3: { title: 'MiniLM Transformer ×12', body: '12 层 Transformer Block，每层含 Multi-Head Self-Attention（12 heads）+ FFN + LayerNorm。hidden_size = 384。' },
    4: { title: '[CLS] Token', body: 'position 0 的特殊 token，汇聚整句信息。取其 384 维隐层向量作为句子表示，送入分类头。' },
    5: { title: 'Linear 384→32', body: 'Dropout(p=0.1) 后接全连接层，将 384 维映射为 32 维 logits，每维对应一个 emoji 类别。' },
    6: { title: 'Top-K Output', body: 'Softmax 归一化后取概率最高的 K 个 emoji。高亮显示从输入到该节点的完整前向传播路径。' },
  }

  const ALL_CONN = ['nn-lines-1-2', 'nn-lines-2-3', 'nn-lines-3-4', 'nn-lines-4-5', 'nn-lines-5-6']
  const ALL_COL  = ['nn-col1', 'nn-col2', 'nn-col3', 'nn-col4', 'nn-col5', 'nn-col6']
  const tip = tipEl.value

  function moveTip(e) {
    tip.style.left = (e.clientX + 14) + 'px'
    tip.style.top  = (e.clientY - 10) + 'px'
  }

  function clearAll() {
    ;[...ALL_COL, ...ALL_CONN].forEach(id => {
      const el = document.getElementById(id)
      if (el) el.classList.remove('nn-dim', 'nn-focus')
    })
    document.querySelectorAll('#nn-lines-5-6 line').forEach(l => {
      l.style.opacity = ''; l.style.stroke = ''; l.style.strokeWidth = ''
    })
    document.querySelectorAll('#nn-col6 circle').forEach(c => { c.style.opacity = '' })
    tip.style.display = 'none'
  }

  ALL_COL.slice(0, 5).forEach((id, i) => {
    const g = document.getElementById(id)
    if (!g) return
    const col = i + 1

    g.addEventListener('mouseenter', (e) => {
      ;[...ALL_COL, ...ALL_CONN].forEach(cid => {
        const el = document.getElementById(cid)
        if (el) { el.classList.add('nn-dim'); el.classList.remove('nn-focus') }
      })
      g.classList.remove('nn-dim'); g.classList.add('nn-focus')
      const prev = document.getElementById(`nn-lines-${col - 1}-${col}`)
      const next = document.getElementById(`nn-lines-${col}-${col + 1}`)
      if (prev) { prev.classList.remove('nn-dim'); prev.classList.add('nn-focus') }
      if (next) { next.classList.remove('nn-dim'); next.classList.add('nn-focus') }
      const info = COL_INFO[col]
      tip.innerHTML = `<strong>${info.title}</strong>${info.body}`
      tip.style.display = 'block'
      moveTip(e)
    })
    g.addEventListener('mousemove', moveTip)
    g.addEventListener('mouseleave', clearAll)
  })

  let hoveredCol6Y = null
  let pendingTimeouts = []

  function fire(colId, connId) {
    const g = document.getElementById(colId)
    const c = connId && document.getElementById(connId)
    if (g) {
      if (colId === 'nn-col6' && hoveredCol6Y) {
        const circ = g.querySelector(`circle[cy="${hoveredCol6Y}"]`)
        if (circ) {
          circ.classList.remove('nn-firing-single'); void circ.offsetWidth
          circ.classList.add('nn-firing-single')
          setTimeout(() => circ.classList.remove('nn-firing-single'), 800)
        }
      } else {
        g.classList.remove('nn-firing'); void g.offsetWidth; g.classList.add('nn-firing')
        setTimeout(() => g.classList.remove('nn-firing'), 800)
      }
    }
    if (c) {
      if (connId === 'nn-lines-5-6' && hoveredCol6Y) {
        c.querySelectorAll(`line[y2="${hoveredCol6Y}"]`).forEach(line => {
          line.classList.remove('nn-flowing-line'); void line.offsetWidth
          line.classList.add('nn-flowing-line')
          setTimeout(() => line.classList.remove('nn-flowing-line'), 650)
        })
      } else {
        c.classList.remove('nn-flowing'); void c.offsetWidth; c.classList.add('nn-flowing')
        setTimeout(() => c.classList.remove('nn-flowing'), 650)
      }
    }
  }

  function runForwardPass() {
    [
      [0,    'nn-col1', 'nn-lines-1-2'],
      [550,  'nn-col2', 'nn-lines-2-3'],
      [1100, 'nn-col3', 'nn-lines-3-4'],
      [1650, 'nn-col4', 'nn-lines-4-5'],
      [2200, 'nn-col5', 'nn-lines-5-6'],
      [2750, 'nn-col6', null],
    ].forEach(([delay, col, conn]) => {
      pendingTimeouts.push(setTimeout(() => fire(col, conn), delay))
    })
  }

  let animInterval = null
  function startAnim() { runForwardPass(); animInterval = setInterval(runForwardPass, 7000) }
  function stopAnim() {
    clearInterval(animInterval); animInterval = null
    pendingTimeouts.forEach(clearTimeout); pendingTimeouts = []
  }

  const col6Circles = document.querySelectorAll('#nn-col6 circle')
  col6Circles.forEach((circle) => {
    const targetY = circle.getAttribute('cy')
    circle.style.cursor = 'pointer'

    circle.addEventListener('mouseenter', (e) => {
      hoveredCol6Y = targetY
      ;[...ALL_COL, ...ALL_CONN].forEach(cid => {
        const el = document.getElementById(cid)
        if (el) { el.classList.add('nn-dim'); el.classList.remove('nn-focus') }
      })
      ;['nn-col1', 'nn-col2', 'nn-col3', 'nn-col4', 'nn-col5'].forEach(cid => {
        const el = document.getElementById(cid)
        if (el) { el.classList.remove('nn-dim'); el.classList.add('nn-focus') }
      })
      ;['nn-lines-1-2', 'nn-lines-2-3', 'nn-lines-3-4', 'nn-lines-4-5'].forEach(cid => {
        const el = document.getElementById(cid)
        if (el) { el.classList.remove('nn-dim'); el.classList.add('nn-focus') }
      })
      const lines56 = document.getElementById('nn-lines-5-6')
      if (lines56) {
        lines56.classList.remove('nn-dim')
        lines56.querySelectorAll('line').forEach(line => {
          if (line.getAttribute('y2') === targetY) {
            line.style.opacity = '0.9'; line.style.stroke = 'var(--nn-brand)'; line.style.strokeWidth = '1.5px'
          } else {
            line.style.opacity = '0.04'
          }
        })
      }
      document.getElementById('nn-col6').classList.remove('nn-dim')
      col6Circles.forEach(c => { c.style.opacity = c === circle ? '1' : '0.08' })

      tip.innerHTML = `<strong>${COL_INFO[6].title}</strong>${COL_INFO[6].body}`
      tip.style.display = 'block'
      moveTip(e)

      startAnim()
    })

    circle.addEventListener('mousemove', moveTip)
    circle.addEventListener('mouseleave', () => { hoveredCol6Y = null; stopAnim(); clearAll() })
  })
})
</script>

<template>
  <figure class="not-prose my-6">
    <svg class="nn-svg" viewBox="0 0 840 410" xmlns="http://www.w3.org/2000/svg" style="width:100%;display:block;">
      <defs>
        <pattern id="a-dots" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.8" fill="#E3E2DC"/>
        </pattern>
      </defs>
      <rect class="nn-svgbg" width="840" height="410"/>
      <rect class="nn-svgdots" width="840" height="410" fill="url(#a-dots)" opacity="0.45"/>

      <!-- MiniLM box -->
      <rect id="nn-minilm-box" x="210" y="36" width="200" height="300" rx="6" fill="#EEF2F7" stroke="#1B365D" stroke-width="1.3"/>

      <!-- LINE GROUPS -->
      <g id="nn-lines-1-2" class="nn-conn-group">
        <line x1="110" y1="56"  x2="235" y2="56"  stroke="#B8B7B0" stroke-width="1"/>
        <line x1="110" y1="106" x2="235" y2="106" stroke="#B8B7B0" stroke-width="1"/>
        <line x1="110" y1="156" x2="235" y2="156" stroke="#B8B7B0" stroke-width="1"/>
        <line x1="110" y1="206" x2="235" y2="206" stroke="#B8B7B0" stroke-width="1"/>
        <line x1="110" y1="256" x2="235" y2="256" stroke="#B8B7B0" stroke-width="1"/>
        <line x1="110" y1="306" x2="235" y2="306" stroke="#B8B7B0" stroke-width="1"/>
      </g>
      <g id="nn-lines-2-3" class="nn-conn-group">
        <line x1="235" y1="56"  x2="381" y2="56"  stroke="#C8C7C0" stroke-width="0.7" opacity="0.45"/><line x1="235" y1="56"  x2="381" y2="106" stroke="#C8C7C0" stroke-width="0.7" opacity="0.45"/>
        <line x1="235" y1="56"  x2="381" y2="156" stroke="#C8C7C0" stroke-width="0.7" opacity="0.45"/><line x1="235" y1="56"  x2="381" y2="206" stroke="#C8C7C0" stroke-width="0.7" opacity="0.45"/>
        <line x1="235" y1="56"  x2="381" y2="256" stroke="#C8C7C0" stroke-width="0.7" opacity="0.45"/><line x1="235" y1="56"  x2="381" y2="306" stroke="#C8C7C0" stroke-width="0.7" opacity="0.45"/>
        <line x1="235" y1="106" x2="381" y2="56"  stroke="#C8C7C0" stroke-width="0.7" opacity="0.45"/><line x1="235" y1="106" x2="381" y2="106" stroke="#C8C7C0" stroke-width="0.7" opacity="0.45"/>
        <line x1="235" y1="106" x2="381" y2="156" stroke="#C8C7C0" stroke-width="0.7" opacity="0.45"/><line x1="235" y1="106" x2="381" y2="206" stroke="#C8C7C0" stroke-width="0.7" opacity="0.45"/>
        <line x1="235" y1="106" x2="381" y2="256" stroke="#C8C7C0" stroke-width="0.7" opacity="0.45"/><line x1="235" y1="106" x2="381" y2="306" stroke="#C8C7C0" stroke-width="0.7" opacity="0.45"/>
        <line x1="235" y1="156" x2="381" y2="56"  stroke="#C8C7C0" stroke-width="0.7" opacity="0.45"/><line x1="235" y1="156" x2="381" y2="106" stroke="#C8C7C0" stroke-width="0.7" opacity="0.45"/>
        <line x1="235" y1="156" x2="381" y2="156" stroke="#C8C7C0" stroke-width="0.7" opacity="0.45"/><line x1="235" y1="156" x2="381" y2="206" stroke="#C8C7C0" stroke-width="0.7" opacity="0.45"/>
        <line x1="235" y1="156" x2="381" y2="256" stroke="#C8C7C0" stroke-width="0.7" opacity="0.45"/><line x1="235" y1="156" x2="381" y2="306" stroke="#C8C7C0" stroke-width="0.7" opacity="0.45"/>
        <line x1="235" y1="206" x2="381" y2="56"  stroke="#C8C7C0" stroke-width="0.7" opacity="0.45"/><line x1="235" y1="206" x2="381" y2="106" stroke="#C8C7C0" stroke-width="0.7" opacity="0.45"/>
        <line x1="235" y1="206" x2="381" y2="156" stroke="#C8C7C0" stroke-width="0.7" opacity="0.45"/><line x1="235" y1="206" x2="381" y2="206" stroke="#C8C7C0" stroke-width="0.7" opacity="0.45"/>
        <line x1="235" y1="206" x2="381" y2="256" stroke="#C8C7C0" stroke-width="0.7" opacity="0.45"/><line x1="235" y1="206" x2="381" y2="306" stroke="#C8C7C0" stroke-width="0.7" opacity="0.45"/>
        <line x1="235" y1="256" x2="381" y2="56"  stroke="#C8C7C0" stroke-width="0.7" opacity="0.45"/><line x1="235" y1="256" x2="381" y2="106" stroke="#C8C7C0" stroke-width="0.7" opacity="0.45"/>
        <line x1="235" y1="256" x2="381" y2="156" stroke="#C8C7C0" stroke-width="0.7" opacity="0.45"/><line x1="235" y1="256" x2="381" y2="206" stroke="#C8C7C0" stroke-width="0.7" opacity="0.45"/>
        <line x1="235" y1="256" x2="381" y2="256" stroke="#C8C7C0" stroke-width="0.7" opacity="0.45"/><line x1="235" y1="256" x2="381" y2="306" stroke="#C8C7C0" stroke-width="0.7" opacity="0.45"/>
        <line x1="235" y1="306" x2="381" y2="56"  stroke="#C8C7C0" stroke-width="0.7" opacity="0.45"/><line x1="235" y1="306" x2="381" y2="106" stroke="#C8C7C0" stroke-width="0.7" opacity="0.45"/>
        <line x1="235" y1="306" x2="381" y2="156" stroke="#C8C7C0" stroke-width="0.7" opacity="0.45"/><line x1="235" y1="306" x2="381" y2="206" stroke="#C8C7C0" stroke-width="0.7" opacity="0.45"/>
        <line x1="235" y1="306" x2="381" y2="256" stroke="#C8C7C0" stroke-width="0.7" opacity="0.45"/><line x1="235" y1="306" x2="381" y2="306" stroke="#C8C7C0" stroke-width="0.7" opacity="0.45"/>
      </g>
      <g id="nn-lines-3-4" class="nn-conn-group">
        <line x1="381" y1="56"  x2="525" y2="181" stroke="#1B365D" stroke-width="0.9" opacity="0.55"/>
        <line x1="381" y1="106" x2="525" y2="181" stroke="#1B365D" stroke-width="0.9" opacity="0.55"/>
        <line x1="381" y1="156" x2="525" y2="181" stroke="#1B365D" stroke-width="0.9" opacity="0.55"/>
        <line x1="381" y1="206" x2="525" y2="181" stroke="#1B365D" stroke-width="0.9" opacity="0.55"/>
        <line x1="381" y1="256" x2="525" y2="181" stroke="#1B365D" stroke-width="0.9" opacity="0.55"/>
        <line x1="381" y1="306" x2="525" y2="181" stroke="#1B365D" stroke-width="0.9" opacity="0.55"/>
      </g>
      <g id="nn-lines-4-5" class="nn-conn-group">
        <line x1="525" y1="181" x2="635" y2="56"  stroke="#1B365D" stroke-width="0.9" opacity="0.55"/>
        <line x1="525" y1="181" x2="635" y2="106" stroke="#1B365D" stroke-width="0.9" opacity="0.55"/>
        <line x1="525" y1="181" x2="635" y2="156" stroke="#1B365D" stroke-width="0.9" opacity="0.55"/>
        <line x1="525" y1="181" x2="635" y2="206" stroke="#1B365D" stroke-width="0.9" opacity="0.55"/>
        <line x1="525" y1="181" x2="635" y2="256" stroke="#1B365D" stroke-width="0.9" opacity="0.55"/>
        <line x1="525" y1="181" x2="635" y2="306" stroke="#1B365D" stroke-width="0.9" opacity="0.55"/>
      </g>
      <g id="nn-lines-5-6" class="nn-conn-group">
        <line x1="635" y1="56"  x2="755" y2="131" stroke="#B8B7B0" stroke-width="0.7" opacity="0.4"/><line x1="635" y1="56"  x2="755" y2="181" stroke="#B8B7B0" stroke-width="0.7" opacity="0.4"/><line x1="635" y1="56"  x2="755" y2="231" stroke="#B8B7B0" stroke-width="0.7" opacity="0.4"/>
        <line x1="635" y1="106" x2="755" y2="131" stroke="#B8B7B0" stroke-width="0.7" opacity="0.4"/><line x1="635" y1="106" x2="755" y2="181" stroke="#B8B7B0" stroke-width="0.7" opacity="0.4"/><line x1="635" y1="106" x2="755" y2="231" stroke="#B8B7B0" stroke-width="0.7" opacity="0.4"/>
        <line x1="635" y1="156" x2="755" y2="131" stroke="#B8B7B0" stroke-width="0.7" opacity="0.4"/><line x1="635" y1="156" x2="755" y2="181" stroke="#B8B7B0" stroke-width="0.7" opacity="0.4"/><line x1="635" y1="156" x2="755" y2="231" stroke="#B8B7B0" stroke-width="0.7" opacity="0.4"/>
        <line x1="635" y1="206" x2="755" y2="131" stroke="#B8B7B0" stroke-width="0.7" opacity="0.4"/><line x1="635" y1="206" x2="755" y2="181" stroke="#B8B7B0" stroke-width="0.7" opacity="0.4"/><line x1="635" y1="206" x2="755" y2="231" stroke="#B8B7B0" stroke-width="0.7" opacity="0.4"/>
        <line x1="635" y1="256" x2="755" y2="131" stroke="#B8B7B0" stroke-width="0.7" opacity="0.4"/><line x1="635" y1="256" x2="755" y2="181" stroke="#B8B7B0" stroke-width="0.7" opacity="0.4"/><line x1="635" y1="256" x2="755" y2="231" stroke="#B8B7B0" stroke-width="0.7" opacity="0.4"/>
        <line x1="635" y1="306" x2="755" y2="131" stroke="#B8B7B0" stroke-width="0.7" opacity="0.4"/><line x1="635" y1="306" x2="755" y2="181" stroke="#B8B7B0" stroke-width="0.7" opacity="0.4"/><line x1="635" y1="306" x2="755" y2="231" stroke="#B8B7B0" stroke-width="0.7" opacity="0.4"/>
      </g>

      <!-- NODE GROUPS -->
      <g id="nn-col1" class="nn-col-group" data-col="1">
        <circle cx="110" cy="56"  r="14" fill="#E9E8E1" stroke="#6b6a64" stroke-width="1"/>
        <circle cx="110" cy="106" r="14" fill="#E9E8E1" stroke="#6b6a64" stroke-width="1"/>
        <circle cx="110" cy="156" r="14" fill="#E9E8E1" stroke="#6b6a64" stroke-width="1"/>
        <circle cx="110" cy="206" r="14" fill="#E9E8E1" stroke="#6b6a64" stroke-width="1"/>
        <circle cx="110" cy="256" r="14" fill="#E9E8E1" stroke="#6b6a64" stroke-width="1"/>
        <circle cx="110" cy="306" r="14" fill="#E9E8E1" stroke="#6b6a64" stroke-width="1"/>
      </g>
      <g id="nn-col2" class="nn-col-group" data-col="2">
        <circle cx="235" cy="56"  r="12" fill="#faf9f5" stroke="#141413" stroke-width="1"/>
        <circle cx="235" cy="106" r="12" fill="#faf9f5" stroke="#141413" stroke-width="1"/>
        <circle cx="235" cy="156" r="12" fill="#faf9f5" stroke="#141413" stroke-width="1"/>
        <circle cx="235" cy="206" r="12" fill="#faf9f5" stroke="#141413" stroke-width="1"/>
        <circle cx="235" cy="256" r="12" fill="#faf9f5" stroke="#141413" stroke-width="1"/>
        <circle cx="235" cy="306" r="12" fill="#faf9f5" stroke="#141413" stroke-width="1"/>
      </g>
      <g id="nn-col3" class="nn-col-group" data-col="3">
        <circle cx="381" cy="56"  r="12" fill="#C5D8EA" stroke="#1B365D" stroke-width="0.9"/>
        <circle cx="381" cy="106" r="12" fill="#C5D8EA" stroke="#1B365D" stroke-width="0.9"/>
        <circle cx="381" cy="156" r="12" fill="#C5D8EA" stroke="#1B365D" stroke-width="0.9"/>
        <circle cx="381" cy="206" r="12" fill="#C5D8EA" stroke="#1B365D" stroke-width="0.9"/>
        <circle cx="381" cy="256" r="12" fill="#C5D8EA" stroke="#1B365D" stroke-width="0.9"/>
        <circle cx="381" cy="306" r="12" fill="#C5D8EA" stroke="#1B365D" stroke-width="0.9"/>
      </g>
      <g id="nn-col4" class="nn-col-group" data-col="4">
        <circle cx="525" cy="181" r="22" fill="#EEF2F7" stroke="#1B365D" stroke-width="2"/>
      </g>
      <g id="nn-col5" class="nn-col-group" data-col="5">
        <circle cx="635" cy="56"  r="12" fill="#f0efe8" stroke="#504e49" stroke-width="1"/>
        <circle cx="635" cy="106" r="12" fill="#f0efe8" stroke="#504e49" stroke-width="1"/>
        <circle cx="635" cy="156" r="12" fill="#f0efe8" stroke="#504e49" stroke-width="1"/>
        <circle cx="635" cy="206" r="12" fill="#f0efe8" stroke="#504e49" stroke-width="1"/>
        <circle cx="635" cy="256" r="12" fill="#f0efe8" stroke="#504e49" stroke-width="1"/>
        <circle cx="635" cy="306" r="12" fill="#f0efe8" stroke="#504e49" stroke-width="1"/>
      </g>
      <g id="nn-col6" class="nn-col-group" data-col="6">
        <circle cx="755" cy="131" r="14" fill="#EEF2F7" stroke="#1B365D" stroke-width="1.2"/>
        <circle cx="755" cy="181" r="14" fill="#EEF2F7" stroke="#1B365D" stroke-width="1.2"/>
        <circle cx="755" cy="231" r="14" fill="#EEF2F7" stroke="#1B365D" stroke-width="1.2"/>
      </g>

      <!-- STATIC TEXT -->
      <text x="525" y="176" fill="#1B365D" font-size="10.5" font-family="'JetBrains Mono',monospace" text-anchor="middle" pointer-events="none">[CLS]</text>
      <text x="525" y="190" fill="#1B365D" font-size="9"    font-family="'JetBrains Mono',monospace" text-anchor="middle" pointer-events="none">384-d</text>
      <text x="635" y="187" fill="#6b6a64" font-size="16"   text-anchor="middle" font-family="inherit" pointer-events="none">⋮</text>
      <text x="90"  y="60"  fill="#504e49" font-size="11" font-family="'JetBrains Mono',monospace" text-anchor="end">[CLS]</text>
      <text x="90"  y="110" fill="#504e49" font-size="11" font-family="'JetBrains Mono',monospace" text-anchor="end">sun</text>
      <text x="90"  y="160" fill="#504e49" font-size="11" font-family="'JetBrains Mono',monospace" text-anchor="end">##ny</text>
      <text x="90"  y="210" fill="#504e49" font-size="11" font-family="'JetBrains Mono',monospace" text-anchor="end">day</text>
      <text x="90"  y="260" fill="#504e49" font-size="11" font-family="'JetBrains Mono',monospace" text-anchor="end">[SEP]</text>
      <text x="90"  y="310" fill="#504e49" font-size="11" font-family="'JetBrains Mono',monospace" text-anchor="end">[PAD]</text>
      <text x="772" y="135" fill="#141413" font-size="13" font-family="inherit" text-anchor="start">😘 13%</text>
      <text x="772" y="185" fill="#141413" font-size="13" font-family="inherit" text-anchor="start">💕 11%</text>
      <text x="772" y="235" fill="#141413" font-size="13" font-family="inherit" text-anchor="start">💜 10%</text>
      <text x="580" y="153" fill="#6b6a64" font-size="10" font-family="'JetBrains Mono',monospace" text-anchor="middle">Dropout</text>
      <text x="580" y="166" fill="#6b6a64" font-size="10" font-family="'JetBrains Mono',monospace" text-anchor="middle">p=0.1</text>
      <text x="110" y="26"  fill="#141413" font-size="11"  font-family="'JetBrains Mono',monospace" text-anchor="middle" font-weight="500">Tokens</text>
      <text x="235" y="26"  fill="#141413" font-size="11"  font-family="'JetBrains Mono',monospace" text-anchor="middle" font-weight="500">Embeddings</text>
      <text x="310" y="17"  fill="#141413" font-size="11"  font-family="'JetBrains Mono',monospace" text-anchor="middle" font-weight="500">MiniLM Encoder</text>
      <text x="310" y="30"  fill="#141413" font-size="9.5" font-family="'JetBrains Mono',monospace" text-anchor="middle">Embed + ×12 Layers</text>
      <text x="525" y="26"  fill="#141413" font-size="11"  font-family="'JetBrains Mono',monospace" text-anchor="middle" font-weight="500">[CLS]</text>
      <text x="635" y="17"  fill="#141413" font-size="11"  font-family="'JetBrains Mono',monospace" text-anchor="middle" font-weight="500">Linear</text>
      <text x="635" y="30"  fill="#141413" font-size="9.5" font-family="'JetBrains Mono',monospace" text-anchor="middle">384→32</text>
      <text x="755" y="26"  fill="#141413" font-size="11"  font-family="'JetBrains Mono',monospace" text-anchor="middle" font-weight="500">Top-K</text>
      <text x="110" y="350" fill="#6b6a64" font-size="10" font-family="'JetBrains Mono',monospace" text-anchor="middle">6 tokens</text>
      <text x="310" y="350" fill="#6b6a64" font-size="10" font-family="'JetBrains Mono',monospace" text-anchor="middle">hidden=384</text>
      <text x="635" y="350" fill="#6b6a64" font-size="10" font-family="'JetBrains Mono',monospace" text-anchor="middle">32 logits total</text>
      <text x="755" y="271" fill="#6b6a64" font-size="10" font-family="'JetBrains Mono',monospace" text-anchor="middle">k=5</text>

      <!-- Legend -->
      <line x1="40" y1="362" x2="800" y2="362" stroke="#DEDED7" stroke-width="0.8"/>
      <text x="40" y="379" fill="#504e49" font-size="9" font-family="'JetBrains Mono',monospace" letter-spacing="0.2em">LEGEND</text>
      <circle cx="130" cy="375" r="6" fill="#E9E8E1" stroke="#6b6a64" stroke-width="0.8"/>
      <text x="141" y="379" fill="#504e49" font-size="10.5" font-family="inherit">Input token</text>
      <circle cx="254" cy="375" r="6" fill="#C5D8EA" stroke="#1B365D" stroke-width="0.8"/>
      <text x="265" y="379" fill="#504e49" font-size="10.5" font-family="inherit">Transformer node</text>
      <circle cx="416" cy="375" r="8" fill="#EEF2F7" stroke="#1B365D" stroke-width="1.5"/>
      <text x="429" y="379" fill="#504e49" font-size="10.5" font-family="inherit">Focal [CLS]</text>
      <circle cx="528" cy="375" r="6" fill="#f0efe8" stroke="#504e49" stroke-width="0.8"/>
      <text x="539" y="379" fill="#504e49" font-size="10.5" font-family="inherit">Classifier logit</text>
      <circle cx="650" cy="375" r="6" fill="#EEF2F7" stroke="#1B365D" stroke-width="0.8"/>
      <text x="661" y="379" fill="#504e49" font-size="10.5" font-family="inherit">Top-K output</text>
    </svg>

    <figcaption class="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
      图 · EmojiClassifier 神经网络结构。从左到右：输入 token → MiniLM Encoder（Embedding 查表 + 12 层 Transformer，蓝框内）→ [CLS] token（汇聚整句信息，蓝色焦点）→ Dropout + Linear 384→32 → Softmax → Top-K emoji 输出。悬停各列可高亮查看说明。
    </figcaption>

    <div ref="tipEl" class="nn-tip" />
  </figure>
</template>

<style>
/* ── Component-level tokens (dark-mode aware) ── */
:root {
  --nn-brand:            var(--vp-c-brand-1);
  --nn-node-transformer: #dce8f7;   /* brand-tinted node fill, light mode */
  --nn-glow-dim:         rgba(52, 81, 178, 0.22);
  --nn-glow-bright:      rgba(52, 81, 178, 0.52);
  --nn-fire-glow:        rgba(52, 81, 178, 0.80);
}
.dark {
  --nn-node-transformer: #1a2d47;   /* brand-tinted node fill, dark mode */
  --nn-glow-dim:         rgba(168, 177, 255, 0.18);
  --nn-glow-bright:      rgba(168, 177, 255, 0.46);
  --nn-fire-glow:        rgba(168, 177, 255, 0.70);
}

/* ── SVG background & dots ── */
.nn-svgbg   { fill: var(--vp-c-bg); }
.nn-svgdots { opacity: 0.28; }
.dark .nn-svgdots { opacity: 0.45; }
.nn-svg pattern circle { fill: var(--vp-c-border); }

/* ── Structural boxes ── */
.nn-svg #nn-minilm-box { fill: var(--vp-c-bg-soft); stroke: var(--nn-brand); }

/* ── Node groups (CSS overrides SVG presentation attributes) ── */
.nn-svg #nn-col1 circle { fill: var(--vp-c-bg-soft);       stroke: var(--vp-c-text-3); }
.nn-svg #nn-col2 circle { fill: var(--vp-c-bg);            stroke: var(--vp-c-text-2); }
.nn-svg #nn-col3 circle { fill: var(--nn-node-transformer); stroke: var(--nn-brand);   }
.nn-svg #nn-col4 circle { fill: var(--vp-c-bg-soft);       stroke: var(--nn-brand);   }
.nn-svg #nn-col5 circle { fill: var(--vp-c-bg-soft);       stroke: var(--vp-c-text-2); }
.nn-svg #nn-col6 circle { fill: var(--vp-c-bg-soft);       stroke: var(--nn-brand);   }

/* ── Connection lines ── */
.nn-svg #nn-lines-1-2 line,
.nn-svg #nn-lines-2-3 line { stroke: var(--vp-c-border); }
.nn-svg #nn-lines-3-4 line,
.nn-svg #nn-lines-4-5 line { stroke: var(--vp-c-border); }
.nn-svg #nn-lines-5-6 line { stroke: var(--vp-c-border); }

/* ── Text (attribute selector overrides SVG presentation attr, lower specificity) ── */
.nn-svg text                { fill: var(--vp-c-text-1); }
.nn-svg text[fill="#1B365D"] { fill: var(--nn-brand);       }
.nn-svg text[fill="#504e49"] { fill: var(--vp-c-text-2);    }
.nn-svg text[fill="#6b6a64"] { fill: var(--vp-c-text-3);    }
.nn-svg text[fill="#141413"] { fill: var(--vp-c-text-1);    }

/* ── Line colors ── */
.nn-svg line[stroke="#B8B7B0"],
.nn-svg line[stroke="#C8C7C0"] { stroke: var(--vp-c-border); }
.nn-svg line[stroke="#1B365D"] { stroke: var(--nn-brand);    }
.nn-svg line[stroke="#DEDED7"] { stroke: var(--vp-c-divider); }

/* ── Legend circles ── */
.nn-svg circle[fill="#E9E8E1"] { fill: var(--vp-c-bg-soft);        stroke: var(--vp-c-text-3); }
.nn-svg circle[fill="#C5D8EA"] { fill: var(--nn-node-transformer);  stroke: var(--nn-brand);   }
.nn-svg circle[fill="#EEF2F7"] { fill: var(--vp-c-bg-soft);        stroke: var(--nn-brand);   }
.nn-svg circle[fill="#f0efe8"] { fill: var(--vp-c-bg-soft);        stroke: var(--vp-c-text-2); }
.nn-svg circle[fill="#faf9f5"] { fill: var(--vp-c-bg);             stroke: var(--vp-c-text-2); }

/* ── Interactive hover states ── */
.nn-col-group { cursor: pointer; }
.nn-col-group circle,
.nn-conn-group line { transition: opacity 0.22s ease, filter 0.22s ease; }
.nn-dim circle  { opacity: 0.1 !important; filter: none !important; }
.nn-dim line    { opacity: 0.05 !important; }
.nn-focus circle { opacity: 1 !important; }
.nn-focus line  {
  opacity: 0.88 !important;
  stroke: var(--nn-brand) !important;
  stroke-width: 1.4px !important;
}

/* ── Animations ── */
@keyframes nn-fire {
  0%   { filter: none; }
  35%  { filter: drop-shadow(0 0 7px var(--nn-fire-glow)) brightness(1.22); }
  100% { filter: none; }
}
.nn-firing circle      { animation: nn-fire 0.72s ease-out forwards; }
circle.nn-firing-single { animation: nn-fire 0.72s ease-out forwards; }

@keyframes cls-glow {
  0%, 100% { filter: drop-shadow(0 0 3px  var(--nn-glow-dim));    }
  50%       { filter: drop-shadow(0 0 10px var(--nn-glow-bright)); }
}
#nn-col4 circle              { animation: cls-glow 2.6s ease-in-out infinite; }
#nn-col4.nn-firing circle    { animation: nn-fire  0.72s ease-out  forwards;  }

@keyframes nn-flow {
  0%   { stroke-dashoffset: 80; opacity: 0.15; }
  25%  { opacity: 0.75; }
  75%  { opacity: 0.75; }
  100% { stroke-dashoffset: 0;  opacity: 0.15; }
}
.nn-flowing line,
line.nn-flowing-line {
  stroke-dasharray: 7 5 !important;
  stroke: var(--nn-brand) !important;
  stroke-width: 1.3px !important;
  animation: nn-flow 0.55s ease-in-out forwards;
}

/* ── Tooltip ── */
.nn-tip {
  position: fixed;
  display: none;
  pointer-events: none;
  z-index: 200;
  background: var(--vp-c-bg);
  border: 1px solid var(--nn-brand);
  border-radius: 5px;
  padding: 7px 11px;
  font-size: 9pt;
  line-height: 1.45;
  color: var(--vp-c-text-1);
  box-shadow: 0 2px 10px rgba(0,0,0,0.10);
  max-width: 210px;
}
.nn-tip strong {
  color: var(--nn-brand);
  font-weight: 500;
  display: block;
  margin-bottom: 2px;
}
</style>
