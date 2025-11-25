---
title: Sync GitHub Repository to Gitee via GitHub Action
date: 2022-02-10
tags:
  - GitHub
  - GitHub Action
  - CI/CD
categories:
  - Tech Article
---

> [!info]
> This article is auto translated by ChatGPT.

Today, I suddenly came across an [article](https://gyx8899.gitbook.io/blog/share/syncgithubtogitee) on [@gyx8899](https://github.com/gyx8899)'s [Blog](https://gyx8899.gitbook.io) about how to use GitHub Actions to automatically sync a GitHub repository to Gitee 🔃.

<!-- more -->

After reading the article and implementing it in my [fuck_cqooc](https://github.com/Fatpandac/fuck_cqooc) and [Homework](https://github.com/Fatpandac/Homework) repositories, I started to feel something special, like the feeling of seeing a beautiful girl. Perhaps from the moment it successfully synced my GitHub repository to my corresponding Gitee repository, I fell in love with it! 😍
Later, I'll explore the official GitHub Actions documentation 📃 and play around with some interesting Actions.

Below is a brief record of [@gyx8899](https://github.com/gyx8899)'s GitHub Action usage method:

* Set up GitHub repository Secrets 🔑
  * `GITEE_USER`: The ID of the repository owner.
  * `GITEE_PRIVATE_KEY`: The private key corresponding to the Gitee public key. [Configuration method](https://gitee.com/help/articles/4181).
  * `GITEE_TOKEN`: [Get link](https://gitee.com/profile/personal_access_tokens).
* Copy the code below into `.github/workflows/[action-file-name].yml` in the corresponding repository. Note that the current branch must be the default branch of the remote repository.
* Push to the remote GitHub repository.

```yaml
name: sync -> gitee
on:
  push:
    branches:
      - main
jobs:
  repo-sync:
    env:
      dst_key: ${{ secrets.GITEE_PRIVATE_KEY }}
      dst_token: ${{ secrets.GITEE_TOKEN }}
      gitee_user: ${{ secrets.GITEE_USER }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
        with:
          persist-credentials: false

      - name: sync github -> gitee
        uses: Yikun/hub-mirror-action@master
        if: env.dst_key && env.dst_token && env.gitee_user
        with:
          src: "github/${{ github.repository_owner }}"
          dst: "gitee/${{ secrets.GITEE_USER }}"
          dst_key: ${{ secrets.GITEE_PRIVATE_KEY }}
          dst_token: ${{ secrets.GITEE_TOKEN }}
          static_list: ${{ github.event.repository.name }}
```
