/**
 * Seed script + data for 52 real open Erdős problems from erdosproblems.com
 * Fetched and verified on 2026-02-14
 *
 * Run with: npx tsx scripts/seed-erdos-problems.ts
 * Or import: import { erdosProblems } from './seed-erdos-problems'
 *
 * SKIPPED (not open):
 *   #2  - DISPROVED (Hough 2015, covering systems minimum modulus)
 *   #4  - PROVED (Maynard; Ford-Green-Konyagin-Tao, large prime gaps)
 *   #6  - PROVED (Banks-Freiberg-Turnage-Butterbaugh, increasing prime gaps)
 *   #8  - DISPROVED (consequence of Hough 2015, monochromatic covering systems)
 *   #13 - PROVED (Bedert 2023, divisibility-free sets)
 *   #16 - DISPROVED (Chen, odd numbers not of form 2^k+p)
 *   #21 - PROVED (Kahn 1994, intersecting families)
 *   #22 - PROVED (Fox-Loh-Zhao, Ramsey-Turan K4-free graphs)
 *   #24 - PROVED (Grzesik; Hatami et al., C5 copies in triangle-free graphs)
 *   #26 - DISPROVED (Ruzsa, Behrend sequences)
 *   #27 - DISPROVED (Filaseta-Ford-Konyagin-Pomerance-Yu, almost covering systems)
 *   #29 - PROVED (Jain-Pham-Sawhney-Zakharov 2024, explicit additive basis)
 *   #31 - PROVED (Lorentz, density-zero complement basis)
 *   #34 - DISPROVED (Hegyvari, consecutive sums of permutations)
 *   #35 - PROVED (Plunnecke, Schnirelmann density additive basis)
 *   #37 - DISPROVED (Ruzsa, lacunary essential components)
 *   #45 - PROVED (Croot 2003, monochromatic unit fraction decomposition)
 *   #46 - PROVED (Croot, monochromatic Egyptian fraction in colorings)
 *   #47 - PROVED (Bloom; Liu-Sawhney, unit fraction subsets)
 *   #48 - PROVED (Ford-Luca-Pomerance, phi(n)=sigma(m))
 *   #49 - PROVED (Tao, monotone Euler totient chains)
 *   #53 - PROVED (Chang, sum-product distinct element sums)
 *   #54 - PROVED (Conlon-Fox-Pham, Ramsey 2-complete sets)
 *   #55 - PROVED (Conlon-Fox-Pham, Ramsey r-complete sets)
 *   #56 - DISPROVED (Ahlswede-Khachatrian, coprime-free sets)
 *   #57 - PROVED (Liu-Montgomery, odd cycle lengths in high chromatic graphs)
 *   #58 - PROVED (Gyarfas, chromatic number vs odd cycle count)
 *   #59 - DISPROVED (Morris-Saxton, counting H-free graphs)
 *   #63 - PROVED (Liu-Montgomery, power-of-2 cycle lengths)
 *   #67 - PROVED (Tao, Erdos discrepancy problem)
 *   #69 - PROVED (Tao-Teravainen, irrationality of sum omega(n)/2^n)
 *   #71 - PROVED (Bollobas, cycles in arithmetic progressions)
 *   #72 - PROVED (Liu-Montgomery, cycles from density-zero length sets)
 *   #73 - PROVED (Reed, near-bipartite subgraph characterization)
 *   #76 - PROVED (Gruslys-Letzter, monochromatic triangles)
 *   #79 - PROVED (Wigderson, Ramsey size linear critical graphs)
 *   #83 - PROVED (Ahlswede-Khachatrian, intersecting families)
 *   #88 - PROVED (Kwan-Sah-Sauermann-Sawhney, induced subgraphs with m edges)
 */

import type { ErdosProblemInsert } from '../src/types/database'

export const erdosProblems: ErdosProblemInsert[] = [
  // =========================================================================
  // NUMBER THEORY
  // =========================================================================
  {
    erdos_number: 1,
    title: 'Distinct subset sums',
    statement:
      'If $A\\subseteq \\{1,\\ldots,N\\}$ with $|A|=n$ is such that the subset sums $\\sum_{a\\in S}a$ are distinct for all $S\\subseteq A$ then $N \\gg 2^{n}$.',
    tags: ['number theory', 'additive combinatorics'],
    status: 'open',
    prize: '$500',
    difficulty: 'hard',
    source_url: 'https://www.erdosproblems.com/1',
    notes:
      'Erdos and Moser proved N >= (1/4 - o(1)) * 2^n / sqrt(n). Dubroff, Fox, and Xu proved the exact bound N >= C(n, floor(n/2)). Powers of 2 show that 2^n would be optimal.',
  },
  {
    erdos_number: 3,
    title: 'Arithmetic progressions in dense sets',
    statement:
      'If $A\\subseteq \\mathbb{N}$ has $\\sum_{n\\in A}\\frac{1}{n}=\\infty$ then must $A$ contain arbitrarily long arithmetic progressions?',
    tags: ['number theory', 'additive combinatorics', 'arithmetic progressions'],
    status: 'open',
    prize: '$5000',
    difficulty: 'notorious',
    source_url: 'https://www.erdosproblems.com/3',
    notes:
      'The k=3 case was proved by Bloom and Sisask, with better bounds by Kelley and Meka. For general k, Leng, Sah, and Sawhney proved r_k(N) << N/exp((log log N)^{c_k}). This is one of the most famous open problems in combinatorics.',
  },
  {
    erdos_number: 5,
    title: 'Limit points of normalized prime gaps',
    statement:
      'Let $C\\geq 0$. Is there an infinite sequence of $n_i$ such that $\\lim_{i\\to \\infty}\\frac{p_{n_i+1}-p_{n_i}}{\\log n_i}=C$?',
    tags: ['number theory', 'primes'],
    status: 'open',
    prize: 'no',
    difficulty: 'notorious',
    source_url: 'https://www.erdosproblems.com/5',
    notes:
      'The set S of limit points has been shown to contain 0 (Goldston-Pintz-Yildirim) and infinity (Westzynthius). Merikoski proved at least 1/3 of [0,infinity) belongs to S. Erdos asked whether S = [0,infinity].',
  },
  {
    erdos_number: 7,
    title: 'Odd covering systems',
    statement: 'Is there a distinct covering system all of whose moduli are odd?',
    tags: ['number theory', 'covering systems'],
    status: 'open',
    prize: '$25',
    difficulty: 'hard',
    source_url: 'https://www.erdosproblems.com/7',
    notes:
      'Hough and Nielsen proved at least one modulus must be divisible by 2 or 3. Balister et al. showed no covering system exists with all moduli odd and squarefree. Selfridge offered $2000 for an explicit example.',
  },
  {
    erdos_number: 9,
    title: 'Odd numbers not representable as p + 2^k + 2^l',
    statement:
      'Let $A$ be the set of all odd integers $\\geq 1$ not of the form $p+2^{k}+2^l$ (where $k,l\\geq 0$ and $p$ is prime). Is the upper density of $A$ positive?',
    tags: ['number theory', 'additive basis', 'primes'],
    status: 'open',
    prize: 'no',
    difficulty: 'hard',
    source_url: 'https://www.erdosproblems.com/9',
    notes:
      'Schinzel proved infinitely many such odd integers exist. Pan improved the count to >> N^{1-epsilon} for any epsilon > 0.',
  },
  {
    erdos_number: 10,
    title: 'Primes plus bounded powers of 2',
    statement:
      'Is there some $k$ such that every large integer is the sum of a prime and at most $k$ powers of 2?',
    tags: ['number theory', 'additive basis', 'primes'],
    status: 'open',
    prize: 'no',
    difficulty: 'notorious',
    source_url: 'https://www.erdosproblems.com/10',
    notes:
      'Erdos called this "probably unattackable." Granville and Soundararajan conjectured at most 3 powers of 2 suffice for all odd integers.',
  },
  {
    erdos_number: 11,
    title: 'Squarefree number plus power of 2',
    statement:
      'Is every large odd integer $n$ the sum of a squarefree number and a power of 2?',
    tags: ['number theory', 'additive basis'],
    status: 'open',
    prize: 'no',
    difficulty: 'hard',
    source_url: 'https://www.erdosproblems.com/11',
    notes:
      'Hercher (2024) confirmed it for all odd integers up to 2^{50} ~ 1.12 * 10^{15}. Granville and Soundararajan connected this to Wieferich primes.',
  },
  {
    erdos_number: 12,
    title: 'Sets avoiding a | (b+c)',
    statement:
      'Let $A$ be an infinite set with no distinct $a,b,c \\in A$ where $a \\mid (b+c)$ and $b,c>a$. Does such an $A$ exist with $\\liminf |A \\cap \\{1,\\ldots,N\\}| / N^{1/2} > 0$? Must $\\sum_{n \\in A} 1/n < \\infty$?',
    tags: ['number theory'],
    status: 'open',
    prize: 'no',
    difficulty: 'hard',
    source_url: 'https://www.erdosproblems.com/12',
    notes:
      'Erdos-Sarkozy proved such A must have density 0. Elsholtz-Planitzer constructed sets with |A cap {1,...,N}| >> N^{1/2} / (log N)^{1/2} (log log N)^2 (log log log N)^2.',
  },
  {
    erdos_number: 14,
    title: 'Unique representation counts',
    statement:
      'Let $A \\subset \\mathbb{N}$ and $B$ be the set of integers representable in exactly one way as the sum of two elements from $A$. Is it true that $|\\{1,\\ldots,N\\} \\setminus B| \\gg_\\epsilon N^{1/2-\\epsilon}$ for all $\\epsilon > 0$? Is $|\\{1,\\ldots,N\\} \\setminus B| = o(N^{1/2})$ possible?',
    tags: ['number theory', 'Sidon sets', 'additive combinatorics'],
    status: 'open',
    prize: 'no',
    difficulty: 'hard',
    source_url: 'https://www.erdosproblems.com/14',
    notes:
      'Erdos, Sarkozy, and Szemeredi constructed A where |{1,...,N} \\ B| << N^{1/2+epsilon} yet infinitely often >> N^{1/3-epsilon}.',
  },
  {
    erdos_number: 15,
    title: 'Alternating series n/p_n',
    statement:
      'Is it true that $\\sum_{n=1}^{\\infty}(-1)^n\\frac{n}{p_n}$ converges, where $p_n$ is the sequence of primes?',
    tags: ['number theory', 'primes'],
    status: 'open',
    prize: 'no',
    difficulty: 'hard',
    source_url: 'https://www.erdosproblems.com/15',
    notes:
      'Tao proved convergence assuming a strong form of the Hardy-Littlewood prime tuples conjecture. Zhang\'s work on bounded gaps implies a related series does not converge.',
  },
  {
    erdos_number: 17,
    title: 'Cluster primes',
    statement:
      'Are there infinitely many primes $p$ such that every even number $n\\leq p-3$ can be written as a difference of primes $n=q_1-q_2$ where $q_1,q_2\\leq p$?',
    tags: ['number theory', 'primes'],
    status: 'open',
    prize: 'no',
    difficulty: 'hard',
    source_url: 'https://www.erdosproblems.com/17',
    notes:
      'The first prime lacking this property is 97. Elsholtz improved the counting bound to << x * exp(-c(log log x)^2) for c < 1/8.',
  },
  {
    erdos_number: 18,
    title: 'Representations by practical numbers',
    statement:
      'We call $m$ practical if every integer $1 \\leq n < m$ is the sum of distinct divisors of $m$. If $m$ is practical let $h(m)$ be such that $h(m)$ many divisors always suffice. Is it true that $h(n!)<(\\log n)^{O(1)}$?',
    tags: ['number theory', 'divisors', 'factorials'],
    status: 'open',
    prize: '$250',
    difficulty: 'hard',
    source_url: 'https://www.erdosproblems.com/18',
    notes:
      'Erdos showed h(n!) < n. Vose proved existence of infinitely many practical m with h(m) << (log m)^{1/2}.',
  },
  {
    erdos_number: 25,
    title: 'Logarithmic density of sieved sets',
    statement:
      'Let $1\\leq n_1<n_2<\\cdots$ be an arbitrary sequence of integers, each with an associated residue class $a_i\\pmod{n_i}$. Let $A$ be the set of integers $n$ such that for every $i$ either $n<n_i$ or $n\\not\\equiv a_i\\pmod{n_i}$. Must the logarithmic density of $A$ exist?',
    tags: ['number theory'],
    status: 'open',
    prize: 'no',
    difficulty: 'hard',
    source_url: 'https://www.erdosproblems.com/25',
    notes: 'This is a special case of problem 486.',
  },
  {
    erdos_number: 50,
    title: 'Singular distribution of phi(n)/n',
    statement:
      'Schoenberg proved that for every $c\\in [0,1]$ the density of $\\{ n\\in \\mathbb{N} : \\phi(n)<cn\\}$ exists. Let this density be denoted by $f(c)$. Is it true that there are no $x$ such that $f\'(x)$ exists and is positive?',
    tags: ['number theory'],
    status: 'open',
    prize: '$250',
    difficulty: 'hard',
    source_url: 'https://www.erdosproblems.com/50',
    notes: 'Erdos could prove the distribution function is purely singular.',
  },
  {
    erdos_number: 51,
    title: 'Smallest preimage of Euler totient',
    statement:
      'Is there an infinite set $A\\subset \\mathbb{N}$ such that for every $a\\in A$ there is an integer $n$ with $\\phi(n)=a$, and yet if $n_a$ is the smallest such integer then $n_a/a\\to \\infty$?',
    tags: ['number theory'],
    status: 'open',
    prize: 'no',
    difficulty: 'intermediate',
    source_url: 'https://www.erdosproblems.com/51',
    notes:
      'Related to Carmichael\'s conjecture on uniqueness of totient values. Erdos proved that infinitely many t exist where phi(n)=t has no unique solution, if any such t exists.',
  },
  {
    erdos_number: 68,
    title: 'Irrationality of sum 1/(n!-1)',
    statement: 'Is $\\sum_{n\\geq 2}\\frac{1}{n!-1}$ irrational?',
    tags: ['number theory', 'irrationality'],
    status: 'open',
    prize: 'no',
    difficulty: 'hard',
    source_url: 'https://www.erdosproblems.com/68',
    notes:
      'The sum can be rewritten as sum_{k>=1} sum_{n>=2} 1/(n!)^k. Erdos noted that sum 1/(n!+t) should be transcendental for every integer t.',
  },

  // =========================================================================
  // ADDITIVE COMBINATORICS / BASIS PROBLEMS
  // =========================================================================
  {
    erdos_number: 28,
    title: 'Erdos-Turan conjecture on additive bases',
    statement:
      'If $A\\subseteq \\mathbb{N}$ is such that $A+A$ contains all but finitely many integers then $\\limsup 1_A\\ast 1_A(n)=\\infty$.',
    tags: ['number theory', 'additive basis'],
    status: 'open',
    prize: '$500',
    difficulty: 'notorious',
    source_url: 'https://www.erdosproblems.com/28',
    notes:
      'Conjectured by Erdos and Turan. A stronger variant asks whether limsup 1_A * 1_A(n) / log n > 0. Related to problems 40 and 1145.',
  },
  {
    erdos_number: 30,
    title: 'Maximum size of Sidon sets',
    statement:
      'Let $h(N)$ be the maximum size of a Sidon set in $\\{1,\\ldots,N\\}$. Is it true that, for every $\\epsilon>0$, $h(N) = N^{1/2}+O_\\epsilon(N^\\epsilon)$?',
    tags: ['number theory', 'Sidon sets', 'additive combinatorics'],
    status: 'open',
    prize: '$1000',
    difficulty: 'notorious',
    source_url: 'https://www.erdosproblems.com/30',
    notes:
      'Erdos and Turan proved h(N) <= N^{1/2} + O(N^{1/4}). Best bound: h(N) <= N^{1/2} + 0.98183*N^{1/4} + O(1) by Carter, Hunter, O\'Bryant. Singer showed h(N) >= (1-o(1))N^{1/2}.',
  },
  {
    erdos_number: 32,
    title: 'Thin additive complement of primes',
    statement:
      'Is there a set $A\\subset\\mathbb{N}$ with $|A\\cap\\{1,\\ldots,N\\}| = O(\\log N)$ such that every large integer can be written as $p+a$ for some prime $p$ and $a\\in A$?',
    tags: ['number theory', 'additive basis'],
    status: 'open',
    prize: '$50',
    difficulty: 'hard',
    source_url: 'https://www.erdosproblems.com/32',
    notes:
      'Erdos proved existence with << (log N)^2. Ruzsa improved to << omega(N) * log N and proved the lower bound liminf |A cap {1,...,N}| / log N >= e^gamma ~ 1.781.',
  },
  {
    erdos_number: 33,
    title: 'Additive complement of squares',
    statement:
      'Let $A\\subset\\mathbb{N}$ be such that every large integer can be written as $n^2+a$ for some $a\\in A$ and $n\\geq 0$. What is the smallest possible value of $\\limsup |A\\cap\\{1,\\ldots,N\\}|/N^{1/2}$?',
    tags: ['number theory', 'additive basis'],
    status: 'open',
    prize: 'no',
    difficulty: 'intermediate',
    source_url: 'https://www.erdosproblems.com/33',
    notes:
      'Moser proved liminf >= 1.06. Cilleruelo and others improved to liminf >= 4/pi ~ 1.273. Van Doorn constructed A with the ratio < 6.66.',
  },
  {
    erdos_number: 36,
    title: 'Optimal constant for partition differences',
    statement:
      'For all sufficiently large $N$, if $A\\sqcup B=\\{1,\\ldots,2N\\}$ is a partition into two equal parts, then there is some $x$ such that the number of solutions to $a-b=x$ with $a\\in A$ and $b\\in B$ is at least $cN$. Find the optimal constant $c>0$.',
    tags: ['number theory', 'additive combinatorics'],
    status: 'open',
    prize: 'no',
    difficulty: 'hard',
    source_url: 'https://www.erdosproblems.com/36',
    notes:
      'Current best bounds: 0.379005 < c < 0.380876. Upper bound improved by TTT-Discover LLM and AlphaEvolve.',
  },
  {
    erdos_number: 38,
    title: 'Non-basis essential component',
    statement:
      'Does there exist $B\\subset\\mathbb{N}$ which is not an additive basis, but for every set $A$ of Schnirelmann density $\\alpha$ and every $N$, there exists $b\\in B$ such that $|(A\\cup (A+b))\\cap \\{1,\\ldots,N\\}|\\geq (\\alpha+f(\\alpha))N$ where $f(\\alpha)>0$ for $0<\\alpha <1$?',
    tags: ['number theory', 'additive combinatorics'],
    status: 'open',
    prize: 'no',
    difficulty: 'hard',
    source_url: 'https://www.erdosproblems.com/38',
    notes:
      'Linnik constructed an essential component that is not an additive basis. Erdos proved that if B is a basis of order k, the density increment is at least alpha(1-alpha)/(2k).',
  },
  {
    erdos_number: 39,
    title: 'Infinite Sidon sets near sqrt(N)',
    statement:
      'Is there an infinite Sidon set $A\\subset \\mathbb{N}$ such that $|A\\cap \\{1,\\ldots,N\\}| \\gg_\\epsilon N^{1/2-\\epsilon}$ for all $\\epsilon>0$?',
    tags: ['number theory', 'Sidon sets', 'additive combinatorics'],
    status: 'open',
    prize: '$500',
    difficulty: 'notorious',
    source_url: 'https://www.erdosproblems.com/39',
    notes:
      'Best bound is >> N^{sqrt(2)-1+o(1)} by Ruzsa. Erdos proved any infinite Sidon set must satisfy liminf |A cap {1,...,N}| / N^{1/2} = 0.',
  },
  {
    erdos_number: 40,
    title: 'Erdos-Turan conjecture with growth rate',
    statement:
      'For what functions $g(N)\\to \\infty$ is it true that $|A\\cap \\{1,\\ldots,N\\}| \\gg N^{1/2}/g(N)$ implies $\\limsup 1_A\\ast 1_A(n)=\\infty$?',
    tags: ['number theory', 'additive basis'],
    status: 'open',
    prize: '$500',
    difficulty: 'notorious',
    source_url: 'https://www.erdosproblems.com/40',
    notes:
      'This is a stronger formulation of the Erdos-Turan conjecture (problem 28). Solving it for any g(N) -> infinity would resolve problem 28.',
  },
  {
    erdos_number: 41,
    title: 'B_3 sets density',
    statement:
      'Let $A\\subset\\mathbb{N}$ be an infinite set such that the triple sums $a+b+c$ are all distinct (aside from trivial coincidences). Is it true that $\\liminf |A\\cap \\{1,\\ldots,N\\}|/N^{1/3}=0$?',
    tags: ['number theory', 'Sidon sets', 'additive combinatorics'],
    status: 'open',
    prize: '$500',
    difficulty: 'hard',
    source_url: 'https://www.erdosproblems.com/41',
    notes:
      'Nash proved the result for h=4. Chen proved it for all even h. The problem remains open for odd h >= 3.',
  },
  {
    erdos_number: 42,
    title: 'Disjoint Sidon sets',
    statement:
      'Let $M\\geq 1$ and $N$ be sufficiently large. Is it true that for every Sidon set $A\\subset \\{1,\\ldots,N\\}$ there is another Sidon set $B\\subset \\{1,\\ldots,N\\}$ of size $M$ such that $(A-A)\\cap(B-B)=\\{0\\}$?',
    tags: ['number theory', 'Sidon sets', 'additive combinatorics'],
    status: 'open',
    prize: 'no',
    difficulty: 'intermediate',
    source_url: 'https://www.erdosproblems.com/42',
    notes:
      'Proved for M=3 by Sedov (using ChatGPT and Codex). Cases M=1 and M=2 are also established.',
  },
  {
    erdos_number: 43,
    title: 'Sum of binomials for disjoint Sidon sets',
    statement:
      'If $A,B \\subset \\{1,\\ldots,N\\}$ are two Sidon sets with $(A-A)\\cap(B-B)=\\{0\\}$, is it true that $\\binom{|A|}{2} + \\binom{|B|}{2} \\leq \\binom{f(N)}{2} + O(1)$ where $f(N)$ is the maximum Sidon set size?',
    tags: ['number theory', 'Sidon sets', 'additive combinatorics'],
    status: 'open',
    prize: '$100',
    difficulty: 'intermediate',
    source_url: 'https://www.erdosproblems.com/43',
    notes:
      'Tao provided an upper bound proof. Barreto gave a negative answer to the stronger equal-size variant.',
  },
  {
    erdos_number: 44,
    title: 'Extending Sidon sets',
    statement:
      'Let $A\\subset \\{1,\\ldots,N\\}$ be a Sidon set. For any $\\epsilon>0$, do there exist $M$ and $B\\subset \\{N+1,\\ldots,M\\}$ such that $A\\cup B$ is a Sidon set of size at least $(1-\\epsilon)M^{1/2}$?',
    tags: ['number theory', 'Sidon sets', 'additive combinatorics'],
    status: 'open',
    prize: 'no',
    difficulty: 'hard',
    source_url: 'https://www.erdosproblems.com/44',
    notes: 'A positive solution to problem 707 would imply this, which in turn implies problem 329.',
  },
  {
    erdos_number: 52,
    title: 'Erdos-Szemeredi sum-product conjecture',
    statement:
      'Is it true that for every $\\epsilon>0$: $\\max(|A+A|,|AA|)\\gg_\\epsilon |A|^{2-\\epsilon}$?',
    tags: ['number theory', 'additive combinatorics'],
    status: 'open',
    prize: '$250',
    difficulty: 'notorious',
    source_url: 'https://www.erdosproblems.com/52',
    notes:
      'Best bound: max(|A+A|, |AA|) >> |A|^{1270/951 - o(1)} ~ |A|^{1.335} by Bloom (2025). For finite fields F_p the bound is >> |A|^{5/4+o(1)}.',
  },
  {
    erdos_number: 66,
    title: 'Additive basis with logarithmic representation',
    statement:
      'Is there $A\\subseteq \\mathbb{N}$ such that $\\lim_{n\\to \\infty}\\frac{1_A\\ast 1_A(n)}{\\log n}$ exists and is $\\neq 0$?',
    tags: ['number theory', 'additive basis'],
    status: 'open',
    prize: '$500',
    difficulty: 'notorious',
    source_url: 'https://www.erdosproblems.com/66',
    notes:
      'Erdos believed the answer is negative. Erdos and Sarkozy proved |1_A * 1_A(n) - log n| / sqrt(log n) -> 0 is impossible. Horvath (2007) strengthened this.',
  },

  // =========================================================================
  // GRAPH THEORY
  // =========================================================================
  {
    erdos_number: 19,
    title: 'Chromatic number of K_n decompositions',
    statement:
      'If $G$ is an edge-disjoint union of $n$ copies of $K_n$ then is $\\chi(G)=n$?',
    tags: ['graph theory', 'chromatic number'],
    status: 'open',
    prize: '$500',
    difficulty: 'hard',
    source_url: 'https://www.erdosproblems.com/19',
    notes:
      'Kahn proved chi(G) <= (1+o(1))n. Kang, Kelly, Kuhn, Methuku, and Osthus proved it for all sufficiently large n. The problem remains open for small n.',
  },
  {
    erdos_number: 23,
    title: 'Making triangle-free graphs bipartite',
    statement:
      'Can every triangle-free graph on $5n$ vertices be made bipartite by deleting at most $n^2$ edges?',
    tags: ['graph theory'],
    status: 'open',
    prize: 'no',
    difficulty: 'hard',
    source_url: 'https://www.erdosproblems.com/23',
    notes:
      'The blow-up of C_5 shows this would be optimal. Balogh, Clemen, and Lidicky proved that deleting at most 1.064*n^2 edges suffices.',
  },
  {
    erdos_number: 60,
    title: 'Many C_4 copies above Turan threshold',
    statement:
      'Does every graph on $n$ vertices with $>\\mathrm{ex}(n;C_4)$ edges contain $\\gg n^{1/2}$ many copies of $C_4$?',
    tags: ['graph theory', 'extremal graph theory'],
    status: 'open',
    prize: 'no',
    difficulty: 'hard',
    source_url: 'https://www.erdosproblems.com/60',
    notes:
      'Erdos and Simonovits could not even prove that at least 2 copies are guaranteed. He, Ma, and Yang proved the conjecture when n = q^2+q+1 for even q.',
  },
  {
    erdos_number: 61,
    title: 'Erdos-Hajnal conjecture',
    statement:
      'For any graph $H$ is there some $c=c(H)>0$ such that every graph $G$ on $n$ vertices not containing $H$ as an induced subgraph contains a complete graph or independent set on $\\geq n^c$ vertices?',
    tags: ['graph theory', 'Ramsey theory'],
    status: 'open',
    prize: 'no',
    difficulty: 'notorious',
    source_url: 'https://www.erdosproblems.com/61',
    notes:
      'Erdos and Hajnal proved existence of a clique or independent set on >= exp(c_H * sqrt(log n)) vertices. Bucic, Nguyen, Scott, and Seymour improved to exp(c_H * sqrt(log n * log log n)).',
  },
  {
    erdos_number: 62,
    title: 'Common subgraphs of uncountably chromatic graphs',
    statement:
      'If $G_1,G_2$ are two graphs with chromatic number $\\aleph_1$ then must there exist a graph $G$ with chromatic number $4$ (or even $\\aleph_0$) which is a subgraph of both?',
    tags: ['graph theory', 'set theory'],
    status: 'open',
    prize: 'no',
    difficulty: 'hard',
    source_url: 'https://www.erdosproblems.com/62',
    notes:
      'Every graph with chromatic number aleph_1 contains all sufficiently large odd cycles (Erdos-Hajnal-Shelah). Erdos conjectured every such graph contains all 4-chromatic graphs of sufficiently large girth.',
  },
  {
    erdos_number: 64,
    title: 'Power-of-2 length cycles in graphs',
    statement:
      'Does every finite graph with minimum degree at least 3 contain a cycle of length $2^k$ for some $k\\geq 2$?',
    tags: ['graph theory', 'extremal graph theory'],
    status: 'open',
    prize: '$1000',
    difficulty: 'hard',
    source_url: 'https://www.erdosproblems.com/64',
    notes:
      'Conjectured by Erdos and Gyarfas. Liu and Montgomery proved it for sufficiently large minimum degree, disproving a stronger conjecture. The small-degree case remains open.',
  },
  {
    erdos_number: 65,
    title: 'Reciprocal sum of cycle lengths',
    statement:
      'Let $G$ be a graph with $n$ vertices and $kn$ edges, and $a_1<a_2<\\cdots$ the lengths of cycles in $G$. Is $\\sum 1/a_i$ minimised when $G$ is a complete bipartite graph?',
    tags: ['graph theory', 'extremal graph theory'],
    status: 'open',
    prize: 'no',
    difficulty: 'hard',
    source_url: 'https://www.erdosproblems.com/65',
    notes:
      'Liu and Montgomery established the asymptotically sharp lower bound >= (1/2 - o(1)) log k. Montgomery et al. have forthcoming work proving the bipartite graph is optimal for large k.',
  },
  {
    erdos_number: 74,
    title: 'Infinite chromatic number with few odd edges',
    statement:
      'Let $f(n)\\to \\infty$ (possibly very slowly). Is there a graph of infinite chromatic number such that every finite subgraph on $n$ vertices can be made bipartite by deleting at most $f(n)$ edges?',
    tags: ['graph theory', 'chromatic number'],
    status: 'open',
    prize: '$500',
    difficulty: 'notorious',
    source_url: 'https://www.erdosproblems.com/74',
    notes:
      'Conjectured by Erdos, Hajnal, and Szemeredi. Rodl proved it for hypergraphs and for f(n) = epsilon*n. Open even for f(n) = sqrt(n). Fails for chromatic number aleph_1.',
  },
  {
    erdos_number: 75,
    title: 'Uncountable chromatic with large independent sets',
    statement:
      'Is there a graph of chromatic number $\\aleph_1$ with $\\aleph_1$ vertices such that for all $\\epsilon>0$, if $n$ is sufficiently large, every subgraph on $n$ vertices contains an independent set of size $>n^{1-\\epsilon}$?',
    tags: ['graph theory', 'chromatic number', 'set theory'],
    status: 'open',
    prize: '$1000',
    difficulty: 'notorious',
    source_url: 'https://www.erdosproblems.com/75',
    notes:
      'Conjectured by Erdos, Hajnal, and Szemeredi. Erdos offered generous rewards for any significant partial results.',
  },
  {
    erdos_number: 80,
    title: 'Book size in dense graphs',
    statement:
      'Let $c>0$ and $f_c(n)$ be the maximal $m$ such that every graph with $n$ vertices and $\\geq cn^2$ edges, where each edge is in at least one triangle, contains a book of size $m$. Is $f_c(n)>n^{\\epsilon}$ for some $\\epsilon>0$? Or $f_c(n)\\gg \\log n$?',
    tags: ['graph theory', 'extremal graph theory'],
    status: 'open',
    prize: 'no',
    difficulty: 'hard',
    source_url: 'https://www.erdosproblems.com/80',
    notes:
      'Fox and Loh proved f_c(n) <= n^{O(1/log log n)} for c < 1/4, disproving the polynomial conjecture. Edwards and Nikiforov proved f_c(n) >= n/6 when c > 1/4.',
  },
  {
    erdos_number: 81,
    title: 'Clique partitions of chordal graphs',
    statement:
      'Let $G$ be a chordal graph on $n$ vertices (no induced cycles of length > 3). Can the edges of $G$ be partitioned into $n^2/6+O(n)$ many cliques?',
    tags: ['graph theory'],
    status: 'open',
    prize: 'no',
    difficulty: 'intermediate',
    source_url: 'https://www.erdosproblems.com/81',
    notes:
      'Erdos, Ordman, and Zalcstein demonstrated an upper bound of (1/4-epsilon)*n^2 cliques. For split graphs, 3/16*n^2+O(n) cliques suffice.',
  },
  {
    erdos_number: 82,
    title: 'Regular induced subgraphs',
    statement:
      'Let $F(n)$ be maximal such that every graph on $n$ vertices contains a regular induced subgraph on at least $F(n)$ vertices. Prove that $F(n)/\\log n\\to \\infty$.',
    tags: ['graph theory'],
    status: 'open',
    prize: 'no',
    difficulty: 'hard',
    source_url: 'https://www.erdosproblems.com/82',
    notes:
      'Ramsey\'s theorem gives F(n) >> log n. Alon, Krivelevich, and Sudakov proved F(n) <= n^{1/2} (log n)^{O(1)}.',
  },
  {
    erdos_number: 84,
    title: 'Counting cycle sets of graphs',
    statement:
      'The cycle set of a graph $G$ on $n$ vertices is $A\\subseteq \\{3,\\ldots,n\\}$ such that $G$ has a cycle of length $\\ell$ iff $\\ell \\in A$. Let $f(n)$ count possible cycle sets. Prove $f(n)=o(2^n)$ and $f(n)/2^{n/2}\\to \\infty$.',
    tags: ['graph theory', 'extremal graph theory'],
    status: 'open',
    prize: 'no',
    difficulty: 'hard',
    source_url: 'https://www.erdosproblems.com/84',
    notes:
      'Verstraete proved f(n) << 2^{n - n^{1/10}}. Nenadov improved to f(n) << 2^{n - n^{1/2-o(1)}}. The limit of f(n)^{1/n} remains unknown.',
  },
  {
    erdos_number: 85,
    title: 'Monotonicity of C_4 forcing number',
    statement:
      'Let $f(n)$ be minimal such that every graph on $n$ vertices with minimum degree $\\geq f(n)$ contains a $C_4$. Is it true that $f(n+1)\\geq f(n)$ for all large $n$?',
    tags: ['graph theory', 'extremal graph theory'],
    status: 'open',
    prize: 'no',
    difficulty: 'intermediate',
    source_url: 'https://www.erdosproblems.com/85',
    notes:
      'f(n) < sqrt(n)+1 and f(n) = (1+o(1))sqrt(n). A weaker conjecture asks whether f(m) > f(n) - c for some constant c and all m > n.',
  },
  {
    erdos_number: 86,
    title: 'C_4 in hypercube subgraphs',
    statement:
      'Is it true that every subgraph of $Q_n$ (the $n$-dimensional hypercube) with $\\geq (\\frac{1}{2}+o(1))n2^{n-1}$ many edges contains a $C_4$?',
    tags: ['graph theory', 'extremal graph theory'],
    status: 'open',
    prize: '$100',
    difficulty: 'hard',
    source_url: 'https://www.erdosproblems.com/86',
    notes:
      'Best upper bound: f(n) <= 0.60318 * n * 2^{n-1} by Baber. Best lower bound: f(n) >= (1/2 + c/sqrt(n)) * n * 2^{n-1} by Brass, Harborth, and Nienborg.',
  },
  {
    erdos_number: 87,
    title: 'Ramsey numbers and chromatic number',
    statement:
      'Let $\\epsilon >0$. Is it true that if $k$ is sufficiently large, then $R(G)>(1-\\epsilon)^kR(k)$ for every graph $G$ with $\\chi(G)=k$?',
    tags: ['graph theory', 'Ramsey theory'],
    status: 'open',
    prize: 'no',
    difficulty: 'hard',
    source_url: 'https://www.erdosproblems.com/87',
    notes:
      'Erdos\'s original conjecture R(G) >= R(k) fails for k=4 (pentagonal wheel). Wigderson showed R(G) >> 2^{k/2} for any graph with chromatic number k.',
  },

  // =========================================================================
  // RAMSEY THEORY
  // =========================================================================
  {
    erdos_number: 20,
    title: 'Sunflower conjecture',
    statement:
      'Let $f(n,k)$ be minimal such that every family of $n$-uniform sets with $|\\mathcal{F}|\\geq f(n,k)$ contains a $k$-sunflower. Is it true that $f(n,k) < c_k^n$ for some constant $c_k > 0$?',
    tags: ['combinatorics', 'extremal set theory'],
    status: 'open',
    prize: '$1000',
    difficulty: 'notorious',
    source_url: 'https://www.erdosproblems.com/20',
    notes:
      'Best bound: f(n,k) < (Ck log n)^n by Rao, Frankston et al., and Bell et al. Erdos-Rado originally proved f(n,k) <= (k-1)^n * n!. The k=3 case is expected to contain the core difficulty.',
  },
  {
    erdos_number: 70,
    title: 'Partition calculus for the continuum',
    statement:
      'Let $\\mathfrak{c}$ be the cardinality of the reals, $\\beta$ any countable ordinal, and $2\\leq n<\\omega$. Is it true that $\\mathfrak{c}\\to (\\beta, n)_2^3$?',
    tags: ['set theory', 'Ramsey theory'],
    status: 'open',
    prize: 'no',
    difficulty: 'hard',
    source_url: 'https://www.erdosproblems.com/70',
    notes:
      'Erdos and Rado proved c -> (omega+n, 4)_2^3 for any 2 <= n < omega.',
  },
  {
    erdos_number: 77,
    title: 'Diagonal Ramsey number growth rate',
    statement:
      'If $R(k)$ is the diagonal Ramsey number, find $\\lim_{k\\to \\infty}R(k)^{1/k}$.',
    tags: ['graph theory', 'Ramsey theory'],
    status: 'open',
    prize: '$250',
    difficulty: 'notorious',
    source_url: 'https://www.erdosproblems.com/77',
    notes:
      'Erdos established sqrt(2) <= liminf R(k)^{1/k} <= limsup R(k)^{1/k} <= 4. Gupta, Ndiaye, Norin, and Wei improved the upper bound to 3.7992. Erdos conjectured the limit might be 2.',
  },
  {
    erdos_number: 78,
    title: 'Constructive Ramsey lower bound',
    statement:
      'Give a constructive proof that $R(k)>C^k$ for some constant $C>1$. Equivalently, explicitly construct a graph on $n$ vertices with no clique or independent set of size $\\geq c\\log n$.',
    tags: ['graph theory', 'Ramsey theory'],
    status: 'open',
    prize: '$100',
    difficulty: 'notorious',
    source_url: 'https://www.erdosproblems.com/78',
    notes:
      'Erdos provided a probabilistic proof showing R(k) >> k * 2^{k/2}. Li recently improved the constructive bound to avoiding sets of size >= (log n)^C for some constant C > 0.',
  },

  // =========================================================================
  // GEOMETRY / DISCRETE GEOMETRY
  // =========================================================================
  {
    erdos_number: 89,
    title: 'Erdos distinct distances problem',
    statement:
      'Does every set of $n$ distinct points in $\\mathbb{R}^2$ determine $\\gg n/\\sqrt{\\log n}$ many distinct distances?',
    tags: ['geometry', 'combinatorial geometry'],
    status: 'open',
    prize: '$500',
    difficulty: 'notorious',
    source_url: 'https://www.erdosproblems.com/89',
    notes:
      'A sqrt(n) x sqrt(n) integer grid shows this would be optimal. Guth and Katz proved there are always >> n/log n distinct distances. The remaining log factor is the gap.',
  },
  {
    erdos_number: 90,
    title: 'Erdos unit distance problem',
    statement:
      'Does every set of $n$ distinct points in $\\mathbb{R}^2$ contain at most $n^{1+O(1/\\log\\log n)}$ many pairs which are distance 1 apart?',
    tags: ['geometry', 'combinatorial geometry'],
    status: 'open',
    prize: '$500',
    difficulty: 'notorious',
    source_url: 'https://www.erdosproblems.com/90',
    notes:
      'Best upper bound is O(n^{4/3}) by Spencer, Szemeredi, and Trotter. Valtr showed a non-Euclidean metric achieving n^{4/3} pairs, suggesting Euclidean-specific methods are needed.',
  },
]

// ============================================================================
// SEED EXECUTION — Run with: npx tsx scripts/seed-erdos-problems.ts
// ============================================================================

async function seed() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Missing environment variables')
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  console.log('Seeding real Erdős problems...\n')
  console.log(`Total problems to insert: ${erdosProblems.length}\n`)

  // Insert in batches
  const batchSize = 10
  let totalInserted = 0

  for (let i = 0; i < erdosProblems.length; i += batchSize) {
    const batch = erdosProblems.slice(i, i + batchSize)

    const { data, error } = await supabase
      .from('erdos_problems')
      .upsert(batch, { onConflict: 'erdos_number' })
      .select()

    if (error) {
      console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error)
      continue
    }

    totalInserted += data?.length || 0

    for (const problem of data || []) {
      const prizeStr = problem.prize !== 'no' ? ` [${problem.prize}]` : ''
      const diffStr = problem.difficulty === 'notorious' ? ' !!!' : problem.difficulty === 'hard' ? ' !!' : ''
      console.log(`  #${problem.erdos_number}: ${problem.title}${prizeStr}${diffStr}`)
    }
  }

  console.log(`\n--- Inserted ${totalInserted} Erdős problems ---`)

  // Summary
  const tagCounts = new Map<string, number>()
  let prizeTotal = 0
  const difficulties = { accessible: 0, intermediate: 0, hard: 0, notorious: 0 }

  for (const p of erdosProblems) {
    for (const tag of p.tags || []) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
    }
    if (p.prize && p.prize !== 'no') {
      const amount = parseInt(p.prize.replace(/[^0-9]/g, ''), 10)
      if (!isNaN(amount)) prizeTotal += amount
    }
    if (p.difficulty) difficulties[p.difficulty]++
  }

  console.log(`\nDifficulty breakdown:`)
  console.log(`  Accessible:    ${difficulties.accessible}`)
  console.log(`  Intermediate:  ${difficulties.intermediate}`)
  console.log(`  Hard:          ${difficulties.hard}`)
  console.log(`  Notorious:     ${difficulties.notorious}`)
  console.log(`\nTotal prize money: $${prizeTotal.toLocaleString()}`)

  console.log(`\nTop tags:`)
  const sortedTags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
  for (const [tag, count] of sortedTags) {
    console.log(`  ${tag}: ${count}`)
  }

  console.log('\nSeed completed!')
}

// Run if executed directly
const isDirectRun = process.argv[1]?.includes('seed-erdos-problems')
if (isDirectRun) {
  seed().catch((error) => {
    console.error('Seed failed:', error)
    process.exit(1)
  })
}
