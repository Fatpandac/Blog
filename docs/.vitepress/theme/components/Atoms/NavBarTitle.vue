<script setup>
</script>

<template>
    <svg xmlns="http://www.w3.org/2000/svg" width="371" height="310" fill="none" viewBox="0 0 371 310">
        <path stroke="#000" stroke-linecap="round" stroke-width="10"
            d="M5.5 244.5C33.6667 180.5 136 29 221 5.99997C233.5 1.29695 63 244.5 191.5 299C216 309.391 278.6 316 321 228C345 170 295 133 263 151C226.758 171.386 250 250 366 207" />
    </svg>
</template>

<style scoped>
@media (prefers-reduced-motion) {
  path {
    animation: none !important;
    stroke-dasharray: unset !important;
  }
}
@keyframes grow {
  0% {
    stroke-dashoffset: 1px;
    stroke-dasharray: 0 1500px;
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  40% {
    stroke-dasharray: 1500px 0;
  }
  /* Moving back */
  85% {
    stroke-dasharray: 1500px 0;
  }
  95%, to {
    stroke-dasharray: 0 1500px;
  }
}
path {
  stroke-dashoffset: 1px;
  stroke-dasharray: 1500px 0;
  animation: grow 10s ease forwards infinite;
  transform-origin: center;
  stroke: #303030;
  animation-delay: 0s;
}

html.dark path {
  stroke: #b0b0b0;
}
</style>
