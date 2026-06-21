# Neural Networks and Multi-Layer Perceptron

Source: GATE-DA Syllabus — Machine Learning

---

## Q1401

[MCQ]

A fully connected feedforward neural network has an input layer of 4 neurons, one hidden layer of 5 neurons, and an output layer of 3 neurons (with biases on hidden and output layers). How many trainable parameters does this network have?

- **(A)** 38
- **(B)** 43
- **(C)** 47
- **(D)** 53

**Answer:** B

---

## Q1402

[NAT]

A neural network has: input layer (3 units), hidden layer 1 (4 units, with bias), hidden layer 2 (4 units, with bias), output layer (2 units, with bias). Compute the total number of trainable parameters.

**Answer:** 46

---

## Q1403

[MCQ]

The ReLU activation function is defined as $f(z) = \max(0, z)$. What is $f(-3) + f(2)$?

- **(A)** -1
- **(B)** 0
- **(C)** 2
- **(D)** 5

**Answer:** C

---

## Q1404

[MSQ]

Which of the following are known disadvantages of the sigmoid activation function in deep networks? (Select all that apply)

- **(A)** Its output is bounded in $(0, 1)$, causing vanishing gradients in deep networks
- **(B)** It is not differentiable everywhere
- **(C)** The gradients saturate near $z = 0$ where the derivative is maximal
- **(D)** It is computationally more expensive than ReLU

**Answer:** A, D

---

## Q1405

[MCQ]

During backpropagation, the gradient of the loss with respect to weights in early layers is computed using the chain rule. In a network with sigmoid activations and many layers, these gradients tend to:

- **(A)** Explode (grow exponentially) with network depth
- **(B)** Vanish (shrink towards zero) with network depth
- **(C)** Remain constant regardless of depth
- **(D)** Converge to the Hessian of the loss

**Answer:** B

---

## Q1406

[NAT]

A neural network uses sigmoid activation $\sigma(z) = \frac{1}{1+e^{-z}}$. Compute $\sigma(0)$ (exact value).

**Answer:** 0.5

---

## Q1407

[MCQ]

Stochastic Gradient Descent (SGD) with batch size 1 differs from full-batch gradient descent in that SGD:

- **(A)** Always converges faster to a lower loss
- **(B)** Uses a noisy estimate of the gradient, which can help escape local minima
- **(C)** Requires computing the full Hessian matrix at each step
- **(D)** Produces a deterministic loss trajectory

**Answer:** B

---

## Q1408

[MCQ]

Dropout regularisation in a neural network during training randomly sets neuron activations to zero with probability $p$. At test time, the standard practice is to:

- **(A)** Also apply dropout with probability $p$
- **(B)** Multiply all weights by $(1-p)$ to correct for the expected output
- **(C)** Use all neurons but multiply their outputs by $(1-p)$
- **(D)** Retrain the network without dropout

**Answer:** C

---

## Q1409

[NAT]

An MLP with 2 hidden layers, each of width 8, uses ReLU activations. The input dimension is 10 and the output dimension is 1 (with bias on each layer). Compute the total number of trainable parameters.

**Answer:** 169

---

## Q1410

[MSQ]

Which of the following are true about the Adam optimiser? (Select all that apply)

- **(A)** Adam maintains exponential moving averages of past gradients and past squared gradients
- **(B)** Adam adapts the learning rate for each parameter individually
- **(C)** Adam requires manually tuning per-parameter learning rates
- **(D)** Adam combines the ideas of momentum and RMSProp

**Answer:** A, B, D

---
