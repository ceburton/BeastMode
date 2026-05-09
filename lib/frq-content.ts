import type { FrqPrompt } from './types';

/**
 * Hand-authored FRQs modeled on real AP Psychology Article Analysis (AAQ)
 * and Evidence-Based Question (EBQ) formats.
 *
 * Each prompt is purely for student practice — these are not auto-graded.
 * The rubric and key concepts are shown after submission to guide self-grading.
 */
export const AAQ_PROMPTS: FrqPrompt[] = [
  {
    id: 'aaq-sleep-memory',
    kind: 'AAQ',
    title: 'Sleep, Cramming, and Exam Performance',
    unitIds: [2, 4, 1],
    scenario: `A team of researchers studied 240 college students preparing for a high-stakes exam.
Students were randomly assigned to one of three study schedules:
  • Group A spaced their studying over 7 nights and got 8 hours of sleep on the night before the exam.
  • Group B crammed for 8 hours the night before and slept only 4 hours.
  • Group C studied the same total hours as Group A but did so in a single 8-hour session two days before, with normal (8-hour) sleep before the exam.
All students took the same 60-question multiple-choice exam covering material from a college Intro Psychology course. Mean scores (out of 60): A = 47.2 (SD = 5.1), B = 38.6 (SD = 7.0), C = 41.8 (SD = 6.2). The difference between Group A and Group B was statistically significant at p < .01.`,
    questions: [
      { label: 'A', prompt: 'Identify the independent variable in the study.' },
      { label: 'B', prompt: 'Identify the dependent variable in the study.' },
      { label: 'C', prompt: 'Explain how Group A\'s superior performance can be explained using the concept of distributed practice (the spacing effect).' },
      { label: 'D', prompt: 'Explain how memory consolidation during sleep helps account for Group B\'s lower scores.' },
      { label: 'E', prompt: 'Explain one limitation of generalizing the results of this study to all high-school students.' },
    ],
    rubric: [
      { points: 1, criteria: 'Identifies the independent variable as the study/sleep schedule (which of the three groups).' },
      { points: 1, criteria: 'Identifies the dependent variable as exam score.' },
      { points: 1, criteria: 'Explains that distributed practice resets the forgetting curve, creating stronger memory traces than massed practice (cramming).' },
      { points: 1, criteria: 'Explains that sleep — especially REM and slow-wave sleep — drives memory consolidation, so reduced sleep impaired Group B\'s ability to consolidate the studied material.' },
      { points: 1, criteria: 'Identifies a sampling/external validity limitation: e.g., college students may not represent high-school cohorts; convenience sample reduces generalizability.' },
    ],
    modelKeyConcepts: [
      'Distributed practice (spacing effect)',
      'Massed practice / cramming',
      'Forgetting curve',
      'Memory consolidation during sleep',
      'REM sleep / slow-wave (NREM 3) sleep',
      'External validity',
      'Sampling bias / generalizability',
      'Statistical significance (p < .05)',
    ],
  },
  {
    id: 'aaq-conformity',
    kind: 'AAQ',
    title: 'Conformity in a Modern Online Setting',
    unitIds: [9, 1],
    scenario: `Researchers replicated Asch's classic line-judgment task using an online platform with 320 adult participants. Each participant joined a "video meeting" with five other participants who were actually research confederates. On 12 of 18 critical trials, the confederates unanimously identified an obviously incorrect line as the matching line.
Participants conformed (gave the same wrong answer as the confederates) on an average of 4.1 out of 12 critical trials (SD = 3.2). When the same task was given without confederates as a control, the error rate was less than 1%. Results were strongest for participants who reported feeling "less confident in technology" beforehand.`,
    questions: [
      { label: 'A', prompt: 'Identify the operational definition of conformity used in this study.' },
      { label: 'B', prompt: 'Explain how normative social influence accounts for participants\' behavior.' },
      { label: 'C', prompt: 'Explain how informational social influence might also have contributed.' },
      { label: 'D', prompt: 'Use the concept of statistical significance to explain why the comparison to the <1% control error rate matters.' },
      { label: 'E', prompt: 'Identify one ethical concern with this online replication and how the researchers should address it.' },
    ],
    rubric: [
      { points: 1, criteria: 'Operational definition: number of times the participant gave the same incorrect answer as the confederates on critical trials (out of 12).' },
      { points: 1, criteria: 'Normative social influence: participants conform to be liked / not stand out, even when they know the answer is wrong.' },
      { points: 1, criteria: 'Informational social influence: participants assume the unanimous group must know something they don\'t, and use group judgment as evidence.' },
      { points: 1, criteria: 'Statistical significance: the very large gap (33% vs. <1%) makes it extremely unlikely the difference is due to chance.' },
      { points: 1, criteria: 'Ethical concern with proposed remedy — e.g., deception requires debriefing; informed consent must explain study purpose afterward.' },
    ],
    modelKeyConcepts: [
      'Conformity',
      'Normative social influence',
      'Informational social influence',
      'Operational definition',
      'Statistical significance',
      'Debriefing',
      'Deception (justified vs unjustified)',
      'Asch (replication)',
    ],
  },
  {
    id: 'aaq-fear-conditioning',
    kind: 'AAQ',
    title: 'Conditioning Fear of a Tone',
    unitIds: [7, 2, 11],
    scenario: `In a laboratory study, 60 adult volunteers wore galvanic skin response (GSR) sensors while a 1000-Hz tone was paired with a brief, mild electric shock to the wrist. After 12 pairings, the tone was presented alone. Participants showed elevated GSR readings to the tone alone, indicating a fear response. Two weeks later, 45 of the 60 still showed an elevated GSR to the tone, even with no shock present. Twenty participants were also tested with a 1100-Hz tone, and showed reduced but still elevated responses.`,
    questions: [
      { label: 'A', prompt: 'Identify the unconditioned stimulus (UCS) and unconditioned response (UCR).' },
      { label: 'B', prompt: 'Identify the conditioned stimulus (CS) and conditioned response (CR).' },
      { label: 'C', prompt: 'Explain the response to the 1100-Hz tone using the concept of stimulus generalization.' },
      { label: 'D', prompt: 'Explain how this study illustrates classical conditioning rather than operant conditioning.' },
      { label: 'E', prompt: 'Explain how systematic desensitization could be used to extinguish the conditioned fear.' },
    ],
    rubric: [
      { points: 1, criteria: 'UCS = electric shock; UCR = automatic fear/startle reaction (elevated GSR) to shock.' },
      { points: 1, criteria: 'CS = the 1000-Hz tone; CR = elevated GSR/fear to the tone alone after conditioning.' },
      { points: 1, criteria: 'Generalization: stimuli similar to the CS (the 1100-Hz tone) elicit a weaker version of the CR.' },
      { points: 1, criteria: 'Classical (not operant) because the response is involuntary and elicited by a stimulus, not strengthened by consequences.' },
      { points: 1, criteria: 'Systematic desensitization: pair relaxation with a graded hierarchy of fear-relevant tones until the CR extinguishes (counterconditioning).' },
    ],
    modelKeyConcepts: [
      'Unconditioned stimulus / response',
      'Conditioned stimulus / response',
      'Acquisition',
      'Generalization',
      'Discrimination',
      'Extinction',
      'Counterconditioning',
      'Systematic desensitization',
    ],
  },
];

export const EBQ_PROMPTS: FrqPrompt[] = [
  {
    id: 'ebq-stress-health',
    kind: 'EBQ',
    title: 'Chronic Stress and Physical Health',
    unitIds: [8, 2, 11],
    scenario: `Develop an evidence-based argument that chronic stress harms physical health.
Use evidence from at least three of the following sources:

  Source 1 — Selye\'s General Adaptation Syndrome (GAS): three-phase model of the stress response (alarm → resistance → exhaustion). In the exhaustion phase, the body\'s resources are depleted and immune function is suppressed.
  Source 2 — Sympathetic NS activation: sustained stress keeps cortisol and norepinephrine elevated, raising heart rate and blood pressure for extended periods.
  Source 3 — Health psychology research linking chronic stress to hypertension, headaches, and slowed wound healing.
  Source 4 — Tend-and-befriend research showing that social support (an adaptive coping strategy) buffers the physiological stress response.
  Source 5 — Twin studies of cortisol reactivity showing high heritability — but with environmental moderators like adverse childhood experiences (ACEs).`,
    questions: [
      { label: 'A', prompt: 'State a clear thesis that chronic stress harms physical health.' },
      { label: 'B', prompt: 'Provide evidence from Source 1, Source 2, OR Source 3 that supports the thesis.' },
      { label: 'C', prompt: 'Provide evidence from a different source that further supports the thesis.' },
      { label: 'D', prompt: 'Use psychological reasoning to explain how the two pieces of evidence connect to the thesis.' },
      { label: 'E', prompt: 'Identify a counterclaim or qualification (e.g., individual differences) and address it.' },
    ],
    rubric: [
      { points: 1, criteria: 'Defensible thesis claiming chronic stress harms physical health.' },
      { points: 1, criteria: 'First piece of evidence cited correctly from one of the listed sources.' },
      { points: 1, criteria: 'Second piece of evidence cited correctly from a different source.' },
      { points: 1, criteria: 'Reasoning explicitly links biological mechanisms (HPA axis, cortisol, immune suppression) to long-term physical outcomes.' },
      { points: 1, criteria: 'Acknowledges and addresses a qualification (e.g., individual differences in coping, social support buffering, heritability).' },
    ],
    modelKeyConcepts: [
      'General Adaptation Syndrome (alarm/resistance/exhaustion)',
      'Cortisol & sympathetic NS',
      'Immune suppression',
      'Tend-and-befriend',
      'Problem-focused vs emotion-focused coping',
      'Adverse Childhood Experiences (ACEs)',
      'Diathesis-stress model',
    ],
  },
  {
    id: 'ebq-disorders-biopsychosocial',
    kind: 'EBQ',
    title: 'Major Depressive Disorder Has Biological, Cognitive, and Social Causes',
    unitIds: [11, 2, 9],
    scenario: `Develop an argument that major depressive disorder (MDD) is best understood through a biopsychosocial lens.

  Source 1 — Twin studies: monozygotic concordance for MDD ~40%, dizygotic ~20%. Strong genetic component.
  Source 2 — Neurochemistry: lower levels of serotonin and norepinephrine are associated with depression. SSRIs treat depression by blocking serotonin reuptake.
  Source 3 — Beck\'s cognitive triad: persistent negative views about self, world, and future fuel and maintain depression.
  Source 4 — Learned helplessness research (Seligman): perceived lack of control over outcomes produces depressive-like behavior.
  Source 5 — Sociocultural data: rates of depression are higher among low-SES populations and among LGBTQ+ adolescents who experience discrimination and lack of social support.`,
    questions: [
      { label: 'A', prompt: 'State a thesis that MDD requires a biopsychosocial explanation.' },
      { label: 'B', prompt: 'Cite biological evidence (Source 1 or 2).' },
      { label: 'C', prompt: 'Cite cognitive evidence (Source 3 or 4).' },
      { label: 'D', prompt: 'Cite sociocultural evidence (Source 5).' },
      { label: 'E', prompt: 'Use psychological reasoning (e.g., the diathesis-stress model) to integrate the three lines of evidence.' },
      { label: 'F', prompt: 'Identify a treatment implication that follows from a biopsychosocial view.' },
    ],
    rubric: [
      { points: 1, criteria: 'Biopsychosocial thesis stated clearly.' },
      { points: 1, criteria: 'Biological evidence (genes/NTs) cited correctly.' },
      { points: 1, criteria: 'Cognitive evidence (cognitive triad / learned helplessness) cited correctly.' },
      { points: 1, criteria: 'Sociocultural evidence cited correctly.' },
      { points: 1, criteria: 'Reasoning integrates all three using diathesis-stress: a genetic predisposition is "turned on" by cognitive and environmental stressors.' },
      { points: 1, criteria: 'Identifies an integrated treatment implication: e.g., antidepressants + CBT + social support produce best outcomes.' },
    ],
    modelKeyConcepts: [
      'Biopsychosocial model',
      'Diathesis-stress',
      'Twin studies / heritability',
      'Serotonin & norepinephrine; SSRIs / reuptake inhibition',
      'Beck\'s cognitive triad',
      'Learned helplessness',
      'Sociocultural risk factors',
      'CBT (cognitive behavioral therapy)',
    ],
  },
  {
    id: 'ebq-memory-eyewitness',
    kind: 'EBQ',
    title: 'Eyewitness Memory Is Reconstructive and Error-Prone',
    unitIds: [4, 1],
    scenario: `Develop an argument that eyewitness memory is reconstructive and prone to systematic error, with implications for legal practice.

  Source 1 — Loftus & Palmer (1974): participants who heard the verb "smashed" (vs. "hit") recalled higher speeds and were more likely to falsely report broken glass. Demonstrates the misinformation effect.
  Source 2 — Constructive memory: each retrieval updates a memory with new associations and biases — memory is not a recording but a reconstruction.
  Source 3 — Source amnesia: people often forget where they heard information, conflating it with their own memory of an event.
  Source 4 — Imagination inflation: people who repeatedly imagine an event become more confident it actually happened.
  Source 5 — Encoding failure: when attention is divided, information never enters long-term memory and cannot be recalled accurately later.`,
    questions: [
      { label: 'A', prompt: 'State a thesis defending the reconstructive nature of memory.' },
      { label: 'B', prompt: 'Cite evidence from one source supporting your thesis.' },
      { label: 'C', prompt: 'Cite evidence from a second, distinct source supporting your thesis.' },
      { label: 'D', prompt: 'Use psychological reasoning to connect both sources to your claim.' },
      { label: 'E', prompt: 'Apply your argument to one concrete change that should be made in police lineup or interview procedures.' },
    ],
    rubric: [
      { points: 1, criteria: 'Thesis: eyewitness memory is reconstructive and unreliable.' },
      { points: 1, criteria: 'First piece of evidence used correctly from one source.' },
      { points: 1, criteria: 'Second piece of evidence used correctly from a different source.' },
      { points: 1, criteria: 'Reasoning ties evidence to the broader claim about reconstruction (e.g., framing/leading questions act as misinformation).' },
      { points: 1, criteria: 'Procedural application: e.g., neutral wording in interviews, double-blind lineup administration, sequential rather than simultaneous lineups.' },
    ],
    modelKeyConcepts: [
      'Misinformation effect',
      'Constructive memory',
      'Source amnesia',
      'Imagination inflation',
      'Encoding failure',
      'Framing',
      'Leading questions',
    ],
  },
];

export const ALL_FRQS: FrqPrompt[] = [...AAQ_PROMPTS, ...EBQ_PROMPTS];

export function frqById(id: string): FrqPrompt | undefined {
  return ALL_FRQS.find((p) => p.id === id);
}

export function pickExamFrqs(): { aaq: FrqPrompt; ebq: FrqPrompt } {
  const aaq = AAQ_PROMPTS[Math.floor(Math.random() * AAQ_PROMPTS.length)];
  const ebq = EBQ_PROMPTS[Math.floor(Math.random() * EBQ_PROMPTS.length)];
  return { aaq, ebq };
}
