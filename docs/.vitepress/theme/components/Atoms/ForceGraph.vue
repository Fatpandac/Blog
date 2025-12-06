<template>
  <div ref="forceGraph" class="h-87vh w-full"></div>
</template>

<script setup lang="ts">
import ForceGraph, { LinkObject, NodeObject } from 'force-graph';
import type { Post } from '../../data/posts.data';
import { computed, onMounted, ref, watch, watchEffect } from 'vue';
import * as d3 from 'd3-force';
import { useData, useRoute, useRouter } from 'vitepress';
type Node = { id: string; color: string; type: string };

const data = useData();

const props = defineProps<{
  data: Array<Post>;
}>();

const graphData = computed(() => {
  const nodes = new Set<Node>();
  const nodeMap = new Map<string, Node>();
  const links: Array<{ source: string; target: string }> = [];

  props.data.forEach(post => {
    post.tags.forEach(tag => {
      if (!nodeMap.has(tag)) {
        const tagNode = { id: tag, color: '#1f77b4', type: 'tag' };
        nodes.add(tagNode);
        nodeMap.set(tag, tagNode);
      }
    });
    if (!nodeMap.has(post.title)) {
      const postNode = { id: post.title, color: '#ff7f0e', type: 'post' };
      nodes.add(postNode);
      nodeMap.set(post.title, postNode);
    }
    if (!nodeMap.has(post.categories[0])) {
      const categoryNode = { id: post.categories[0], color: '#2ca02c', type: 'category' };
      nodes.add(categoryNode);
      nodeMap.set(post.categories[0], categoryNode);
    }
    for (let i = 0; i < post.tags.length; i++) {
      links.push({ source: post.title, target: post.tags[i] });
      links.push({ source: post.categories[0], target: post.title });
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

onMounted(() => {
  graph.value = new ForceGraph<NodeObject & Node, LinkObject<Node>>(forceGraph.value!)
    .cooldownTicks(100)
    .graphData(graphData.value)
    .d3Force('center', null)
    .onNodeHover((node) => {
      graph.value?.autoPauseRedraw(false);
      hoveredNode.value = node;
    })
    .width(forceGraph.value?.clientWidth || 400)
    .height(forceGraph.value?.clientHeight || 600)
    .d3Force('link', d3.forceLink().distance(50))
    .d3Force('charge', d3.forceManyBody().strength(-200));
});

window.addEventListener('resize', () => {
  if (forceGraph.value && graph.value) {
    graph.value.width(forceGraph.value.clientWidth).height(forceGraph.value.clientHeight).zoomToFit(300);
  }
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
    return 8 + (graphData.value.links.filter(link => (link.source as NodeObject).id === node.id).length) * 0.7;
  } else if (node.type === 'tag') {
    return 3 + (graphData.value.links.filter(link => (link.target as NodeObject).id === node.id).length) * 0.5;
  } else if (node.type === 'category') {
    return 5 + (graphData.value.links.filter(link => (link.source as NodeObject).id === node.id).length) * 0.2;
  }

  return 8;
}
watchEffect(() => {
  if (graph.value) {
    graph.value.graphData(graphData.value)
      .nodeCanvasObject((node, ctx, globalScale) => {
        const hasHovered = hoveredNode.value !== null;
        const isHovered = node.id === hoveredNode.value?.id;
        const label = node.id;
        const isConnected = graph.value!.graphData().links.some(link =>
          ((link.source as NodeObject).id === node.id && (link.target as NodeObject).id === hoveredNode.value?.id) ||
          ((link.target as NodeObject).id === node.id && (link.source as NodeObject).id === hoveredNode.value?.id)
        );

        const r = calcNodeSize(node) / globalScale;
        ctx.fillStyle = hasHovered ? isHovered || isConnected ? node.color : opacity(node.color, 0.4) : node.color;
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, r, 0, 2 * Math.PI, false);
        ctx.fill();

        const fontSize = (isHovered ? 12 : 10) / globalScale;
        const stockColor = data.isDark.value ? "#ffffff" : "#000000";
        ctx.font = `${fontSize}px Sans-Serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = hasHovered ? isHovered || isConnected ? opacity(stockColor, 1) : opacity(stockColor, 0.2) : opacity(stockColor, 0.5);
        ctx.fillText(label, node.x!, node.y! + r + 2);
        graph.value!.autoPauseRedraw(true);
      })
      .linkCanvasObject((link, ctx, globalScale) => {
        const hasHovered = hoveredNode.value !== null;
        const linkColor = "#cccccc";
        const isHovered = ((link.source as NodeObject).id === hoveredNode.value?.id ||
            (link.target as NodeObject).id === hoveredNode.value?.id);
        ctx.strokeStyle = hasHovered ? (isHovered ? '#999999' : opacity(linkColor, 0.2)) : linkColor;
        ctx.lineWidth = 0.5 / globalScale;
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
      .nodePointerAreaPaint((node, color, ctx) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, 8, 0, 2 * Math.PI, false);
        ctx.fill();
      })
  }
});
</script>
