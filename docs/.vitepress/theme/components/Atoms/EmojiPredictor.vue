<script setup>
import { ref, shallowRef } from 'vue'

const TRANSFORMERS_CDN =
  'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3/dist/transformers.min.js'
const ORT_CDN =
  'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist/ort.bundle.min.mjs'
const ORT_WASM =
  'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist/'

const id2label = ref({})
const tokenizer = shallowRef(null)
const session = shallowRef(null)
const status = ref('idle') // idle | loading | ready | error
const loadingStep = ref('')
const errorMsg = ref('')
const inputText = ref('')
const results = ref([])
const predicting = ref(false)

const HF_BASE = 'https://huggingface.co/Fatpandac/emojitrans/resolve/main'

async function loadModel() {
  status.value = 'loading'
  try {
    loadingStep.value = '加载标签映射...'
    const res = await fetch(`${HF_BASE}/id2label.json`)
    id2label.value = Object.fromEntries(
      Object.entries(await res.json()).map(([k, v]) => [Number(k), v]),
    )

    const { AutoTokenizer } = await import(/* @vite-ignore */ TRANSFORMERS_CDN)
    loadingStep.value = '加载分词器...'
    tokenizer.value = await AutoTokenizer.from_pretrained('Fatpandac/emojitrans')

    const ort = await import(/* @vite-ignore */ ORT_CDN)
    ort.env.wasm.wasmPaths = ORT_WASM

    loadingStep.value = '加载模型 (~120 MB)...'
    const modelBuffer = await (await fetch(`${HF_BASE}/model_q8.onnx`)).arrayBuffer()
    session.value = await ort.InferenceSession.create(modelBuffer, {
      executionProviders: ['wasm'],
    })

    status.value = 'ready'
  } catch (e) {
    console.error(e)
    errorMsg.value = String(e)
    status.value = 'error'
  }
}

async function predict() {
  if (!tokenizer.value || !session.value || !inputText.value.trim()) return
  predicting.value = true
  try {
    const ort = await import(/* @vite-ignore */ ORT_CDN)
    const encoded = await tokenizer.value(inputText.value.trim(), {
      padding: 'max_length',
      max_length: 128,
      truncation: true,
    })
    const toI64 = (arr) =>
      arr instanceof BigInt64Array ? arr : BigInt64Array.from(arr, (v) => BigInt(v))
    const inputIds = new ort.Tensor('int64', toI64(encoded.input_ids.data), encoded.input_ids.dims)
    const mask = new ort.Tensor(
      'int64',
      toI64(encoded.attention_mask.data),
      encoded.attention_mask.dims,
    )
    const out = await session.value.run({ input_ids: inputIds, attention_mask: mask })
    const logits = Array.from(out.logits.data)
    const maxL = Math.max(...logits)
    const exp = logits.map((x) => Math.exp(x - maxL))
    const sum = exp.reduce((a, b) => a + b, 0)
    const probs = exp.map((x) => x / sum)
    results.value = probs
      .map((p, i) => ({ emoji: id2label.value[i] ?? String(i), prob: p }))
      .sort((a, b) => b.prob - a.prob)
      .slice(0, 5)
  } catch (e) {
    console.error(e)
  } finally {
    predicting.value = false
  }
}
</script>

<template>
  <div class="not-prose border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-5 my-8">
    <!-- header -->
    <div class="flex items-center gap-2 mb-5">
      <span class="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500" />
      <span class="text-xs tracking-widest text-gray-400 dark:text-gray-500 uppercase select-none">
        Demo · Emoji 预测器
      </span>
    </div>

    <!-- idle -->
    <div v-if="status === 'idle'" class="flex flex-col items-center gap-3 py-4">
      <button
        class="px-4 py-1.5 border border-solid border-gray-700 dark:border-gray-200 text-gray-700 dark:text-gray-200 hover:bg-gray-700 dark:hover:bg-gray-200 hover:text-white dark:hover:text-gray-900 text-sm rounded cursor-pointer transition-colors select-none"
        @click="loadModel"
      >
        加载模型
      </button>
      <p class="text-xs text-gray-400 dark:text-gray-500">首次加载约 137 MB，浏览器本地运行</p>
    </div>

    <!-- loading -->
    <div v-else-if="status === 'loading'" class="flex items-center gap-3 py-4 justify-center">
      <svg
        class="animate-spin w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      <p class="text-sm text-gray-500 dark:text-gray-400">{{ loadingStep }}</p>
    </div>

    <!-- error -->
    <div v-else-if="status === 'error'" class="py-4 flex flex-col items-center gap-2">
      <p class="text-xs text-red-400 text-center break-all max-w-full font-mono">{{ errorMsg }}</p>
      <button
        class="text-xs text-gray-500 dark:text-gray-400 underline underline-offset-2 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
        @click="status = 'idle'"
      >
        重试
      </button>
    </div>

    <!-- ready -->
    <div v-else class="flex flex-col gap-4">
      <div class="flex gap-2">
        <input
          v-model="inputText"
          class="flex-1 border-b-2 border-gray-400 dark:border-gray-500 bg-transparent py-1.5 text-sm outline-none focus:border-gray-700 dark:focus:border-gray-200 transition-colors placeholder-gray-400 dark:placeholder-gray-500"
          placeholder="输入文字，按回车预测..."
          @keyup.enter="predict"
        />
        <button
          class="px-3 py-1.5 border border-solid border-gray-700 dark:border-gray-200 text-gray-700 dark:text-gray-200 hover:bg-gray-700 dark:hover:bg-gray-200 hover:text-white dark:hover:text-gray-900 disabled:opacity-30 text-sm rounded cursor-pointer transition-colors select-none"
          :disabled="predicting"
          @click="predict"
        >
          {{ predicting ? '…' : '预测' }}
        </button>
      </div>

      <div v-if="results.length" class="flex flex-col gap-2.5 transition-opacity duration-200" :class="predicting ? 'opacity-40' : 'opacity-100'">
        <div v-for="r in results" :key="r.emoji" class="flex items-center gap-3">
          <span class="text-lg w-6 text-center select-none leading-none">{{ r.emoji }}</span>
          <div class="flex-1 h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              class="h-full bg-gray-600 dark:bg-gray-300 rounded-full transition-all duration-500"
              :style="{ width: `${(r.prob * 100).toFixed(1)}%` }"
            />
          </div>
          <span class="text-xs text-gray-400 dark:text-gray-500 w-10 text-right tabular-nums">
            {{ (r.prob * 100).toFixed(1) }}%
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
