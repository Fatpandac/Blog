<template>
  <div ref="forceGraph" class="posts-graph" :aria-busy="!isReady" @dblclick="reflowCategory" @pointermove="movePointer" @pointerleave="focusNode(null)"></div>
</template>

<script setup lang="ts">
import ForceGraph, { LinkObject, NodeObject } from 'force-graph';
import type { Post } from '../../data/posts.data';
import { computed, onMounted, onUnmounted, ref, watch, watchEffect } from 'vue';
import * as d3 from 'd3-force';
import { useData, useRouter } from 'vitepress';
import { isInHoverCorridor, placeGraphLabel, type LabelBox } from '../../utils/graphLabels';
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
// 空白路径保持展开；命中新节点后切换关联布局与高亮。
const hoveredNode = ref<NodeObject & Node | null>(null);
const highlightedNode = ref<NodeObject & Node | null>(null);
const isReady = ref(false);
let needsFit = true;
let labelHitBoxes = new Map<string, LabelBox>();
// 标题位置与字号固定在图谱坐标中，拖动和缩放时不重新排布。
const labelOffsets = new Map<string, { x: number; y: number; width: number; height: number }>();
let labelScale = 1;
const hoverTargets = new Map<string, { x: number; y: number }>();
const hoverPositions = new Map<string, { x: number; y: number }>();
const hoverLabelOffsets = new Map<string, { x: number; y: number; width: number; height: number }>();
let hoverScale = 1;
let hoverAnimating = false;
let previousHoverFrame = 0;
let pointerPosition = { x: 0, y: 0 };
let hoverOrigin: { x: number; y: number } | null = null;

function keepsHoverGroup() {
  const instance = graph.value;
  if (!instance || !hoverOrigin || !hoveredNode.value) return false;
  const scale = instance.zoom();
  const regions: LabelBox[] = [];
  for (const node of instance.graphData().nodes) {
    const target = hoverTargets.get(node.id);
    const offset = hoverLabelOffsets.get(node.id);
    if (!target || !offset) continue;
    for (const position of [displayPosition(node), target]) {
      const point = instance.graph2ScreenCoords(position.x, position.y);
      regions.push({
        left: Math.min(point.x - 14, point.x + offset.x * scale) - 10,
        top: Math.min(point.y - 14, point.y + offset.y * scale) - 10,
        right: Math.max(point.x + 14, point.x + (offset.x + offset.width) * scale) + 10,
        bottom: Math.max(point.y + 14, point.y + (offset.y + offset.height) * scale) + 10,
      });
    }
  }
  if (regions.some(box => pointerPosition.x >= box.left && pointerPosition.x <= box.right && pointerPosition.y >= box.top && pointerPosition.y <= box.bottom)) {
    hoverOrigin = instance.screen2GraphCoords(pointerPosition.x, pointerPosition.y);
    return true;
  }
  const origin = instance.graph2ScreenCoords(hoverOrigin.x, hoverOrigin.y);
  return isInHoverCorridor(pointerPosition, origin, regions);
}

function movePointer(event: PointerEvent) {
  const instance = graph.value;
  if (!instance || !isReady.value) return;
  const bounds = forceGraph.value!.getBoundingClientRect();
  pointerPosition = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  if (event.buttons) {
    focusNode(null);
    return;
  }
  const keepLayout = keepsHoverGroup();
  const target = instance.graphData().nodes.find(node => {
    const position = displayPosition(node);
    const point = instance.graph2ScreenCoords(position.x, position.y);
    const radius = calcNodeSize(node) * Math.min(1, Math.max(0.45, instance.zoom()));
    const box = hoveredNode.value && hoverTargets.has(node.id) ? labelHitBoxes.get(node.id) : undefined;
    return Math.hypot(point.x - pointerPosition.x, point.y - pointerPosition.y) <= radius + 2
      || (box && pointerPosition.x >= box.left && pointerPosition.x <= box.right && pointerPosition.y >= box.top && pointerPosition.y <= box.bottom);
  });
  if (target) focusNode(target);
  else if (!keepLayout) focusNode(null);
  if (target && highlightedNode.value?.id !== target.id) {
    highlightedNode.value = target;
    instance.autoPauseRedraw(false);
  }
}

function displayPosition(node: NodeObject & Node) {
  return hoverPositions.get(node.id) || { x: node.x!, y: node.y! };
}

function updateHoverPositions() {
  const now = performance.now();
  const blend = 1 - Math.exp(-Math.min(50, now - previousHoverFrame) / 180);
  previousHoverFrame = now;
  hoverAnimating = false;
  for (const node of graph.value!.graphData().nodes) {
    const target = hoverTargets.get(node.id) || { x: node.x!, y: node.y! };
    const current = hoverPositions.get(node.id);
    if (!current) continue;
    if (Math.hypot(target.x - current.x, target.y - current.y) * graph.value!.zoom() < 0.2) {
      if (hoverTargets.has(node.id)) hoverPositions.set(node.id, { ...target });
      else hoverPositions.delete(node.id);
      continue;
    }
    current.x += (target.x - current.x) * blend;
    current.y += (target.y - current.y) * blend;
    hoverAnimating = true;
  }
}

function focusNode(node: (NodeObject & Node) | null) {
  if (hoveredNode.value?.id === node?.id) return;
  hoveredNode.value = node;
  highlightedNode.value = node;
  hoverTargets.clear();
  hoverLabelOffsets.clear();
  const instance = graph.value!;
  hoverOrigin = node ? instance.screen2GraphCoords(pointerPosition.x, pointerPosition.y) : null;
  if (node) {
    hoverScale = instance.zoom();
    const ctx = forceGraph.value!.querySelector('canvas')!.getContext('2d')!;
    const position = displayPosition(node);
    hoverPositions.set(node.id, { ...position });
    hoverTargets.set(node.id, { ...position });
    const anchor = instance.graph2ScreenCoords(position.x, position.y);
    const occupied: LabelBox[] = [{ left: anchor.x - 18, top: anchor.y - 18, right: anchor.x + 18, bottom: anchor.y + 18 }];
    const anchorLabel = labelHitBoxes.get(node.id);
    if (anchorLabel) {
      occupied.push(anchorLabel);
      hoverLabelOffsets.set(node.id, {
        x: (anchorLabel.left - anchor.x) / hoverScale, y: (anchorLabel.top - anchor.y) / hoverScale,
        width: (anchorLabel.right - anchorLabel.left) / hoverScale, height: (anchorLabel.bottom - anchorLabel.top) / hoverScale,
      });
    }
    ctx.save();
    ctx.font = '11px system-ui, sans-serif';
    for (const neighbor of instance.graphData().nodes) {
      if (neighbor.id === node.id || !isConnected(neighbor)) continue;
      const position = displayPosition(neighbor);
      const point = instance.graph2ScreenCoords(position.x, position.y);
      ctx.font = neighbor.type === 'category' ? '600 12px system-ui, sans-serif' : '400 11px system-ui, sans-serif';
      const maxWidth = Math.max(40, Math.min(160, (instance.width() - 32) / 2 - 30));
      const width = Math.min(maxWidth, ctx.measureText(neighbor.id).width) + 6;
      const box = placeGraphLabel({ ...point, radius: 16 }, { width: width + 24, height: 32 }, { width: instance.width(), height: instance.height() }, occupied);
      if (!box) continue;
      occupied.push(box);
      const target = instance.screen2GraphCoords(box.left + 8, box.top + 16);
      hoverPositions.set(neighbor.id, { ...position });
      hoverTargets.set(neighbor.id, target);
      const height = neighbor.type === 'category' ? 18 : 16;
      hoverLabelOffsets.set(neighbor.id, { x: 14 / hoverScale, y: -height / 2 / hoverScale, width: width / hoverScale, height: height / hoverScale });
    }
    ctx.restore();
  }
  instance.autoPauseRedraw(false);
}

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
    .onRenderFramePre(updateHoverPositions)
    .onRenderFramePost(drawLabels)
    .onEngineStop(() => {
      if (needsFit) {
        needsFit = false;
        graph.value?.zoomToFit(0, 48);
        resetLabelLayout();
      }
    })
    .nodeLabel(node => {
      const label = document.createElement('span');
      label.textContent = node.id;
      return label;
    })
    .showPointerCursor(node => !!node && 'type' in node && (node.type === 'post' || node.type === 'category'))
    .width(forceGraph.value?.clientWidth || 400)
    .height(forceGraph.value?.clientHeight || 600)
    .d3Force('link', d3.forceLink().distance(70))
    .d3Force('charge', d3.forceManyBody().strength(-160))
    .d3Force('collision', d3.forceCollide(14));
  window.addEventListener('resize', resizeGraph);
});

function reflowCategory(event: MouseEvent) {
  const instance = graph.value;
  if (!instance || !isReady.value) return;
  const bounds = forceGraph.value!.getBoundingClientRect();
  const x = event.clientX - bounds.left;
  const y = event.clientY - bounds.top;
  const category = instance.graphData().nodes.find(node => {
    if (node.type !== 'category') return false;
    const point = instance.graph2ScreenCoords(node.x!, node.y!);
    const box = labelHitBoxes.get(node.id);
    return Math.hypot(point.x - x, point.y - y) <= 15
      || (box && x >= box.left && x <= box.right && y >= box.top && y <= box.bottom);
  });
  if (category) {
    needsFit = true;
    instance.d3ReheatSimulation();
  }
}

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
function isConnected(node: Node, source: (NodeObject & Node) | null = hoveredNode.value) {
  return source !== null && graph.value!.graphData().links.some(link =>
    ((link.source as NodeObject).id === node.id && (link.target as NodeObject).id === source.id) ||
    ((link.target as NodeObject).id === node.id && (link.source as NodeObject).id === source.id)
  );
}

function drawLabels(ctx: CanvasRenderingContext2D) {
  const instance = graph.value!;
  const globalScale = instance.zoom();
  const scaleRatio = globalScale / labelScale;
  const viewport = { width: instance.width(), height: instance.height() };
  const priority = { category: 0, post: 1, tag: 2 };
  const offsets = hoveredNode.value ? hoverLabelOffsets : labelOffsets;
  const projected = instance.graphData().nodes.map(node => {
    const position = displayPosition(node);
    return {
      node,
      point: instance.graph2ScreenCoords(position.x, position.y),
      radius: calcNodeSize(node) * Math.min(1, Math.max(0.45, globalScale)),
    };
  });
  const visible = projected.filter(({ node, point }) => point.x >= 0 && point.x <= viewport.width && point.y >= 0 && point.y <= viewport.height
    && (!hoveredNode.value || node.id === hoveredNode.value.id || hoverTargets.has(node.id)))
    .sort((a, b) => priority[a.node.type] - priority[b.node.type]);
  const occupied = projected.map(({ point, radius }) => ({
    left: point.x - radius - 2, top: point.y - radius - 2,
    right: point.x + radius + 2, bottom: point.y + radius + 2,
  }));
  const cachedBoxes = new Map<string, LabelBox>();
  for (const { node, point } of projected) {
    const cached = offsets.get(node.id);
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
    const focused = node.id === highlightedNode.value?.id || isConnected(node, highlightedNode.value);
    const fontSize = node.type === 'category' ? 12 : 11;
    const fontScale = hoveredNode.value && node.id !== hoveredNode.value.id ? hoverScale : labelScale;
    const font = `${node.type === 'category' ? 600 : 400} ${fontSize / fontScale}px system-ui, sans-serif`;
    ctx.font = font;
    let label = node.id;
    const maxWidth = hoveredNode.value && node.id !== hoveredNode.value.id
      ? (hoverLabelOffsets.get(node.id)?.width || 160 / hoverScale) * hoverScale - 6
      : 160;
    if (ctx.measureText(label).width * fontScale > maxWidth) {
      while (ctx.measureText(label + '…').width * fontScale > maxWidth) label = label.slice(0, -1);
      label += '…';
    }
    const size = { width: ctx.measureText(label).width * globalScale + 6 * scaleRatio, height: (fontSize + 5) * scaleRatio };
    let box = cachedBoxes.get(node.id);
    if (!box) {
      const placedBox = placeGraphLabel({ ...point, radius }, size, viewport, occupied);
      if (!placedBox) continue;
      box = placedBox;
      occupied.push(box);
      offsets.set(node.id, {
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
    const position = displayPosition(node);
    ctx.moveTo(position.x, position.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }
  for (const { node, label, font, box, focused } of placed) {
    const topLeft = instance.screen2GraphCoords(box.left, box.top);
    const text = instance.screen2GraphCoords((box.left + box.right) / 2, box.top + 2 * scaleRatio);
    ctx.globalAlpha = highlightedNode.value && !focused ? 0.4 : 1;
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
  instance.autoPauseRedraw(!hoverAnimating);
  if (!needsFit) isReady.value = true;
}

watchEffect(() => {
  if (graph.value) {
    needsFit = true;
    isReady.value = false;
    resetLabelLayout();
    graph.value.graphData(graphData.value)
      .nodeCanvasObject((node, ctx, globalScale) => {
        const hasHovered = highlightedNode.value !== null;
        const isHovered = node.id === highlightedNode.value?.id;
        const connected = isConnected(node, highlightedNode.value);

        const color = colors.value[node.type];
        const position = displayPosition(node);
        const r = calcNodeSize(node) * Math.min(1, Math.max(0.45, globalScale)) / globalScale;
        ctx.globalAlpha = hasHovered && !isHovered && !connected ? 0.12 : 1;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(position.x, position.y, r, 0, 2 * Math.PI, false);
        ctx.fill();
        if (isHovered) {
          ctx.strokeStyle = opacity(color, 0.4);
          ctx.lineWidth = 2 / globalScale;
          ctx.beginPath();
          ctx.arc(position.x, position.y, r + 4 / globalScale, 0, 2 * Math.PI);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        graph.value!.autoPauseRedraw(true);
      })
      .linkCanvasObject((link, ctx, globalScale) => {
        const hasHovered = highlightedNode.value !== null;
        const linkColor = data.isDark.value ? '#94a3b8' : '#64748b';
        const isHovered = ((link.source as NodeObject).id === highlightedNode.value?.id ||
            (link.target as NodeObject).id === highlightedNode.value?.id);
        ctx.strokeStyle = hasHovered ? (isHovered ? opacity(colors.value.post, 0.85) : opacity(linkColor, 0.04)) : opacity(linkColor, 0.2);
        ctx.lineWidth = (isHovered ? 1.2 : 0.6) / globalScale;
        ctx.beginPath();
        const source = displayPosition(link.source as NodeObject & Node);
        const target = displayPosition(link.target as NodeObject & Node);
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
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
        const position = displayPosition(node);
        ctx.arc(position.x, position.y, Math.max(12, calcNodeSize(node) + 4) / globalScale, 0, 2 * Math.PI, false);
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

.posts-graph[aria-busy="true"] {
  visibility: hidden;
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
