# Ridge Regression and Logistic Regression

Source: GATE-DA Syllabus — Machine Learning

---

## Q1001

[MCQ]

Ridge regression minimises the cost function:
$$J(\beta) = \sum_{i=1}^n (y_i - x_i^\top \beta)^2 + \lambda \|\beta\|_2^2$$
As $\lambda \to \infty$, what happens to the estimated coefficients $\hat{\beta}$?

- **(A)** They converge to the OLS estimates
- **(B)** They all converge to zero
- **(C)** They become sparser (more zeros appear)
- **(D)** The model overfits the training data

**Answer:** B

---

## Q1002

[NAT]

In ridge regression, the closed-form solution is $\hat{\beta} = (X^\top X + \lambda I)^{-1} X^\top y$. Given $X^\top X = \begin{pmatrix} 4 & 0 \\ 0 & 4 \end{pmatrix}$, $X^\top y = \begin{pmatrix} 8 \\ 6 \end{pmatrix}$, and $\lambda = 4$, compute $\hat{\beta}_1$ (the first component).

**Answer:** 1.00

---

## Q1003

[MSQ]

Which of the following are true about Ridge regression compared to OLS? (Select all that apply)

- **(A)** Ridge can be applied even when $X^\top X$ is singular
- **(B)** Ridge always produces sparser solutions than Lasso
- **(C)** Ridge shrinks all coefficients towards zero but rarely sets them exactly to zero
- **(D)** Ridge reduces variance at the cost of introducing bias

**Answer:** A, C, D

---

## Q1004

[MCQ]

The logistic function is $\sigma(z) = \frac{1}{1 + e^{-z}}$. For $z = \theta^\top x = 2.0$, the predicted probability $\hat{p} = \sigma(2)$ is closest to:

- **(A)** 0.500
- **(B)** 0.731
- **(C)** 0.880
- **(D)** 0.950

**Answer:** C

---

## Q1005

[NAT]

In a logistic regression model, $\theta_0 = -1$ and $\theta_1 = 0.5$. The decision boundary (where $P(y=1|x) = 0.5$) is located at $x = ?$

**Answer:** 2.00

---

## Q1006

[MCQ]

The binary cross-entropy loss for a single example is:
$$L = -[y \log \hat{p} + (1-y) \log(1 - \hat{p})]$$
For true label $y = 1$ and predicted probability $\hat{p} = 0.9$, the loss $L$ is closest to:

- **(A)** 0.046
- **(B)** 0.105
- **(C)** 0.223
- **(D)** 0.368

**Answer:** B

---

## Q1007

[MCQ]

Which of the following correctly expresses the log-odds (logit) as a function of the linear predictor in logistic regression?

- **(A)** $\hat{p} = \theta^\top x$
- **(B)** $\log\!\left(\frac{\hat{p}}{1-\hat{p}}\right) = \theta^\top x$
- **(C)** $\log \hat{p} = \theta^\top x$
- **(D)** $\hat{p}^2 = \theta^\top x$

**Answer:** B

---

## Q1008

[NAT]

A logistic regression model outputs $\hat{p} = 0.8$ for a positive example ($y = 1$). Compute the binary cross-entropy loss $L = -\log(\hat{p})$ (rounded to 4 decimal places).

**Answer:** 0.2231

---

## Q1009

[MCQ]

In regularised logistic regression, adding an L1 penalty $\lambda \|\theta\|_1$ to the cross-entropy loss tends to produce:

- **(A)** Smaller but non-zero values for all coefficients
- **(B)** Coefficients that are exactly zero for irrelevant features (sparse solutions)
- **(C)** Overfitting on the training data
- **(D)** A smooth, differentiable objective function everywhere

**Answer:** B

---

## Q1010

[MSQ]

Which of the following statements about logistic regression are correct? (Select all that apply)

- **(A)** The default decision boundary is at $\theta^\top x = 0$ (i.e., $\hat{p} = 0.5$)
- **(B)** Adding polynomial features allows logistic regression to learn non-linear decision boundaries
- **(C)** The cross-entropy loss for logistic regression is a convex function of $\theta$
- **(D)** Logistic regression directly outputs class probabilities without any calibration

**Answer:** A, B, C

---
