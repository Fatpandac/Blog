import { createContentLoader } from 'vitepress'

export type Post = {
    title: string
    date: string
    description: string
    url: string
    categories: string[]
    tags: string[]
}

declare const data: Record<string, Post[]>
export { data }

export default createContentLoader('./**/*.md', {
    excerpt: "<!-- more -->",
    transform(posts) {
        return posts
            .map(post => ({
                title: post.frontmatter.title,
                date: post.frontmatter.date,
                // remove image and info custom-block
                description: (post.frontmatter.description || post.excerpt)
                .replace(/<img[^>]*>/g, '')
                .replace(/<div\s+class=["']info\s+custom-block\s+.[^>]*["'][^>]*>[\s\S]*?<\/div>/g, '')
                .trim(),
                categories: post.frontmatter.categories,
                tags: post.frontmatter.tags,
                url: post.url.replace('/zh', '')
            }))
            .reduce((acc, post) => {
                const lang = post.url.startsWith('/en/') ? 'en-US' : 'zh-CN'
                if (!acc[lang]) {
                    acc[lang] = []
                }
                if (post.categories && post.tags) {
                    acc[lang].push(post)
                    acc[lang] = acc[lang].sort((a, b) => +new Date(b.date) - +new Date(a.date))
                }
                return acc
            }, {} as Record<string, Post[]>)
    }
})
