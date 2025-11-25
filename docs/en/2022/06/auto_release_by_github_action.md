---
title: Automating Release Publishing with GitHub Actions
date: 2022-06-02
tags:
  - GitHub
  - GitHub Action
categories:
  - Tech Article
---

> [!info]
> This article is auto translated by ChatGPT.

Recently, I've been maintaining my open-source project [fuck_cqooc](https://github.com/Fatpandac/fuck_cqooc), which is a tool for completing online courses on Chongqing University's online platform. After all, as everyone knows, often we don't have enough energy to watch these online courses, and generally, these courses are just tasks to be completed, basically equivalent to reading PPTs with not much difference in quality. Spending time on them doesn't seem very reasonable.

<!-- more -->

But I digress; back to the main topic.

While writing this program, I encountered a problem: every time I updated a version, I would compile an executable file for direct use. Of course, you could also run it directly via Python, but for most of this program's audience, a directly usable program is much better than configuring the environment, installing Python, and executing scripts. So, with each version update, I had to compile Mac and Win versions, and then upload and publish them to Release.

There were some not-so-good things in this process.

> Programmers should learn to resist repetitive or recurring tasks!

As the quote says, we should oppose repetitive work. Such tasks have no significant meaning and consume a lot of time.

For compilation, each compilation command and process is repetitive with almost no differences, and waiting during the compilation process is tedious. So, I had to find a way to eliminate this process.

Another problem was during the upload process. As is well known, due to certain factors, accessing GitHub from within China is very unstable, not to mention uploading files. When releasing version v0.0.2-beta, it took me almost an hour to half an hour to upload a packed Win file. From that moment, I resolved to implement automated publishing.

After some research, I decided to use GitHub Actions, as there are already many complete examples on GitHub, and uploading compiled packages through GitHub itself would also be much faster. So, after multiple attempts, I wrote the following GitHub Action configuration file.

```yaml
name: Release fuckcqooc
on:
  push:
    tags:
      - "**"
  workflow_dispatch:

jobs:
  release:
    runs-on: windows-latest
    outputs:
      upload_url: ${{ steps.create_release.outputs.upload_url }}
    steps:
      - name: Create Release
        id: create_release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GAYHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: 🎉 ${{ github.ref }}
          draft: true
          prerelease: true
  windowsbuild:
    name: build windows
    needs: release
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@master
      - name: Set up Python 3.7
        uses: actions/setup-python@v1
        with:
          python-version: 3.7
      - name: install pyinstaller
        run: |
          pip3 install pyinstaller
      - name: setup env
        run: |
          pip3 install -r requirements.txt
      - name: build app
        run: |
          pyinstaller -F -w fuck_cqooc.pyw
      - name: build package
        run: |
          cd dist && tar -zcvf fuckcqooc_win.tar.gz fuck_cqooc.exe
      - name: upload
        uses: actions/upload-release-asset@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GAYHUB_TOKEN }}
        with:
          upload_url: ${{ needs.release.outputs.upload_url }}
          asset_path: dist/fuckcqooc_win.tar.gz
          asset_name: fuckcqooc_${{ github.ref }}_win.tar.gz
          asset_content_type: application/gzip
  macosbuild:
    name: build macos
    needs: release
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@master
      - name: Set up Python 3.7
        uses: actions/setup-python@v1
        with:
          python-version: 3.7
      - name: install pyinstaller
        run: |
          pip3 install pyinstaller
      - name: setup env
        run: |
          pip3 install -r requirements.txt
      - name: build app
        run: |
          pyinstaller -F -w fuck_cqooc.pyw
      - name: build package
        run: |
          cd dist && tar -zcvf fuckcqooc_macos.tar.gz fuck_cqooc.app
      - name: upload
        uses: actions/upload-release-asset@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GAYHUB_TOKEN }}
        with:
          upload_url: ${{ needs.release.outputs.upload_url }}
          asset_path: dist/fuckcqooc_macos.tar.gz
          asset_name: fuckcqooc_${{ github.ref }}_macos_x86_64.tar.gz
          asset_content_type: application/gzip
```

With the above configuration file, an automated release Action can be implemented. This Action will automatically activate after a `tag` is pushed, compile the program for the respective environment, and create a draft Release. I only need to confirm and modify the content of the Release draft after the Action runs. However, there's still a slight regret: GitHub Actions doesn't yet have a virtual environment for Mac ARM, so it cannot automate the packaging of ARM programs. Once GitHub supports an ARM virtual environment, I only need to copy and modify it for the corresponding environment.
