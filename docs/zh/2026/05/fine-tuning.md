---
title: 微调 MiniLM 模型实现文本转 Emoji
date: 2026-05-31
tags:
  - MiniLM
  - NLP
categories:
  - 技文
---

<script setup>
import EmojiPredictor from '../../../.vitepress/theme/components/Atoms/EmojiPredictor.vue'
import NeuralNetDiagram from '../../../.vitepress/theme/components/Atoms/NeuralNetDiagram.vue'
</script>

我在日常的输入的时候经常使用 Emoji 来表达我的情绪或者一些特定的意思，但是我觉得现在的输入法对于 Emoji 的推荐并不够方便和智能，所以我想要实现一个 **模型** 来根据我输入的文本来推荐合适的 Emoji，这样就可以更方便地使用 Emoji 来表达我的意思了。

<!-- more -->

我调研了一下，最开始我想自己使用一些传统的机器学习方法来实现这个功能，但是这样的话工作量会比较大，而且效果也不一定好，我继续调研最后发现我可以通过使用已经预训练好的 MiniLM 模型来进行微调，这样就可以利用 MiniLM 已经学到的语言知识来更好地理解我的输入文本，从而推荐更合适的 Emoji。

我选择了 Hugging Face 里面的 [Multilingual-MiniLM-L12-H384](https://huggingface.co/microsoft/Multilingual-MiniLM-L12-H384) 作为我的基础模型，因为这个模型已经在多语言的文本上进行了训练，所以它对于不同语言的文本都有比较好的理解能力，这样就可以更好地适应我输入的各种语言的文本了。使用 [vincentclaes/emoji-predictor](https://huggingface.co/datasets/vincentclaes/emoji-predictor) 这个模型的训练数据来进行微调，这个模型的训练数据包含了大量的文本和对应的 Emoji 标签，这样就可以让我的模型学会根据文本来预测合适的 Emoji 了,当然这个数据集是英文的，所以我还需要对数据进行一些预处理来适应多语言的输入。

## 数据预处理

这里要做的就是把原有的英文文本翻译成中文，在 MacOS 上可以使用系统自带的翻译功能，只要编写一个 Swift 脚本来调用系统翻译就可以了，下面是调用系统翻译的主要代码：

```swift
import Foundation
import Translation

let sourceLanguage = Locale.Language(identifier: "en")
let targetLanguage = Locale.Language(identifier: "zh-Hans")

let session = TranslationSession(installedSource: sourceLanguage, target: targetLanguage)

try await session.prepareTranslation()

let textToTranslate = "This is a sample text to be translated."
let response = try await session.translate(textToTranslate)
print("Translated Text: \(response.targetText)")
```

通过这个脚本就可以把英文文本翻译成中文了，之后就可以把翻译后的文本和对应的 Emoji 标签进行配对，形成新的训练数据了。

## 模型微调

接下来就是模型微调了，这里使用 PyTorch 进行微调，模型和数据通过 Hugging Face 的 Transformers 库来加载。

### 模型结构

首先定义模型结构：

```python
class EmojiClassifier(nn.Module):
    def __init__(self, pretrained_model_name, num_classes, dropout=0.1):
        super().__init__()
        self.encoder = AutoModel.from_pretrained(pretrained_model_name)
        hidden_size = self.encoder.config.hidden_size      # 384
        self.dropout = nn.Dropout(dropout)
        self.classifier = nn.Linear(hidden_size, num_classes)

    def forward(self, input_ids, attention_mask):
        outputs = self.encoder(input_ids=input_ids, attention_mask=attention_mask)
        cls = outputs.last_hidden_state[:, 0, :]           # [CLS] token, shape (B, 384)
        return self.classifier(self.dropout(cls))          # shape (B, num_classes)
```

模型由 MiniLM 编码器和线性分类头组成：取最后一层 `[CLS]` token 的 384 维隐层向量作为句子表示，经 Dropout 后映射到 32 维 logits，对应 32 个 Emoji 类别。整体结构如下：

<NeuralNetDiagram />

### 训练

这里使用了 AdamW 优化器和交叉熵损失函数来进行训练。AdamW 对 encoder 和 classifier 分开设置不同的学习率：encoder 已经学到了很多语言知识，只需要用较小的学习率缓慢微调；classifier 是新加的层，学习率可以设置得稍大一些，让它更快地学习如何根据文本预测 Emoji。

```python
def train():
    optimizer = AdamW([
        {'params': model.encoder.parameters(), 'lr': 1e-5},
        {'params': model.classifier.parameters(), 'lr': 1e-4}
    ])
    criterion = nn.CrossEntropyLoss()
    best_top_1_acc = 0.0

    for epoch in range(num_epochs):
        model.train()
        for batch in train_dataloader:
            input_ids = batch['input_ids'].to(device)
            attention_mask = batch['attention_mask'].to(device)
            labels = batch['labels'].to(device)

            outputs = model(input_ids=input_ids, attention_mask=attention_mask)
            loss = criterion(outputs, labels)

            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

        # 每个 epoch 结束后评估，保存最优 checkpoint
        res = evaluate(model, eval_dataloader, device)
        if res[0] > best_top_1_acc:
            best_top_1_acc = res[0]
            torch.save(model.state_dict(), 'best_model.pth')
```

### 评估

这里使用 top-k 准确率来评估模型的性能，因为我们希望模型能够推荐多个合适的 Emoji，而不仅仅是一个，所以 top-k 准确率可以更好地反映模型的推荐能力。

```python
def evaluate(model, eval_dataloader, device):
    model.eval()
    correct_1 = correct_top_k = total = 0
    with torch.no_grad():
        for batch in eval_dataloader:
            input_ids = batch['input_ids'].to(device)
            attention_mask = batch['attention_mask'].to(device)
            labels = batch['labels'].to(device)

            outputs = model(input_ids=input_ids, attention_mask=attention_mask)
            _, predicted = outputs.topk(k=5, dim=1)
            correct_top_k += (predicted == labels.unsqueeze(1)).sum().item()
            correct_1 += (predicted[:, 0] == labels).sum().item()
            total += labels.size(0)

    top_k_acc = correct_top_k / total
    correct_1_acc = correct_1 / total
    print(f'Top-1 Accuracy: {correct_1_acc:.4f}, Top-5 Accuracy: {top_k_acc:.4f}')
    return correct_1_acc, top_k_acc
```

通过以上训练过程，就可以得到一个微调后的 MiniLM 模型，能够根据输入的文本推荐合适的 Emoji 了。

## 在线体验

模型已转换为 ONNX 格式并部署到浏览器，输入文字即可直接体验预测效果：

<ClientOnly>
  <EmojiPredictor />
</ClientOnly>
