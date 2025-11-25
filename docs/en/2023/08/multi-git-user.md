---
title: Providing Different Git Configurations for a Single Folder
date: 2023-08-29
tags:
  - git
categories:
  - Tech Article
---

> [!info]
> This article is auto translated by ChatGPT.

Recently, I had a requirement: due to work needs, the company uses GitLab, while I've always used GitHub. Also, for company repositories, I need to configure the corresponding email and name specific to the company. This means I need to separately configure the email and name for cloned company repositories. Usually, the commands below are used to achieve independent Git configurations for a single repository. However, this solution is a bit cumbersome, because every time we clone a new company project, we have to set these two commands. If you also need to set GPG, that's three commands. With many repositories, it becomes quite tedious and inconvenient.

<!-- more -->

```shell
git config user.name <name>
git config user.email <email>
git config user.signingkey <signingkey>
```

To solve this problem and achieve a "configure once, use forever" setup, you can treat a folder as a storage location for your work repositories. Then, by configuring corresponding conditional statements in `~/.gitconfig`, the appropriate `.gitconfig` configuration will be used when within the work path.

Assuming my work path is `~/work`, to enable using the corresponding `.gitconfig` based on the work path, we can use [includeIf](https://git-scm.com/docs/git-config#_conditional_includes).

First, we need to add the following condition to our `.gitconfig` file in the home directory:

```shell
[includeIf "gitdir:~/work/"]
  path = ~/work/.gitconfig
```

Note: The `gitdir:~/work/` path above must end with a `/`

Then, go back to the `~/work` path and add a `.gitconfig` file. Inside it, write the configuration you want to use for company repositories as follows:

```shell
[user]
	name = <Company Used Name>
	email = <Company Used Email>
	signingkey = <Company Used Signing Key>
[core]
    edit = nvim
    paper = delta
	  editor = nvim
	  autocrlf = input
[commit]
    gpgsign = true
```

After completing the above configuration, you can clone projects into the `~/work` folder. Then, when you enter a project and use `git config --list`, you can check whether the configuration has taken effect.
