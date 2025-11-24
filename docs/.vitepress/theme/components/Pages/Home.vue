<script setup lang="ts">
import { useData, useRouter } from "vitepress";
import { VPBadge } from 'vitepress/theme'
import 'dayjs/locale/zh-cn';
import dayjs from 'dayjs';
import { data as posts } from '../../data/posts.data';
import { computed } from "vue";
import Running from "../Atoms/Running.vue";


const router = useRouter();
const { site, page } = useData();

const currentLang = computed(() => site.value?.lang || 'en');
const frontmatter = computed(() => page.value?.frontmatter || {});

</script>

<template>
  <div class="flex items-center justify-center flex-col gap-6 text-start">
    <div
      class="w-full flex items-center justify-center flex-col gap-6 text-center md:(flex-row px-20 gap-12 justify-start) lg:(px-40)">
      <img class="w-40 h-40" :src="frontmatter.hero.avatar" />
      <div class="md:h-40 flex flex-col gap-4 items-center md:items-start">
        <h1 class="text-4xl font-bold">{{ frontmatter.hero.title }}</h1>
        <p class="block align-start text-balance md:(text-start)">
          {{ frontmatter.hero.subtitle }}
        </p>
      </div>
    </div>
    <Running />
    <div class="flex items-baseline justify-between w-full md:px-20 lg:px-40">
      <div class="text-2xl font-bold text-start">
        Recent Posts
      </div>
      <div class="flex items-center mb-2 cursor-pointer text-blue-600" @click="router.go('/posts')">
        View All Posts
        <div class="i-solar:alt-arrow-right-line-duotone inline-block ml-1" />
      </div>
    </div>
    <section class="w-full">
      <ul class="w-full p-0! m-0! list-none!">
        <li v-for="post in posts.slice(0, 10)" :key="post.url" @click="router.go(post.url)"
          class="p-2 cursor-pointer md:(flex items-center justify-center mb-4 mx-20) lg:(mx-40) hover:(text-blue-600 bg-blue-50 rounded dark:(bg-gray-800 text-blue-400))">
          <v-p-badge :text="post.categories.at(0)" type="info"
            class="mr-2 bg-blue-100 dark:bg-gray-700 translate-y-0" />
          <span class="inline-block align-middle flex-1 line-clamp-1">{{ post.title }}</span>
          <span class="block lg:inline text-gray-600 text-sm mt-1 text-right md:(mt-0)">{{
            dayjs(post.date).locale(currentLang).format('MMMM D, YYYY') }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>