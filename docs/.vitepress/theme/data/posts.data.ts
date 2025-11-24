import { createContentLoader } from 'vitepress'

export type Post = {
    title: string
    date: string
    description: string
    url: string
    categories: string[]
    tags: string[]
}

declare const data: Post[]
export { data }

export default createContentLoader('blog/**/*.md', {
    excerpt: true,
    transform(posts) {
        return posts
            .map(post => ({
                title: post.frontmatter.title,
                date: post.frontmatter.date,
                description: post.frontmatter.description || post.excerpt,
                categories: post.frontmatter.categories,
                tags: post.frontmatter.tags,
                url: post.url
            }))
            .sort((a, b) => +new Date(b.date) - +new Date(a.date))
    }
})
