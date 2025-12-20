---
title: Blocking Unfriendly People
date: 2022-03-04
tags:
  - GitHub
  - React
categories:
  - Other
---

> [!info]
> This article was auto-translated using ChatGPT.

Today, I saw many inappropriate comments in issues on the React GitHub repository, which was quite frustrating 💬. Some negative content 💩 even made it overseas...

**_So, I decided to write ✍🏻️ a script to block these individuals._**

<!-- more -->

Thanks to [@sxzz](https://github.com/sxzz) for providing the [data](https://raw.githubusercontent.com/sxzz/github-block-tool/main/analyze.json), which led to the script below 👇🏻:

```python
import requests
import json

github_token = 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
headers = { 'Authorization': 'token ' + github_token }

data_url = 'https://raw.githubusercontent.com/sxzz/github-block-tool/main/analyze.json'
get_data = lambda : json.loads(requests.get(data_url).text)

get_user_name = lambda data: list(map(lambda x: x['username'], data))
block_user = lambda user_name: requests.put(f'https://api.github.com/user/blocks/{user_name}',
                                            headers=headers)

def main():
    user_name = get_user_name(get_data())
    for name in user_name:
        status = block_user(name).status_code
        if (status == 204):
            print(f'@{name} is blocked')
        elif (status == 404):
            print(f'@{name} is not exist')
        elif (status == 422):
            print(f'@{name} is already blocked')
        else:
            print(f'@{name} with status code {status}')

if __name__ == '__main__':
    main()
```

**The following accounts have been blocked. If anyone was blocked by mistake, please [contact me](mailto:i@fatpandac.com?subject=Blocked%20by%20mistake), and I apologize in advance 🙏🏻.**

[File Link](https://gist.github.com/Fatpandac/61b82660e13b9f58d072938c93b3c947#file-blocker-txt)
