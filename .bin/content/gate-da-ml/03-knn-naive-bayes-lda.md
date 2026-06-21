# K-Nearest Neighbours, Naive Bayes, and LDA

Source: GATE-DA Syllabus — Machine Learning

---

## Q1101

[MCQ]

In a KNN classifier with $k = 1$, what is the training error on the training set?

- **(A)** 50%
- **(B)** Equal to the test error
- **(C)** 0%
- **(D)** Undefined

**Answer:** C

---

## Q1102

[NAT]

Consider two points $A = (1, 2)$ and $B = (4, 6)$. Compute the Manhattan distance $d_1(A, B) = \sum_i |A_i - B_i|$.

**Answer:** 7

---

## Q1103

[MCQ]

As $k$ increases in KNN, the decision boundary becomes:

- **(A)** More complex and jagged (high variance)
- **(B)** Smoother and less complex (high bias)
- **(C)** More sensitive to individual training points
- **(D)** Equivalent to a linear decision boundary for any $k$

**Answer:** B

---

## Q1104

[MSQ]

Which of the following are limitations of the KNN algorithm? (Select all that apply)

- **(A)** Prediction is slow at test time because all training examples must be stored
- **(B)** Performance degrades in high-dimensional spaces (curse of dimensionality)
- **(C)** It cannot be applied to multi-class classification problems
- **(D)** Features with large scales can dominate the distance computation

**Answer:** A, B, D

---

## Q1105

[MCQ]

The Naive Bayes classifier assumes that:

- **(A)** All features follow a Gaussian distribution
- **(B)** Features are conditionally independent given the class label
- **(C)** The prior probabilities for all classes are equal
- **(D)** The posterior probability is proportional only to the likelihood

**Answer:** B

---

## Q1106

[NAT]

In a Naive Bayes classifier, the prior for class $C_1$ is $P(C_1) = 0.4$ and the likelihoods are $P(x_1 = 1 | C_1) = 0.6$ and $P(x_2 = 0 | C_1) = 0.5$. Compute the unnormalised posterior score $P(C_1) \cdot P(x_1=1|C_1) \cdot P(x_2=0|C_1)$.

**Answer:** 0.12

---

## Q1107

[MCQ]

Laplace smoothing in Naive Bayes with smoothing parameter $\alpha = 1$ is used to:

- **(A)** Reduce the number of parameters in the model
- **(B)** Avoid zero probabilities for unseen feature-class combinations
- **(C)** Normalise the posterior to sum to one
- **(D)** Replace the Gaussian likelihood with a uniform prior

**Answer:** B

---

## Q1108

[MCQ]

Linear Discriminant Analysis (LDA) finds a projection that maximises:

- **(A)** The total variance of the projected data
- **(B)** The ratio of within-class scatter to between-class scatter
- **(C)** The ratio of between-class scatter to within-class scatter
- **(D)** The Euclidean distance between class centroids only

**Answer:** C

---

## Q1109

[NAT]

LDA with $C = 3$ classes and $d = 10$ original features can produce at most how many discriminant directions (dimensions in the reduced space)?

**Answer:** 2

---

## Q1110

[MSQ]

Which of the following assumptions are made by Linear Discriminant Analysis? (Select all that apply)

- **(A)** Each class follows a Gaussian distribution
- **(B)** All classes share the same covariance matrix
- **(C)** The class prior probabilities must be equal
- **(D)** The features are continuous (real-valued)

**Answer:** A, B

---
