<script setup lang="ts">
import DefaultTheme from "vitepress/theme";
import NavBarTitle from "../Atoms/NavBarTitle.vue";
import { computed } from "vue";
import { useData } from "vitepress";
import GiscusComments from "../Atoms/GiscusComments.vue";
const { Layout } = DefaultTheme;
const { site, frontmatter } = useData()

const siteName = computed(() => {
    return site.value.title
})

const pageTitle = computed(() => {
    return frontmatter.value.title || ''
})
</script>

<template>
    <Layout>
        <template #nav-bar-title-after>
            <NavBarTitle class="w-8 h-8" :title="siteName" />
        </template>
        <template #doc-before>
            <h1 class="text-3xl font-bold mb-8 mt-4">{{ pageTitle }}</h1>
        </template>
        <template #doc-after>
            <GiscusComments class="mt-8" />
        </template>
    </Layout>
</template>
