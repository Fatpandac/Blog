---
title: Fine-tuning MiniLM for Text-to-Emoji Prediction
date: 2026-05-31
tags:
  - MiniLM
  - NLP
categories:
  - Tech
---

<script setup>
import EmojiPredictor from '../../../.vitepress/theme/components/Atoms/EmojiPredictor.vue'
import NeuralNetDiagram from '../../../.vitepress/theme/components/Atoms/NeuralNetDiagram.vue'
</script>

> [!info]
> This article was auto-translated using Claude.

In my daily typing, I often use Emoji to express my emotions or certain meanings. However, I find that current input methods are not very convenient or smart when it comes to recommending Emoji. So I wanted to build a **model** that recommends appropriate Emoji based on the text I type, making it easier to express myself with Emoji.

After some research, I initially considered using traditional machine learning methods to implement this, but that would involve a lot of work and might not yield great results. I continued researching and eventually found that I could fine-tune the pre-trained MiniLM model, leveraging the language knowledge it has already learned to better understand my input text and recommend more appropriate Emoji.

I chose [Multilingual-MiniLM-L12-H384](https://huggingface.co/microsoft/Multilingual-MiniLM-L12-H384) from Hugging Face as my base model, because it has already been trained on multilingual text and has a good understanding of text in different languages, making it well-suited for the various languages I type. I used the training data from [vincentclaes/emoji-predictor](https://huggingface.co/datasets/vincentclaes/emoji-predictor) for fine-tuning. This dataset contains a large amount of text with corresponding Emoji labels, allowing the model to learn how to predict appropriate Emoji from text. Since this dataset is in English, I also needed to preprocess the data to support multilingual input.

## Data Preprocessing

The goal here is to translate the original English text into Chinese. On macOS, you can use the built-in translation functionality by writing a Swift script to call the system translation API. Here is the main code:

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

Using this script, English text can be translated into Chinese. The translated text is then paired with the corresponding Emoji labels to form new training data.

## Model Fine-tuning

Next comes the model fine-tuning, using PyTorch with the model and data loaded through Hugging Face's Transformers library.

### Model Architecture

First, define the model architecture:

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

The model consists of a MiniLM encoder and a linear classification head: it takes the 384-dimensional hidden vector of the last layer's `[CLS]` token as the sentence representation, applies Dropout, then maps it to 32-dimensional logits corresponding to 32 Emoji categories. The overall architecture is shown below:

<NeuralNetDiagram />

### Training

The AdamW optimizer and cross-entropy loss are used for training. AdamW sets different learning rates for the encoder and classifier: the encoder has already learned substantial language knowledge and only needs a small learning rate for gradual fine-tuning; the classifier is a newly added layer, so a slightly higher learning rate allows it to learn faster how to predict Emoji from text.

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

        # Evaluate after each epoch, save the best checkpoint
        res = evaluate(model, eval_dataloader, device)
        if res[0] > best_top_1_acc:
            best_top_1_acc = res[0]
            torch.save(model.state_dict(), 'best_model.pth')
```

### Evaluation

Top-k accuracy is used to evaluate the model's performance, because we want the model to recommend multiple appropriate Emoji rather than just one. Top-k accuracy better reflects the model's recommendation capability.

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

Through the training process above, we obtain a fine-tuned MiniLM model capable of recommending appropriate Emoji based on input text.

## Live Demo

The model has been converted to ONNX format and deployed in the browser. Enter some text to try the prediction directly:

<ClientOnly>
  <EmojiPredictor />
</ClientOnly>
