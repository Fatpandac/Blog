<template>
  <div ref="forceGraph" class="posts-graph"></div>
</template>

<script setup lang="ts">
import ForceGraph, { LinkObject, NodeObject } from 'force-graph';
import type { Post } from '../../data/posts.data';
import { computed, onMounted, onUnmounted, ref, watch, watchEffect } from 'vue';
import * as d3 from 'd3-force';
import { useData, useRouter } from 'vitepress';
import { placeGraphLabel, type LabelBox } from '../../utils/graphLabels';
type Node = { id: string; type: 'post' | 'tag' | 'category' };

const data = useData();

const props = defineProps<{
  data: Array<Post>;
}>();

const colors = computed(() => data.isDark.value
  ? { post: '#9b9af5', tag: '#8292a8', category: '#5eead4' }
  : { post: '#6366f1', tag: '#64748b', category: '#0f766e' });

const graphData = computed(() => {
  const nodes = new Set<Node>();
  const nodeMap = new Map<string, Node>();
  const links: Array<{ source: string; target: string }> = [];

  props.data.forEach(post => {
    post.tags.forEach(tag => {
      if (!nodeMap.has(tag)) {
        const tagNode: Node = { id: tag, type: 'tag' };
        nodes.add(tagNode);
        nodeMap.set(tag, tagNode);
      }
    });
    if (!nodeMap.has(post.title)) {
      const postNode: Node = { id: post.title, type: 'post' };
      nodes.add(postNode);
      nodeMap.set(post.title, postNode);
    }
    if (!nodeMap.has(post.categories[0])) {
      const categoryNode: Node = { id: post.categories[0], type: 'category' };
      nodes.add(categoryNode);
      nodeMap.set(post.categories[0], categoryNode);
    }
    links.push({ source: post.categories[0], target: post.title });
    for (let i = 0; i < post.tags.length; i++) {
      links.push({ source: post.title, target: post.tags[i] });
    }
  });

  return {
    nodes: Array.from(nodes),
    links,
  };
})

const router = useRouter();
const forceGraph = ref<HTMLElement | null>(null);
const graph = ref<ForceGraph<NodeObject & Node, LinkObject<Node>> | null>(null);
const hoveredNode = ref<NodeObject & Node | null>(null);
let needsFit = true;
let labelHitBoxes = new Map<string, LabelBox>();
// 标题位置与字号固定在图谱坐标中，拖动和缩放时不重新排布。
const labelOffsets = new Map<string, { x: number; y: number; width: number; height: number }>();
let labelScale = 1;

function resetLabelLayout() {
  labelOffsets.clear();
  labelHitBoxes.clear();
  labelScale = graph.value?.zoom() || 1;
  graph.value?.autoPauseRedraw(false);
}

onMounted(() => {
  graph.value = new ForceGraph<NodeObject & Node, LinkObject<Node>>(forceGraph.value!)
    .warmupTicks(80)
    .cooldownTicks(80)
    .graphData(graphData.value)
    .onRenderFramePost(drawLabels)
    .onEngineStop(() => {
      if (needsFit) {
        needsFit = false;
        graph.value?.zoomToFit(0, 48);
      }
      resetLabelLayout();
    })
    .nodeLabel(node => {
      const label = document.createElement('span');
      label.textContent = node.id;
      return label;
    })
    .showPointerCursor(node => !!node && 'type' in node && node.type === 'post')
    .onNodeHover((node) => {
      graph.value?.autoPauseRedraw(false);
      hoveredNode.value = node;
    })
    .width(forceGraph.value?.clientWidth || 400)
    .height(forceGraph.value?.clientHeight || 600)
    .d3Force('link', d3.forceLink().distance(70))
    .d3Force('charge', d3.forceManyBody().strength(-160))
    .d3Force('collision', d3.forceCollide(14));
  window.addEventListener('resize', resizeGraph);
});

function resizeGraph() {
  if (forceGraph.value && graph.value) {
    graph.value.width(forceGraph.value.clientWidth).height(forceGraph.value.clientHeight).zoomToFit(0, 48);
    resetLabelLayout();
  }
}

onUnmounted(() => {
  window.removeEventListener('resize', resizeGraph);
  graph.value?._destructor();
});

watch(data.isDark, () => {
  if (graph.value) {
    graph.value.autoPauseRedraw(false);
  }
})

function opacity(color: string, opacity: number) {
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// 文章连接的节点越多，节点越大
function calcNodeSize(node: NodeObject & Node) {
  if (node.type === 'post') {
    return 6 + Math.min(2, graphData.value.links.filter(link => (link.source as NodeObject).id === node.id).length * 0.35);
  } else if (node.type === 'tag') {
    return 3 + Math.min(2, graphData.value.links.filter(link => (link.target as NodeObject).id === node.id).length * 0.3);
  } else if (node.type === 'category') {
    return 11;
  }

  return 8;
}
function isConnected(node: Node) {
  return hoveredNode.value !== null && graph.value!.graphData().links.some(link =>
    ((link.source as NodeObject).id === node.id && (link.target as NodeObject).id === hoveredNode.value?.id) ||
    ((link.target as NodeObject).id === node.id && (link.source as NodeObject).id === hoveredNode.value?.id)
  );
}

function drawLabels(ctx: CanvasRenderingContext2D) {
  const instance = graph.value!;
  const globalScale = instance.zoom();
  const scaleRatio = globalScale / labelScale;
  const viewport = { width: instance.width(), height: instance.height() };
  const priority = { category: 0, post: 1, tag: 2 };
  const projected = instance.graphData().nodes.map(node => ({
    node,
    point: instance.graph2ScreenCoords(node.x!, node.y!),
    radius: calcNodeSize(node) * Math.min(1, Math.max(0.45, globalScale)),
  }));
  const visible = projected.filter(({ point }) => point.x >= 0 && point.x <= viewport.width && point.y >= 0 && point.y <= viewport.height)
    .sort((a, b) => priority[a.node.type] - priority[b.node.type]);
  const occupied = projected.map(({ point, radius }) => ({
    left: point.x - radius - 2, top: point.y - radius - 2,
    right: point.x + radius + 2, bottom: point.y + radius + 2,
  }));
  const cachedBoxes = new Map<string, LabelBox>();
  for (const { node, point } of projected) {
    const cached = labelOffsets.get(node.id);
    if (!cached) continue;
    const left = point.x + cached.x * globalScale;
    const top = point.y + cached.y * globalScale;
    const box = { left, top, right: left + cached.width * globalScale, bottom: top + cached.height * globalScale };
    cachedBoxes.set(node.id, box);
    occupied.push(box);
  }
  const placed = [];
  labelHitBoxes = new Map();
  for (const entry of visible) {
    const { node, point, radius } = entry;
    const focused = node.id === hoveredNode.value?.id || isConnected(node);
    if (node.type === 'tag' && !focused && globalScale < 1.1 && calcNodeSize(node) < 4.2) continue;
    const fontSize = node.type === 'category' ? 12 : 11;
    const font = `${node.type === 'category' ? 600 : 400} ${fontSize / labelScale}px system-ui, sans-serif`;
    ctx.font = font;
    let label = node.id;
    if (ctx.measureText(label).width * labelScale > 160) {
      while (ctx.measureText(label + '…').width * labelScale > 160) label = label.slice(0, -1);
      label += '…';
    }
    const size = { width: ctx.measureText(label).width * globalScale + 6 * scaleRatio, height: (fontSize + 5) * scaleRatio };
    let box = cachedBoxes.get(node.id);
    if (!box) {
      const placedBox = placeGraphLabel({ ...point, radius }, size, viewport, occupied);
      if (!placedBox) continue;
      box = placedBox;
      occupied.push(box);
      labelOffsets.set(node.id, {
        x: (box.left - point.x) / globalScale, y: (box.top - point.y) / globalScale,
        width: size.width / globalScale, height: size.height / globalScale,
      });
    }
    labelHitBoxes.set(node.id, box);
    placed.push({ ...entry, label, font, box, focused });
  }
  for (const { node, point, radius, box, focused } of placed) {
    const x = Math.max(box.left, Math.min(point.x, box.right));
    const y = Math.max(box.top, Math.min(point.y, box.bottom));
    if (Math.hypot(point.x - x, point.y - y) <= radius + 8) continue;
    const end = instance.screen2GraphCoords(x, y);
    ctx.strokeStyle = opacity(colors.value[node.type], focused ? 0.7 : 0.3);
    ctx.lineWidth = 0.7 / globalScale;
    ctx.beginPath();
    ctx.moveTo(node.x!, node.y!);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }
  for (const { node, label, font, box, focused } of placed) {
    const topLeft = instance.screen2GraphCoords(box.left, box.top);
    const text = instance.screen2GraphCoords((box.left + box.right) / 2, box.top + 2 * scaleRatio);
    ctx.globalAlpha = hoveredNode.value && !focused ? 0.4 : 1;
    if (node.type === 'post' || focused) {
      ctx.fillStyle = data.isDark.value ? 'rgba(27,27,31,0.92)' : 'rgba(255,255,255,0.94)';
      ctx.fillRect(topLeft.x, topLeft.y, (box.right - box.left) / globalScale, (box.bottom - box.top) / globalScale);
    }
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = node.type === 'category' ? colors.value.category : data.isDark.value ? '#cbd5e1' : '#475569';
    ctx.fillText(label, text.x, text.y);
    ctx.globalAlpha = 1;
  }
  // 同步文字命中区域，避免库的 800ms 缓存把点击映射到旧位置。
  const painter = instance.nodePointerAreaPaint();
  if (painter) instance.nodePointerAreaPaint(painter);
}

watchEffect(() => {
  if (graph.value) {
    needsFit = true;
    resetLabelLayout();
    graph.value.graphData(graphData.value)
      .nodeCanvasObject((node, ctx, globalScale) => {
        const hasHovered = hoveredNode.value !== null;
        const isHovered = node.id === hoveredNode.value?.id;
        const connected = isConnected(node);

        const color = colors.value[node.type];
        const r = calcNodeSize(node) * Math.min(1, Math.max(0.45, globalScale)) / globalScale;
        ctx.globalAlpha = hasHovered && !isHovered && !connected ? 0.12 : 1;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, r, 0, 2 * Math.PI, false);
        ctx.fill();
        if (isHovered) {
          ctx.strokeStyle = opacity(color, 0.4);
          ctx.lineWidth = 2 / globalScale;
          ctx.beginPath();
          ctx.arc(node.x!, node.y!, r + 4 / globalScale, 0, 2 * Math.PI);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        graph.value!.autoPauseRedraw(true);
      })
      .linkCanvasObject((link, ctx, globalScale) => {
        const hasHovered = hoveredNode.value !== null;
        const linkColor = data.isDark.value ? '#94a3b8' : '#64748b';
        const isHovered = ((link.source as NodeObject).id === hoveredNode.value?.id ||
            (link.target as NodeObject).id === hoveredNode.value?.id);
        ctx.strokeStyle = hasHovered ? (isHovered ? opacity(colors.value.post, 0.85) : opacity(linkColor, 0.04)) : opacity(linkColor, 0.2);
        ctx.lineWidth = (isHovered ? 1.2 : 0.6) / globalScale;
        ctx.beginPath();
        ctx.moveTo((link.source as NodeObject).x!, (link.source as NodeObject).y!);
        ctx.lineTo((link.target as NodeObject).x!, (link.target as NodeObject).y!);
        ctx.stroke();
        graph.value!.autoPauseRedraw(true);
      })
      .onNodeClick((node) => {
        const post = props.data.find(p => p.title === node.id);
        if (post) {
          router.go(post.url);
        }
      })
      .nodePointerAreaPaint((node, color, ctx, globalScale) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, Math.max(12, calcNodeSize(node) + 4) / globalScale, 0, 2 * Math.PI, false);
        ctx.fill();
        const box = labelHitBoxes.get(node.id);
        if (box) {
          const point = graph.value!.screen2GraphCoords(box.left, box.top);
          ctx.fillRect(point.x, point.y, (box.right - box.left) / globalScale, (box.bottom - box.top) / globalScale);
        }
      })
  }
});
</script>

<style scoped>
.posts-graph {
  position: fixed;
  inset: calc(var(--vp-nav-height) + var(--vp-layout-top-height, 0px)) 0 0;
}

.posts-graph :deep(.float-tooltip-kap) {
  max-width: min(320px, calc(100vw - 32px));
  padding: 10px 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-elv);
  color: var(--vp-c-text-1);
  font: 13px/1.6 var(--vp-font-family-base);
  overflow-wrap: anywhere;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}
</style>

<style>
html:has(.posts-graph) {
  overflow: hidden;
  scrollbar-gutter: auto;
}
</style>
