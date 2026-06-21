# GATE DA 2026 — Practice Sets

Distraction-free practice sets for GATE Data Science & AI preparation.
Auto-generated from a Markdown question bank, deployed to GitHub Pages.

**Live site:** https://ranjankchoubey.github.io/gate-da/

---

## Courses

| Course | Topics |
|--------|--------|
| `gate-da-prob-stats` | Counting, Probability, Random Variables, Distributions, Statistics, CLT, Hypothesis Testing |
| `gate-da-ml` | Linear Regression, Logistic, KNN, SVM, Trees, Bias-Variance, Neural Nets, Clustering, PCA |

---

## Project Structure

```
content/
  gate-da-prob-stats/
    01-counting-combinatorics.md        ← question bank (## Q001 delimited)
    img/                                ← images referenced in questions
  gate-da-ml/
    01-regression.md
    ...

lectures/
  gate-da-prob-stats/
    01-counting-combinatorics.yaml      ← one file per lecture (sections + Q IDs)
  gate-da-ml/
    01-regression.yaml

scripts/
  parse.py                              ← parses & validates question bank
  generate.py                           ← renders HTML + PDF + QR

templates/
  lecture.html                          ← student web view
  lecture-print.html                    ← PDF print view
  index.html                            ← course listing homepage

docs/                                   ← generated output (GitHub Pages root)
.github/workflows/build.yml             ← CI/CD (push to main → deploy)

EDITING_GUIDE.md                        ← how to add questions & images
```

---

## Adding a Question

Open any file in `content/{course}/` and add:

```markdown
## Q013

[MCQ]

Question text. Math works: $n!$ and $\binom{n}{k}$.

- **(A)** Option A
- **(B)** Option B
- **(C)** Option C
- **(D)** Option D

**Answer:** B

---
```

**Type tags:** `[MCQ]` · `[NAT]` · `[MSQ]`  
**Question IDs:** `Q` + 3 digits, globally unique across ALL content files.

For images: save to `content/{course}/img/filename.png`, reference as `![alt](img/filename.png)`.

See **[EDITING_GUIDE.md](EDITING_GUIDE.md)** for full details.

---

## Adding a Lecture

Create `lectures/{course}/{slug}.yaml`:

```yaml
title: "My Lecture Title"
course: gate-da-prob-stats
slug: 10-my-topic
date: "2026-06-21"

sections:
  - heading: "Section One"
    questions: [Q101, Q102, Q103]
  - heading: "Section Two"
    questions: [Q104, Q105, Q106]
```

> **Never rename `slug`** after publishing — URLs and QR codes will break.

---

## Local Build

```bash
pip install -r requirements.txt
python3 scripts/generate.py
# Preview: open docs/gate-da-prob-stats/lecture/01-counting-combinatorics/index.html
```

PDF generation requires Playwright (runs automatically in CI):
```bash
playwright install chromium
```

---

## CI/CD

Push to `main` → GitHub Actions builds everything → deploys to GitHub Pages.

```bash
git add .
git commit -m "add questions"
git push
```

Site updates at: https://ranjankchoubey.github.io/gate-da/
