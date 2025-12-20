---
title: Removing pip3 Installation Warnings for Brew Python
date: 2022-03-13
tags:
  - brew
  - pip3
  - python3
categories:
  - Tech
---

> [!info]
> This article was auto-translated using ChatGPT.

When using Python3 installed via `brew`, I constantly saw the annoying warning 👇🏻 below when installing libraries with `pip3` 🛑:
![Annoying pip3 warning on brew](/images/kupj1b65xzZSh2q.png)

<!-- more -->

After a quick glance at the suggested issue, I found the following two fix methods:

1.  Continue using Python versions below `3.10`, which requires modifying the `pip` source code as follows:
    [Code to be removed](https://github.com/pypa/pip/blob/ec8edbf5df977bb88e1c777dd44e26664d81e216/src/pip/_internal/locations/__init__.py#L383-L392)

    ```python
    deprecated(
        reason=(
            "Configuring installation scheme with distutils config files "
            "is deprecated and will no longer work in the near future. If you "
            "are using a Homebrew or Linuxbrew Python, please see discussion "
            "at https://github.com/Homebrew/homebrew-core/issues/76621"
        ),
        replacement=None,
        gone_in=None,
    )
    ```

    You only need to delete the above code from the corresponding local file. This method only suppresses ⛔️ the warning output and does not address the root cause.

2.  Switch the `brew` Python version to `3.10` or above.
    Assuming you have `3.9` and `3.10` locally, other scenarios are similar:

    ```shell
    brew unlink python@3.9
    brew unlink python@3.10
    brew link -overwrite python@3.10
    # It might prompt you to add the corresponding path to your environment; just follow the instructions
    fish_add_path /opt/homebrew/opt/python@3.10/bin
    ```

    After completing the above operations, you can switch 🔄 the default Python version for `brew`!
    Let's try installing ⬇️ `rich`:
    ![pip installing rich after switching to python3.10](/images/ZPWnmdzQj1qU72c.png)
    Excellent 👍🏻, no warnings 🛑!
