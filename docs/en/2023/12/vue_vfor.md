---
title: How Vue 3 Implements v-for
date: 2023-12-05
tags:
  - Vue
categories:
  - Tech Article
---

> [!info]
> This article is auto translated by ChatGPT.

Some time ago, while writing an animation, I accidentally discovered that v-for can directly loop over `Array(8)`. That caught my attention 🤔

<!-- more -->

As usual, when encountering something like this, the first thing to do is check the [source code](https://github.com/vuejs/core/blob/9ea2b868be765ca8b6a766004a3b6dfff03b76d3/packages/runtime-core/src/helpers/renderList.ts#L53C1-L96C2). In Vue 3’s source, we can find the implementation of v-for here:

```ts
export function renderList(
  source: any,
  renderItem: (...args: any[]) => VNodeChild,
  cache?: any[],
  index?: number,
): VNodeChild[] {
  let ret: VNodeChild[];
  const cached = (cache && cache[index!]) as VNode[] | undefined;

  if (isArray(source) || isString(source)) {
    ret = new Array(source.length);
    for (let i = 0, l = source.length; i < l; i++) {
      ret[i] = renderItem(source[i], i, undefined, cached && cached[i]);
    }
  } else if (typeof source === "number") {
    if (__DEV__ && !Number.isInteger(source)) {
      warn(`The v-for range expect an integer value but got ${source}.`);
    }
    ret = new Array(source);
    for (let i = 0; i < source; i++) {
      ret[i] = renderItem(i + 1, i, undefined, cached && cached[i]);
    }
  } else if (isObject(source)) {
    if (source[Symbol.iterator as any]) {
      ret = Array.from(source as Iterable<any>, (item, i) =>
        renderItem(item, i, undefined, cached && cached[i]),
      );
    } else {
      const keys = Object.keys(source);
      ret = new Array(keys.length);
      for (let i = 0, l = keys.length; i < l; i++) {
        const key = keys[i];
        ret[i] = renderItem(source[key], key, i, cached && cached[i]);
      }
    }
  } else {
    ret = [];
  }

  if (cache) {
    cache[index!] = ret;
  }
  return ret;
}
```

Let’s break down the source step by step:

**First**, if the looped value is an array or a string, Vue creates a new array using their length and renders each item into it. This explains why `Array(8)` works with v-for.

**Next**, if the value is a number, v-for can also render it — but only integers (or numbers whose decimal part is 0). Otherwise, `new Array()` won’t work properly, and in development mode Vue will warn:
`The v-for range expect an integer value but got ${source}.`

**Then**, if the value passed to v-for is an object, that also works. Vue will first check whether the object implements an iterator. If it does, it uses `Array.from` to iterate and render items. If not, it will use `Object.keys` to get the keys, then create a new array of equal length and render each item.

So that’s how v-for is implemented. This means v-for supports arrays, strings, objects, integers, and numbers with a zero decimal part.

Therefore, if you simply need to render multiple identical elements, I think the most convenient way is:

```vue
v-for="_ in 8"
```