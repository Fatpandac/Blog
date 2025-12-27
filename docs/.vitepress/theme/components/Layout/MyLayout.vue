<script lang="ts">
const locales = {
    'zh-CN': {
        tags: '标签：',
    },
    'en-US': {
        tags: 'Tags: ',
    }
} as const;
</script>

<script setup lang="ts">
import DefaultTheme, { VPBadge } from "vitepress/theme";
import NavBarTitle from "../Atoms/NavBarTitle.vue";
import { computed } from "vue";
import { useData, useRouter } from "vitepress";
import GiscusComments from "../Atoms/GiscusComments.vue";
import { inject } from "@vercel/analytics"
import { useLang } from "../../Composables/useLang";
const { Layout } = DefaultTheme;
const { site, frontmatter } = useData()
inject();

const router = useRouter();
const currentLang = useLang();

const siteName = computed(() => site.value.title)
const pageTitle = computed(() => frontmatter.value.title || '')
const tags = computed(() => frontmatter.value.tags || [])

function gotoTags(tag: string) {
    const url = `/posts?tags=${encodeURIComponent(tag)}`
    router.go(url)
}
</script>

<template>
    <Layout>
        <template #nav-bar-title-after>
            <NavBarTitle class="w-8 h-8" :title="siteName" />
        </template>
        <template #doc-before>
            <h1 class="text-3xl font-bold mb-4 mt-4">{{ pageTitle }}</h1>
            <div class="mb-8">{{ locales[currentLang].tags }}
                <span v-for="tag in tags" :key="tag" @click="gotoTags(tag)"
                    class="cursor-pointer inline-block mr-4 hover:(underline text-blue-600 underline-dashed) select-none">
                    {{ tag }}
                </span>
            </div>
        </template>
        <template #doc-after>
            <GiscusComments class="mt-8" />
        </template>
    </Layout>
</template>
