<script lang="ts">
const locales = {
  'zh-CN': {
    latestPosts: '最新文章',
    viewAllPosts: '查看所有文章',
    runningStats: '最近跑步数据',
  },
  'en-US': {
    latestPosts: 'Latest Posts',
    viewAllPosts: 'View All Posts',
    runningStats: 'Recent Running Stats',
  }
} as const;
</script>

<script setup lang="ts">
import { useData, useRouter } from "vitepress";
import 'dayjs/locale/zh-cn';
import { data as posts } from '../../data/posts.data';
import { computed } from "vue";
import Running from "../Atoms/Running.vue";
import Section from "../Atoms/Section.vue";
import PostList from "../Atoms/PostList.vue";
import { useLang } from "../../Composables/useLang";

const router = useRouter();
const { page } = useData();

const frontmatter = computed(() => page.value?.frontmatter || {});
const currentLang = useLang();
</script>

<template>
  <div class="flex items-center justify-center flex-col gap-6 text-start">
    <div class="w-full flex items-center justify-center flex-col gap-3 text-center md:(px-20 block gap-6) lg:(px-40)">
      <img class="w-42 h-42 md:(float-left m-2)" :src="frontmatter.hero.avatar" />
      <h1 class="text-4xl font-bold text-left mb-2">{{ frontmatter.hero.title }}</h1>
      <p class="block leading-[1.71]! m-0! text-justify md:(text-start) whitespace-pre-line">
        {{ frontmatter.hero.bio }}
      </p>
    </div>
    <Section>
      <template #title>
        <div class="text-2xl font-bold text-start mb-2">{{ locales[currentLang]?.runningStats }}</div>
      </template>
      <template #content>
        <Running />
      </template>
    </Section>
    <Section>
      <template #title>
        <div class="flex items-baseline justify-between w-full">
          <div class="text-2xl font-bold text-start">
            {{ locales[currentLang]?.latestPosts }}
          </div>
          <div class="flex items-center mb-2 cursor-pointer text-blue-600" @click="router.go(currentLang === 'zh-CN' ? '/posts' : '/en/posts')">
            {{ locales[currentLang]?.viewAllPosts }}
            <div class="i-solar:alt-arrow-right-line-duotone inline-block ml-1" />
          </div>
        </div>
      </template>
      <template #content>
        <PostList :posts="posts[currentLang]?.slice(0, 10)" />
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