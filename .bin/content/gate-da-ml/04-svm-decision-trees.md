# Support Vector Machines and Decision Trees

Source: GATE-DA Syllabus — Machine Learning

---

## Q1201

[MCQ]

In a hard-margin SVM, the margin is defined as $\frac{2}{\|w\|}$. If the optimal weight vector has $\|w\| = 4$, what is the margin?

- **(A)** 0.25
- **(B)** 0.50
- **(C)** 1.00
- **(D)** 2.00

**Answer:** B

---

## Q1202

[NAT]

A soft-margin SVM with penalty parameter $C = 1$ is trained. The primal problem includes slack variables $\xi_i \geq 0$. If 3 training points lie within the margin (each with $\xi_i = 0.5$), what is the total penalty term $C \sum_i \xi_i$ added to the objective?

**Answer:** 1.50

---

## Q1203

[MCQ]

Which of the following points are support vectors in a hard-margin SVM?

- **(A)** All training points
- **(B)** Only the points farthest from the decision boundary
- **(C)** Only the points closest to the decision boundary (on the margin hyperplanes)
- **(D)** Points with the largest class-conditional probability

**Answer:** C

---

## Q1204

[MSQ]

Which of the following are true about the kernel trick in SVMs? (Select all that apply)

- **(A)** The RBF kernel implicitly maps inputs to an infinite-dimensional feature space
- **(B)** Kernels allow SVMs to learn non-linear decision boundaries in the original input space
- **(C)** The linear kernel $K(x, z) = x^\top z$ is equivalent to no feature transformation
- **(D)** Using a kernel always reduces training time compared to an explicit feature map

**Answer:** A, B, C

---

## Q1205

[MCQ]

In a soft-margin SVM, increasing the regularisation parameter $C$:

- **(A)** Increases the margin width and allows more misclassifications
- **(B)** Decreases the margin width and penalises misclassifications more strongly
- **(C)** Has no effect on the support vectors
- **(D)** Makes the classifier equivalent to nearest-neighbour

**Answer:** B

---

## Q1206

[NAT]

A binary dataset has 4 examples from two classes. The entropy of the root node is computed as $H = -\sum_k p_k \log_2 p_k$. If 2 examples belong to class 0 and 2 to class 1, what is $H$ (in bits)?

**Answer:** 1.00

---

## Q1207

[MCQ]

The Gini impurity for a node with class probabilities $p_1 = 0.6$ and $p_2 = 0.4$ is:

$$\text{Gini} = 1 - \sum_k p_k^2$$

- **(A)** 0.24
- **(B)** 0.48
- **(C)** 0.50
- **(D)** 0.52

**Answer:** B

---

## Q1208

[MCQ]

Information Gain for a split is defined as:
$$\text{IG} = H(\text{parent}) - \sum_j \frac{N_j}{N} H(\text{child}_j)$$
A root node has entropy $H = 1.0$ bit ($N = 20$). After splitting, child A ($N_A = 12$) has $H_A = 0.5$ and child B ($N_B = 8$) has $H_B = 0.0$. What is the information gain?

- **(A)** 0.30
- **(B)** 0.50
- **(C)** 0.70
- **(D)** 1.00

**Answer:** C

---

## Q1209

[NAT]

A decision tree splits on feature $x_1 \leq 3$. The left child has 6 examples from class 0 and 0 from class 1. What is the Gini impurity of the left child?

**Answer:** 0.00

---

## Q1210

[MSQ]

Which of the following are valid stopping criteria for growing a decision tree? (Select all that apply)

- **(A)** Maximum tree depth has been reached
- **(B)** All examples at a node belong to the same class
- **(C)** The information gain for any possible split is zero
- **(D)** The number of features exceeds the number of samples

**Answer:** A, B, C

---
