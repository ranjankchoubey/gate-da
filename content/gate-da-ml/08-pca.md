# Principal Component Analysis and Dimensionality Reduction

Source: GATE-DA Syllabus — Machine Learning

---

## Q1601

[MCQ]

Principal Component Analysis (PCA) finds a set of orthogonal directions that:

- **(A)** Minimise the total variance in the projected data
- **(B)** Maximise the variance of the data in the projected subspace
- **(C)** Maximise the covariance between original and projected variables
- **(D)** Minimise the correlation between the original features

**Answer:** B

---

## Q1602

[NAT]

The covariance matrix of a zero-mean dataset is $\Sigma = \begin{pmatrix} 4 & 0 \\ 0 & 1 \end{pmatrix}$. The explained variance ratio of the first principal component (the one with the largest eigenvalue) is:

**Answer:** 0.80

---

## Q1603

[MCQ]

Before applying PCA, data should typically be standardised (zero mean, unit variance). The main reason is:

- **(A)** PCA requires all eigenvalues to be equal
- **(B)** Features with larger scales would otherwise dominate the principal components
- **(C)** Standardisation increases the explained variance of the first component
- **(D)** PCA cannot be applied to data with negative values

**Answer:** B

---

## Q1604

[MSQ]

Which of the following are true about PCA? (Select all that apply)

- **(A)** Principal components are the eigenvectors of the data covariance matrix
- **(B)** PCA is a supervised dimensionality reduction technique
- **(C)** The principal components are mutually orthogonal
- **(D)** PCA finds linear combinations of the original features

**Answer:** A, C, D

---

## Q1605

[MCQ]

A dataset has 5 features. After PCA, the eigenvalues of the covariance matrix are $\lambda = [5, 3, 1, 0.5, 0.5]$. What is the cumulative explained variance ratio when the top 2 components are retained?

- **(A)** 0.50
- **(B)** 0.70
- **(C)** 0.80
- **(D)** 0.90

**Answer:** C

---

## Q1606

[NAT]

A dataset has 3 features with eigenvalues $[6, 3, 1]$. What is the explained variance ratio of the second principal component (rounded to 4 decimal places)?

**Answer:** 0.3000

---

## Q1607

[MCQ]

A scree plot is used in PCA to:

- **(A)** Display the cumulative distribution of data points
- **(B)** Plot eigenvalues in descending order to help choose the number of components
- **(C)** Show the correlation between original features and the first PC
- **(D)** Plot the reconstruction error as a function of regularisation strength

**Answer:** B

---

## Q1608

[MCQ]

The reconstruction error in PCA when projecting onto $k$ components and reconstructing back to the original space equals:

- **(A)** The sum of the $k$ largest eigenvalues
- **(B)** The sum of the $(d-k)$ smallest eigenvalues
- **(C)** The trace of the full covariance matrix
- **(D)** Zero, because PCA is a lossless transformation

**Answer:** B

---

## Q1609

[NAT]

A $100 \times 20$ data matrix (100 samples, 20 features) is projected onto the top 5 PCA components. What is the dimensionality of the projected data matrix?

**Answer:** 5

---

## Q1610

[MSQ]

Which of the following are known limitations of PCA? (Select all that apply)

- **(A)** PCA only captures linear structure; it cannot represent non-linear manifolds
- **(B)** PCA is sensitive to the scale of features if the data is not standardised
- **(C)** PCA maximises class separability, making it ideal for supervised tasks
- **(D)** The principal components may not be interpretable in the original feature space

**Answer:** A, B, D

---
