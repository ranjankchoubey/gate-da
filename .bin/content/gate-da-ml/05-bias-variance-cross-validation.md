# Bias-Variance Tradeoff and Cross-Validation

Source: GATE-DA Syllabus — Machine Learning

---

## Q1301

[MCQ]

The expected test error of a model can be decomposed as:
$$\text{Error} = \text{Bias}^2 + \text{Variance} + \text{Irreducible Noise}$$
A model has $\text{Bias}^2 = 4$, $\text{Variance} = 2$, and noise $\sigma^2 = 1$. What is the expected test MSE?

- **(A)** 4
- **(B)** 6
- **(C)** 7
- **(D)** 8

**Answer:** C

---

## Q1302

[NAT]

A polynomial regression model of degree 1 (linear) fits training data with training MSE = 9 and test MSE = 10. A degree-10 polynomial fits with training MSE = 0.5 and test MSE = 50. The difference in test MSE between the two models is:

**Answer:** 40

---

## Q1303

[MCQ]

A model that performs poorly on both training and test data is most likely suffering from:

- **(A)** High variance (overfitting)
- **(B)** High bias (underfitting)
- **(C)** Data leakage
- **(D)** Class imbalance

**Answer:** B

---

## Q1304

[MSQ]

Which of the following actions are likely to reduce the variance of a model without significantly changing its bias? (Select all that apply)

- **(A)** Increasing the regularisation strength $\lambda$
- **(B)** Increasing the model complexity (e.g., adding more polynomial features)
- **(C)** Collecting more training data
- **(D)** Using ensemble methods such as bagging

**Answer:** A, C, D

---

## Q1305

[MCQ]

In $k$-fold cross-validation with $k = 5$ on a dataset of 100 samples, each validation fold contains how many samples?

- **(A)** 5
- **(B)** 10
- **(C)** 20
- **(D)** 25

**Answer:** C

---

## Q1306

[NAT]

Leave-One-Out Cross-Validation (LOOCV) on a dataset of $n = 50$ samples trains the model how many times?

**Answer:** 50

---

## Q1307

[MCQ]

Compared to 5-fold CV, Leave-One-Out Cross-Validation (LOOCV) generally has:

- **(A)** Higher bias and lower variance
- **(B)** Lower bias and higher variance
- **(C)** Both lower bias and lower variance
- **(D)** Higher bias and higher variance

**Answer:** B

---

## Q1308

[MCQ]

Ridge regression with a large $\lambda$ reduces the test error primarily by:

- **(A)** Eliminating irrelevant features (setting coefficients exactly to zero)
- **(B)** Reducing the model's variance at the cost of some increase in bias
- **(C)** Increasing model complexity to better fit the training data
- **(D)** Replacing gradient descent with a closed-form solution

**Answer:** B

---

## Q1309

[NAT]

A model has training error 0.05 and test error 0.30. The generalisation gap (test error minus training error) is:

**Answer:** 0.25

---

## Q1310

[MSQ]

Which of the following are true about stratified $k$-fold cross-validation? (Select all that apply)

- **(A)** It ensures each fold has approximately the same proportion of class labels as the full dataset
- **(B)** It is especially useful when the dataset is class-imbalanced
- **(C)** It always produces lower variance estimates than standard $k$-fold CV
- **(D)** It is equivalent to standard $k$-fold CV when classes are perfectly balanced

**Answer:** A, B, D

---
