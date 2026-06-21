# Clustering — K-Means and Hierarchical

Source: GATE-DA Syllabus — Machine Learning

---

## Q1501

[MCQ]

The k-means algorithm minimises the Within-Cluster Sum of Squares (WCSS):
$$J = \sum_{k=1}^K \sum_{x \in C_k} \|x - \mu_k\|^2$$
Which of the following is NOT a step in Lloyd's algorithm?

- **(A)** Randomly initialise $K$ cluster centroids
- **(B)** Assign each point to the nearest centroid
- **(C)** Recompute centroids as the mean of assigned points
- **(D)** Compute the eigendecomposition of the data covariance matrix

**Answer:** D

---

## Q1502

[NAT]

Three points in 1D: $x_1 = 1$, $x_2 = 3$, $x_3 = 7$. Initially, centroids are $\mu_1 = 1$ and $\mu_2 = 3$. After one iteration of k-means assignment and update, what is the new value of $\mu_2$?

**Answer:** 5.00

---

## Q1503

[MCQ]

K-means clustering is sensitive to initialisation because:

- **(A)** Different initialisations can lead to different local optima of the WCSS objective
- **(B)** The algorithm is non-deterministic by design
- **(C)** The WCSS objective is not differentiable
- **(D)** Centroids must be initialised to actual data points

**Answer:** A

---

## Q1504

[MSQ]

Which of the following are valid limitations of k-means clustering? (Select all that apply)

- **(A)** It assumes clusters are spherical and of roughly equal size
- **(B)** It requires the number of clusters $K$ to be specified in advance
- **(C)** It is guaranteed to find the global minimum of WCSS
- **(D)** It is sensitive to outliers because centroids are based on means

**Answer:** A, B, D

---

## Q1505

[MCQ]

In single-linkage hierarchical clustering, the distance between two clusters $A$ and $B$ is defined as:

- **(A)** The distance between the farthest pair of points across the two clusters
- **(B)** The distance between the centroids of the two clusters
- **(C)** The distance between the closest pair of points across the two clusters
- **(D)** The average distance between all pairs of points across the two clusters

**Answer:** C

---

## Q1506

[NAT]

In complete-linkage hierarchical agglomerative clustering on 4 points, how many merging steps are performed before all points are in a single cluster?

**Answer:** 3

---

## Q1507

[MCQ]

The silhouette score for a single data point is defined as:
$$s = \frac{b - a}{\max(a, b)}$$
where $a$ is the mean intra-cluster distance and $b$ is the mean nearest-cluster distance. A silhouette score close to $+1$ indicates:

- **(A)** The point is near the boundary between two clusters
- **(B)** The point is well-matched to its own cluster and poorly matched to neighbouring clusters
- **(C)** The point is misclassified into the wrong cluster
- **(D)** The clusters are poorly separated

**Answer:** B

---

## Q1508

[MCQ]

The Elbow Method for selecting the optimal $K$ in k-means involves:

- **(A)** Choosing $K$ where the silhouette score is minimised
- **(B)** Choosing $K$ at the "elbow" where the rate of decrease in WCSS slows down sharply
- **(C)** Choosing $K = \sqrt{n/2}$ as a rule of thumb
- **(D)** Plotting the dendrogram and cutting at a fixed height

**Answer:** B

---

## Q1509

[NAT]

A clustering result has $a = 0.4$ (mean intra-cluster distance) and $b = 1.2$ (mean nearest-cluster distance) for a point. Compute the silhouette score $s = \frac{b - a}{\max(a, b)}$.

**Answer:** 0.6667

---

## Q1510

[MSQ]

Which of the following correctly distinguish agglomerative from divisive hierarchical clustering? (Select all that apply)

- **(A)** Agglomerative starts with each point as its own cluster and merges iteratively
- **(B)** Divisive starts with all points in one cluster and splits iteratively
- **(C)** Both methods require $K$ to be specified before the algorithm starts
- **(D)** Agglomerative clustering is more commonly used in practice

**Answer:** A, B, D

---
