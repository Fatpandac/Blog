<script setup lang="ts">
import { useData, useRouter } from "vitepress";
import { VPBadge } from 'vitepress/theme'
import 'dayjs/locale/zh-cn';
import dayjs from 'dayjs';
import { data as posts } from '../../data/posts.data';
import { computed } from "vue";
import Running from "../Atoms/Running.vue";
import Section from "../Atoms/Section.vue";
import PostList from "../Atoms/PostList.vue";


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
    <Section>
      <template #title>
        <div class="text-2xl font-bold text-start mb-2">Recent Running Stats</div>
      </template>
      <template #content>
        <Running />
      </template>
    </Section>
    <Section>
      <template #title>
        <div class="flex items-baseline justify-between w-full">
          <div class="text-2xl font-bold text-start">
            Recent Posts
          </div>
          <div class="flex items-center mb-2 cursor-pointer text-blue-600" @click="router.go('/posts')">
            View All Posts
            <div class="i-solar:alt-arrow-right-line-duotone inline-block ml-1" />
          </div>
        </div>
      </template>
      <template #content>
        <PostList :posts="posts.slice(0, 10)" />
      </template>
    </Section>
  </div>
</template>

<style>
.VPHome {
  .VPHomeHero {
    padding: 3rem;
  }
}
</style>