# Counting and Combinatorics

Source: Rosen Book 

## Section 1 : Product Rule
---

## Q001

[MCQ]

A new company with just two employees, Sanchez and Patel, rents a floor of a building with 12 offices. How many ways are there to assign diﬀerent offices to these two employees?

- **(A)** $12$
- **(B)** $12 + 11$
- **(C)** $12 * 11$
- **(D)** $12^2$

**Answer:** C

---

## Q002

[MCQ]

The chairs of an auditorium are to be labeled with an uppercase English letter followed by a positive integer not exceeding 100. What is the largest number of chairs that can be labeled diﬀerently?

- **(A)** $26 + 100$
- **(B)** $26 * 100$
- **(C)** $26^{100}$
- **(D)** $100^{26}$

**Answer:** B

---


## Q003

[MCQ]

There are 32 computers in a data center in the cloud. Each of these computers has 24 ports. How many diﬀerent computer ports are there in this data center?

- **(A)** $32 + 24$
- **(B)** $32 * 24$
- **(C)** $32^{24}$
- **(D)** $24^{32}$

**Answer:** B

---
## Q004

[NAT]

How many diﬀerent bit strings of length seven are there?

**Answer:** $2^7$

---
## Q005

[MCQ]

How many diﬀerent license plates can be made if each plate contains a sequence of three uppercase English letters followed by three digits (and no sequences of letters are prohibited, even if they are obscene)?

- **(A)** $26 + 26 + 26 + 10 + 10 + 10$
- **(B)** $26 * 3 * 10 * 3$
- **(C)** $26^3 * 10^3$
- **(D)** $(26 * 10)^3$

**Answer:** C

---
## Q006

[NAT]

**Counting Functions :** How many functions are there from a set with m elements to a set with n elements?

**Answer:** $n^m$

---
## Q007

[NAT]

**Counting One-to-One Functions :** How many one-to-one functions are there from a set with m elements to one with n elements? Assume m<=n

**Answer:** $n (n-1)(n- 2)⋯ (n- m + 1)$

---
## Q008

[NAT]

What is the value of $k$ after the following code, where $n1, n2, … , nm$ are positive integers, has been executed?
![q008-code](img/q008-code.png)

**Answer:** $n1 * n2 * n3 ⋯ * nm$

---
## Q009

[MCQ]

**Counting Subsets of a Finite Set :** How many number of diﬀerent subsets of a finite set $S$.

- **(A)** \({|S|}*{|S|}\)
- **(B)** \({|S|}\)
- **(C)** \(2*{|S|}\)
- **(D)** \(2^{|S|}\)

**Answer:** D

---

## Section 2 : Sum Rule

## Q010

[MCQ]

Suppose that either a member of the mathematics faculty or a student who is a mathematics major is chosen as a representative to a university committee. How many diﬀerent choices are there for this representative if there are 37 members of the mathematics faculty and 83 mathematics majors and no one is both a faculty member and a student?

- **(A)** $37 + 83$
- **(B)** $37 * 83$
- **(C)** $83 - 37$
- **(D)** $37^{83}$

**Answer:** A

---
## Q011

[MCQ]

A student can choose a computer project from one of three lists. The three lists contain 23, 15, and 19 possible projects, respectively. No project is on more than one list. How many possible projects are there to choose from?

- **(A)** $23 * 15 * 19$
- **(B)** $23^{15+19}$
- **(C)** $23 + 15 * 19$
- **(D)** $23 + 15 + 19$

**Answer:** D

---
## Q012

[NAT]

What is the value of k after the following code, where n1, n2, … , nm are positive integers, has been executed?
![q012-code](img/q012-code.png)

**Answer:** $n1 + n2 +⋯ + nm$

---

## Section 3 : Sum Rule and Product Rule



## Q013

[MCQ]

In a version of the computer language BASIC, the name of a variable is a string of one or two alphanumeric characters, where uppercase and lowercase letters are not distinguished. (An alphanumeric character is either one of the 26 English letters or one of the 10 digits.) Moreover, a variable name must begin with a letter and must be different from the five strings of two characters that are reserved for programming use. How many different variable names are there in this version of BASIC?

- **(A)** $26 + 36^2$
- **(B)** $26 + 26 * 36 - 5$
- **(C)** $26 * 36 + 26^2$
- **(D)** $26 + 931$

**Answer:** D

---

## Q014

[NAT]

Each user on a computer system has a password, which is six to eight characters long, where each character is an uppercase letter or a digit. Each password must contain at least one digit. How many possible passwords are there?

**Answer:** $(36^6-26^6) + (36^7 - 26^7) + (36^8 - 26^8) = 2,684,483,063,360$

---
## Q015

[NAT]

**Counting Internet Addresses:** How many diﬀerent IPv4 addresses are available for computers on the Internet?

Three forms of addresses are used, with diﬀerent numbers of bits used for netids and hostids.
**Class A addresses**, used for the largest networks, consist of 0, followed by a 7-bit netid and a 24-bit hostid. 
**Class B addresses**, used for medium-sized networks, consist of 10, followed by a 14-bit netid and a 16-bit hostid. 
**Class C addresses**, used for the smallest networks, consist of 110, followed by a 21-bit netid and an 8-bit hostid. 

There are several restrictions on addresses because of **special uses**: 1111111 is not available as the netid of a **Class A network**, and the hostids consisting of all 0s and all 1s are not available for use in **any network**.


**Class D addresses** reserved for use in multicasting when multiple computers are addressed at a single time, consisting of 1110 followed by 28 bits.

**Class E addresses** reserved for future use, consisting of 11110 followed by 27 bits. 

**NOTE :** Neither Class D nor Class E addresses are assigned as the IPv4 address of a computer on the Internet. 



![q015-ip](img/q015-ip.png)

**Answer:** $(2^7 - 1)\cdot(2^{24} - 2) + 2^{14}\cdot(2^{16} - 2) + 2^{21}\cdot(2^8 - 2) = 3,737,091,842$

---

## Section 3 : Subtraction Rule

## Q016

[NAT]

How many bit strings of length eight either start with a 1 bit or end with the two bits 00?

**Answer:** $2^7 + 2^6 - 2^5 = 160$

---

## Q017

[MCQ]

A computer company receives 350 applications from college graduates for a job planning a line of new web servers. Suppose that 220 of these applicants majored in computer science, 147 majored in business, and 51 majored both in computer science and in business. How many of these applicants majored neither in computer science nor in business?

- **(A)** 17
- **(B)** 68
- **(C)** 51
- **(D)** 34

**Answer:** D

---

## Section 4 : Division Rule

## Q018

[NAT]

How many diﬀerent ways are there to seat four people around a circular table, where two seatings are considered the same when each person has the same left neighbor and the same right
neighbor?

**Answer:** 24/4 = 6

---


## Section 5 : Tree Diagrams

## Q019

[MCQ]

How many bit strings of length four do not have two consecutive 1s?

- **(A)** 5
- **(B)** 6
- **(C)** 7
- **(D)** 8

**Answer:** D

---

## Q020

[NAT]

Suppose a T-shirts come in five diﬀerent sizes: S, M, L, XL, and XXL. Further suppose that each size comes in four colors, white, red,green, and black, except for XL, which comes only in red, green, and black, and XXL, which comes only in green and black. How many diﬀerent shirts does a souvenir shop have to stock to have at least one of each available size and color of the T-shirt?

**Answer:** 17

---





