<script setup lang="ts">
import { computed } from 'vue'
import { useLang } from '../../Composables/useLang'

const locales = {
  'zh-CN': {
    title: 'catRecap 宠物活动识别与推送架构',
    description: 'Aqara 摄像头通过 RTSP 提供检测流和高清录像。树莓派使用 OpenCV 检测运动并裁切局部画面，交给 YOLO11n 识别猫。猫框内像素变化连续两次满足条件后开始活动事件。活动结束时，ffmpeg 根据起止时间从持续录制的高清录像中裁切活动片段，推送至 Telegram 或 QQ。',
    host: '本地检测 · 持续录制',
    detectionStream: '检测流',
    hdStream: '高清流',
    eventEnd: '活动结束 · 起止时间',
    clip: '活动片段',
    camera: 'Aqara 摄像头',
    motion: '找到画面变化区域',
    crop: '裁切局部画面',
    cat: '确认是猫',
    boundingBox: '输出猫的矩形框',
    activity: '活动判定',
    pixelChanges: '检查猫框内像素变化',
    consecutive: '连续两次满足条件',
    eventStart: '→ 开始活动事件',
    recording: '高清录像',
    fullFrame: '持续录制完整画面',
    trim: '按事件时间裁切',
    video: '视频 / 图像',
    trigger: '事件触发',
    processing: '识别 / 裁切',
    caption: '检测链路只分析发生变化的局部画面；高清录像持续录制。活动结束后，两条链路通过事件时间关联，裁切片段并推送至 IM。',
  },
  'en-US': {
    title: 'catRecap Pet Activity Detection and Notification Architecture',
    description: 'The Aqara camera provides a detection stream and HD video over RTSP. On the Raspberry Pi, OpenCV detects motion and crops changed regions for YOLO11n to identify cats. An activity event starts after pixel changes within the cat bounding box meet the criteria twice in a row. When activity ends, ffmpeg uses the event start and end times to trim a clip from the continuous HD recording and sends it to Telegram or QQ.',
    host: 'Local detection · Continuous recording',
    detectionStream: 'Detect',
    hdStream: 'HD stream',
    eventEnd: 'Event end · time range',
    clip: 'Clip',
    camera: 'Aqara Camera',
    motion: 'Find motion',
    crop: 'Crop regions',
    cat: 'Confirm cat',
    boundingBox: 'Cat bounding box',
    activity: 'Activity',
    pixelChanges: 'Check pixel changes',
    consecutive: '2 consecutive hits',
    eventStart: '→ Start event',
    recording: 'HD recording',
    fullFrame: 'Full-frame video',
    trim: 'Trim by event time',
    video: 'Video / Image',
    trigger: 'Event trigger',
    processing: 'Detection / Clip',
    caption: 'The detection pipeline only analyzes cropped regions with motion, while HD video is recorded continuously. When activity ends, the event timestamps link the two pipelines to trim a clip and send it to IM.',
  },
}

const currentLang = useLang()
const text = computed(() => locales[currentLang.value])
</script>

<template>
  <figure class="cat-recap-diagram not-prose">
    <svg viewBox="0 0 840 690" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="cat-recap-title cat-recap-desc">
      <title id="cat-recap-title">{{ text.title }}</title>
      <desc id="cat-recap-desc">{{ text.description }}</desc>
      <defs>
        <pattern id="cat-recap-dots" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.8" class="dot" />
        </pattern>
        <marker id="cat-recap-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 1 1 L 9 5 L 1 9" fill="none" class="arrow" />
        </marker>
      </defs>

      <rect width="840" height="690" class="background" />
      <rect width="840" height="690" fill="url(#cat-recap-dots)" opacity="0.45" />
      <text x="32" y="40" class="heading">catRecap</text>
      <text x="808" y="40" text-anchor="end" class="label muted">LOCAL EVENT PIPELINE</text>

      <rect x="204" y="88" width="612" height="428" rx="6" class="host" />
      <text x="224" y="118" class="heading brand">Raspberry Pi 4B</text>
      <text x="794" y="118" text-anchor="end" class="label muted">{{ text.host }}</text>

      <g class="connections" marker-end="url(#cat-recap-arrow)">
        <path d="M 176 246 H 224" />
        <path d="M 380 246 H 424" />
        <path d="M 580 246 H 624" />
        <path d="M 176 246 H 192 V 430 H 224" />
        <path d="M 380 430 H 424" />
        <path d="M 710 316 V 350 H 502 V 384" stroke-dasharray="5 5" />
        <path d="M 580 430 H 710 V 552" />
      </g>
      <text x="198" y="230" text-anchor="middle" class="small muted">{{ text.detectionStream }}</text>
      <text x="180" y="362" text-anchor="end" class="small muted">{{ text.hdStream }}</text>
      <text x="606" y="339" text-anchor="middle" class="small brand">{{ text.eventEnd }}</text>
      <text x="724" y="492" class="small muted">{{ text.clip }}</text>

      <rect x="32" y="190" width="144" height="112" rx="6" class="node" />
      <text x="48" y="214" class="label muted">SOURCE</text>
      <text x="104" y="246" text-anchor="middle" class="heading">{{ text.camera }}</text>
      <text x="104" y="276" text-anchor="middle" class="small muted">LAN / RTSP</text>

      <rect x="224" y="180" width="156" height="136" rx="6" class="node" />
      <text x="240" y="204" class="label muted">01 / MOTION</text>
      <text x="302" y="237" text-anchor="middle" class="heading">OpenCV</text>
      <text x="302" y="266" text-anchor="middle" class="body">{{ text.motion }}</text>
      <text x="302" y="290" text-anchor="middle" class="small muted">{{ text.crop }}</text>

      <rect x="424" y="180" width="156" height="136" rx="6" class="node focal" />
      <text x="440" y="204" class="label brand">02 / DETECT</text>
      <text x="502" y="237" text-anchor="middle" class="heading brand">YOLO11n</text>
      <text x="502" y="266" text-anchor="middle" class="body">{{ text.cat }}</text>
      <text x="502" y="290" text-anchor="middle" class="small muted">{{ text.boundingBox }}</text>

      <rect x="624" y="180" width="170" height="136" rx="6" class="node" />
      <text x="640" y="204" class="label muted">03 / EVENT</text>
      <text x="709" y="237" text-anchor="middle" class="heading">{{ text.activity }}</text>
      <text x="709" y="263" text-anchor="middle" class="small">{{ text.pixelChanges }}</text>
      <text x="709" y="286" text-anchor="middle" class="small muted">{{ text.consecutive }}</text>
      <text x="709" y="304" text-anchor="middle" class="small muted">{{ text.eventStart }}</text>

      <rect x="224" y="384" width="156" height="92" rx="6" class="node" />
      <text x="240" y="408" class="label muted">RECORDING</text>
      <text x="302" y="436" text-anchor="middle" class="heading">{{ text.recording }}</text>
      <text x="302" y="460" text-anchor="middle" class="small muted">{{ text.fullFrame }}</text>

      <rect x="424" y="384" width="156" height="92" rx="6" class="node focal" />
      <text x="440" y="408" class="label brand">04 / CLIP</text>
      <text x="502" y="436" text-anchor="middle" class="heading brand">ffmpeg</text>
      <text x="502" y="460" text-anchor="middle" class="small muted">{{ text.trim }}</text>

      <rect x="624" y="552" width="170" height="78" rx="6" class="node" />
      <text x="640" y="576" class="label muted">05 / NOTIFY</text>
      <text x="709" y="604" text-anchor="middle" class="heading">Telegram / QQ</text>

      <line x1="32" y1="650" x2="808" y2="650" class="divider" />
      <text x="32" y="674" class="label muted">LEGEND</text>
      <line x1="118" y1="670" x2="150" y2="670" class="legend-line" />
      <text x="160" y="674" class="small muted">{{ text.video }}</text>
      <line x1="292" y1="670" x2="324" y2="670" class="legend-line" stroke-dasharray="5 5" />
      <text x="334" y="674" class="small muted">{{ text.trigger }}</text>
      <rect x="460" y="663" width="14" height="14" rx="2" class="node focal" />
      <text x="484" y="674" class="small muted">{{ text.processing }}</text>
    </svg>
    <figcaption>{{ text.caption }}</figcaption>
  </figure>
</template>

<style scoped>
.cat-recap-diagram {
  margin: 1.5rem 0;
}

.cat-recap-diagram svg {
  display: block;
  width: 100%;
  height: auto;
  font-family: 'JetBrains Mono', monospace;
}

.background { fill: var(--vp-c-bg); }
.dot { fill: var(--vp-c-border); }
.host { fill: var(--vp-c-bg-soft); stroke: var(--vp-c-brand-1); stroke-width: 1.2; }
.node { fill: var(--vp-c-bg); stroke: var(--vp-c-text-3); stroke-width: 1; }
.focal { fill: var(--vp-c-brand-soft); stroke: var(--vp-c-brand-1); stroke-width: 1.3; }
text { fill: var(--vp-c-text-1); }
.heading { font-size: 17px; font-weight: 500; }
.label { font-size: 11px; letter-spacing: 0.8px; }
.body { font-size: 13px; }
.small { font-size: 12px; }
.muted { fill: var(--vp-c-text-2); }
.brand { fill: var(--vp-c-brand-1); }
.connections { fill: none; stroke: var(--vp-c-brand-1); stroke-width: 1.2; stroke-linejoin: round; }
.arrow { stroke: var(--vp-c-brand-1); stroke-width: 1.2; }
.divider { stroke: var(--vp-c-divider); stroke-width: 0.8; }
.legend-line { stroke: var(--vp-c-brand-1); stroke-width: 1.2; }

.cat-recap-diagram figcaption {
  margin-top: 0.5rem;
  color: var(--vp-c-text-2);
  font-family: var(--vp-font-family-base);
  font-size: 0.875rem;
  line-height: 1.7;
  text-align: center;
}
</style>
