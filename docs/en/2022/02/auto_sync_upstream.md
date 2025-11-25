---
title: Automatically Sync a Forked Repository with Upstream Using GitHub Actions
date: 2022-02-14
tags:
  - fork repo.
  - GitHub
  - GitHub Action
categories:
  - Tech Article
---

> [!info]
> This article is auto translated by ChatGPT.

A few days ago, I used GitHub Actions to sync a GitHub repository to Gitee.  
Later, I discovered that GitHub Actions can also be applied in many other scenarios.  
The first idea that came to mind was to automatically sync my fork with its upstream repository.  
After some searching 🔍, I found an Action library called [merge-upstream](https://github.com/exions/merge-upstream) created by [exions](https://github.com/exions).  
It’s extremely simple to use and requires only a lightweight setup.

<!-- more -->

Using the open-source project [RSSHub](https://github.com/DIYgod/RSSHub) as an example, I created a scheduled workflow on my own forked repo [RSSHub](https://github.com/Fatpandac/RSSHub).  
I added an Action named [merge-upstream.yml](https://github.com/Fatpandac/RSSHub/blob/action/merge_upstream/.github/workflows/merge-upstream.yml), which automatically syncs with the upstream every day at 7:00 AM.  
This helps me ensure that my routes are always up-to-date and reduces redundant work when developing new routes.

Here are the steps I followed:

- Create a new branch named `action/merge_upstream`.
  - Set this branch as the default branch, because GitHub Actions only run workflows from the default branch.
  - Create a new Action in this branch that syncs code to the `master` branch every morning at 7 AM. 【[How to create an Action](https://docs.github.com/cn/actions/quickstart)】

As a result, every morning at 7:00 🕖 (Beijing time), the workflow automatically runs and syncs with the upstream repository.  
😨 However, one **important caveat**:  
If the upstream repository updates any files under `.github/workflows`, the automatic sync will fail.  
In that case, manual syncing will be required. I haven’t found a workaround yet—this issue remains to be solved 🕳.

You can also add this mechanism to your own open-source projects so contributors can easily sync with your latest code.  
For example, in my project [fuck_cqooc](https://github.com/Fatpandac/fuck_cqooc), the configuration looks like this:

```yaml
name: Scheduled Merge Remote Action

on:
  schedule:
    - cron: "0 23 * * *" # run every hour

env:
  target_branch: ${{ secrets.target_branch && secrets.target_branch || 'master' }}

jobs:
  merge-upstream:
    if: github.repository_owner != 'Fatpandac'
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v2
        with:
          ref: ${{ env.target_branch }} # set the branch to merge to
          fetch-depth: 0

      - name: Merge Upstream ${{ env.target_branch }}
        uses: exions/merge-upstream@v1
        with:
          upstream: Fatpandac/fuck_cqooc # set the upstream repo
          upstream-branch: master # set the upstream branch to merge from
          branch: ${{ env.target_branch }} # set the branch to merge to
```

In lines 7–8, an env block is added to check whether `secrets.target_branch` is set.
This allows syncing to the `master` branch by default, or to a custom target branch if specified in secrets.

Additionally, line 12 includes a condition that ensures the Action only runs in forked repositories.

With this setup, anyone who forks your repository and enables the Action will have their fork automatically updated every morning at 7 AM (Beijing time).