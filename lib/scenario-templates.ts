/**
 * Scenario question templates. Each template targets a specific term and
 * provides a realistic stem that asks the student to identify the concept.
 *
 * Distractors are pulled by the quiz generator from same-topic terms.
 *
 * To stay accurate, each template lists `targetTermLowercase` — the quiz
 * generator only uses a template if a matching term exists in the DB.
 */

export interface ScenarioTemplate {
  id: string;
  unitId: number;
  topicHint: string;
  targetTermLowercase: string;
  stem: string;
  // optional helper if the actual term name differs from a more friendly answer
  answerOverride?: string;
}

export const SCENARIO_TEMPLATES: ScenarioTemplate[] = [
  // ---------- Unit 1: Research ----------
  {
    id: 's1-placebo',
    unitId: 1,
    topicHint: 'Experiments',
    targetTermLowercase: 'placebo effect',
    stem: 'A researcher gives a sugar pill to the control group, and several participants report feeling less anxious anyway. This is best explained by the…',
  },
  {
    id: 's1-double-blind',
    unitId: 1,
    topicHint: 'Experiments',
    targetTermLowercase: 'double-blind',
    stem: 'In a new antidepressant trial, neither the participants nor the data-collectors know who is receiving the active drug. This procedure is a…',
  },
  {
    id: 's1-confounding',
    unitId: 1,
    topicHint: 'Experiments',
    targetTermLowercase: 'confound',
    stem: 'Students who studied while listening to music scored higher than a control group, but the music group also slept an extra hour the night before. The extra sleep is best described as a(n)…',
  },
  {
    id: 's1-correlation',
    unitId: 1,
    topicHint: 'Research Designs',
    targetTermLowercase: 'positive correlation',
    stem: 'A psychologist finds that as study time increases, exam scores also increase. This relationship is best described as a…',
  },
  {
    id: 's1-random-assignment',
    unitId: 1,
    topicHint: 'Experiments',
    targetTermLowercase: 'random assignment',
    stem: 'To make sure her experimental and control groups are equivalent before the manipulation begins, a researcher uses a coin flip to decide who goes where. This procedure is called…',
  },

  // ---------- Unit 2: Biology ----------
  {
    id: 's2-myelin',
    unitId: 2,
    topicHint: 'Neurons & Neural Firing',
    targetTermLowercase: 'myelin sheath',
    stem: "After a neurology lecture, a student wonders why action potentials travel so quickly. Her professor says the answer is the fatty layer wrapping the axon — the…",
  },
  {
    id: 's2-dopamine',
    unitId: 2,
    topicHint: 'Neurons & Neural Firing',
    targetTermLowercase: 'dopamine',
    stem: 'A patient with Parkinson\'s disease shows tremors and difficulty with fine motor control. The neurotransmitter most directly implicated is…',
  },
  {
    id: 's2-amygdala',
    unitId: 2,
    topicHint: 'The Brain',
    targetTermLowercase: 'amygdala',
    stem: 'After a brain injury, a patient no longer experiences fear in dangerous situations. The most likely damaged structure is the…',
  },
  {
    id: 's2-rem-rebound',
    unitId: 2,
    topicHint: 'Sleep',
    targetTermLowercase: 'rem rebound',
    stem: 'After several nights with little sleep, a student notices unusually intense and lengthy dreaming the next time he gets a full night\'s rest. This phenomenon is called…',
  },

  // ---------- Unit 3: Sensation & Perception ----------
  {
    id: 's3-absolute-threshold',
    unitId: 3,
    topicHint: 'Sensation',
    targetTermLowercase: 'absolute threshold',
    stem: 'Walking into a perfume shop, Maya can detect the scent of a particular bottle 50% of the time it is presented. The smallest detectable concentration is the…',
  },
  {
    id: 's3-sensory-adaptation',
    unitId: 3,
    topicHint: 'Sensation',
    targetTermLowercase: 'sensory adaptation',
    stem: 'After ten minutes in a fish market, the strong odor seems to fade even though the smell is still present. This experience is best explained by…',
  },
  {
    id: 's3-cocktail',
    unitId: 3,
    topicHint: 'Perception',
    targetTermLowercase: 'cocktail party effect',
    stem: 'Distracted at a noisy party, Liam suddenly notices when someone across the room mentions his name. This illustrates the…',
  },

  // ---------- Unit 4: Cognition / Memory ----------
  {
    id: 's4-availability',
    unitId: 4,
    topicHint: 'Thinking & Problem Solving',
    targetTermLowercase: 'availability heuristic',
    stem: 'After watching news coverage of a plane crash, Sara becomes convinced flying is more dangerous than driving. Her judgment is best explained by the…',
  },
  {
    id: 's4-functional-fixedness',
    unitId: 4,
    topicHint: 'Thinking & Problem Solving',
    targetTermLowercase: 'functional fixedness',
    stem: "Trying to hammer a nail, Devon never thinks of using the heavy stapler on his desk because he can only see the stapler's usual purpose. This barrier to problem-solving is called…",
  },
  {
    id: 's4-misinformation',
    unitId: 4,
    topicHint: 'Memory: Retrieval',
    targetTermLowercase: 'misinformation effect',
    stem: 'After being asked "How fast were the cars going when they SMASHED into each other?", witnesses recall higher speeds than those asked using the word "hit". This is the…',
  },
  {
    id: 's4-serial-position',
    unitId: 4,
    topicHint: 'Memory: Retrieval',
    targetTermLowercase: 'serial position effect',
    stem: 'Asked to recall a 20-item grocery list, Priya remembers the first few items and the last few items best, but forgets the middle. This pattern is the…',
  },

  // ---------- Unit 5: Intelligence ----------
  {
    id: 's5-stereotype-threat',
    unitId: 5,
    topicHint: 'Intelligence Testing Issues',
    targetTermLowercase: 'stereotype threat',
    stem: 'Reminded that "girls usually do worse on math tests" right before the exam, a high-performing student underperforms on a math test. This best illustrates…',
  },
  {
    id: 's5-fixed-mindset',
    unitId: 5,
    topicHint: 'Intelligence Testing Issues',
    targetTermLowercase: 'fixed mindset',
    stem: 'A student says, "I\'m just not a math person — there\'s no point in studying harder." This belief reflects a…',
  },

  // ---------- Unit 6: Development ----------
  {
    id: 's6-conservation',
    unitId: 6,
    topicHint: 'Cognitive Development',
    targetTermLowercase: 'lack conservation',
    stem: "When juice is poured from a short, wide glass into a tall, thin glass, four-year-old Mia insists the tall glass has 'more.' Mia's confusion shows she lacks…",
    answerOverride: 'Conservation',
  },
  {
    id: 's6-secure-attachment',
    unitId: 6,
    topicHint: 'Socioemotional Development',
    targetTermLowercase: 'secure attachment',
    stem: 'In the strange-situation paradigm, a toddler is upset when his mother leaves the room but is quickly soothed and resumes playing when she returns. His attachment style is best classified as…',
  },
  {
    id: 's6-authoritative',
    unitId: 6,
    topicHint: 'Socioemotional Development',
    targetTermLowercase: 'authoritative',
    stem: 'A parent sets clear rules but explains the reasoning behind them and welcomes input from her teenager. This describes the … parenting style.',
  },

  // ---------- Unit 7: Learning ----------
  {
    id: 's7-classical-cs',
    unitId: 7,
    topicHint: 'Classical Conditioning',
    targetTermLowercase: 'conditioned stimulus (cs)',
    stem: "Pavlov repeatedly rang a bell just before presenting food. Eventually the dogs salivated to the bell alone. In this study, the bell is the…",
    answerOverride: 'Conditioned Stimulus (CS)',
  },
  {
    id: 's7-neg-reinforcement',
    unitId: 7,
    topicHint: 'Operant Conditioning',
    targetTermLowercase: 'neg. reinforcement',
    stem: 'A driver buckles his seatbelt to make the annoying chime stop. The disappearance of the chime increases the seatbelt-buckling behavior — an example of…',
    answerOverride: 'Negative Reinforcement',
  },
  {
    id: 's7-variable-ratio',
    unitId: 7,
    topicHint: 'Operant Conditioning',
    targetTermLowercase: 'variable ratio schedule',
    stem: 'A slot machine pays out after an unpredictable number of pulls. Players keep pulling because the schedule is highly resistant to extinction. This describes a…',
  },

  // ---------- Unit 8: Motivation / Emotion ----------
  {
    id: 's8-intrinsic',
    unitId: 8,
    topicHint: 'Motivation',
    targetTermLowercase: 'intrinsic motivation',
    stem: 'A child reads books for hours simply because she enjoys reading, with no reward involved. This is best described as…',
  },
  {
    id: 's8-yerkes',
    unitId: 8,
    topicHint: 'Motivation',
    targetTermLowercase: 'yerkes dodson law',
    stem: 'A student is too relaxed to study before a test but, with mild test-day jitters, performs at her peak — until extreme panic causes her to blank. This relationship between arousal and performance is the…',
  },

  // ---------- Unit 9: Social ----------
  {
    id: 's9-fae',
    unitId: 9,
    topicHint: 'Attributions & Perceptions',
    targetTermLowercase: 'fundamental attribution error',
    stem: "Watching another driver speed past, Jordan thinks, 'What a reckless jerk' — without considering that the driver might be rushing to a hospital. Jordan's reasoning illustrates the…",
  },
  {
    id: 's9-cognitive-dissonance',
    unitId: 9,
    topicHint: 'Attitudes',
    targetTermLowercase: 'cognitive dissonance',
    stem: "A smoker who knows smoking is harmful tells himself, 'My grandfather smoked his whole life and lived to 95.' This rationalization reduces the discomfort known as…",
  },
  {
    id: 's9-bystander',
    unitId: 9,
    topicHint: 'Social Situations',
    targetTermLowercase: 'bystander effect',
    stem: 'In a crowded subway car, no one helps an obviously distressed passenger because each person assumes someone else will. This is best explained by the…',
  },
  {
    id: 's9-foot-in-door',
    unitId: 9,
    topicHint: 'Attitudes',
    targetTermLowercase: 'foot in the door phenomenon',
    stem: 'A canvasser first asks people to display a small "Drive Safely" sign; weeks later, those who agreed are far more willing to put a giant billboard on their lawn. This illustrates the…',
  },

  // ---------- Unit 10: Personality ----------
  {
    id: 's10-displacement',
    unitId: 10,
    topicHint: 'Defense Mechanisms',
    targetTermLowercase: 'displacement',
    stem: 'After being yelled at by his boss, Marcus comes home and snaps at his dog. From a Freudian view, this is an example of…',
  },
  {
    id: 's10-self-efficacy',
    unitId: 10,
    topicHint: 'Social-Cognitive',
    targetTermLowercase: 'self-efficacy',
    stem: "Believing she can master the audition piece, Aisha practices longer and persists through mistakes — and ultimately performs well. Bandura would call her belief about her own competence…",
  },

  // ---------- Unit 11: Disorders ----------
  {
    id: 's11-ptsd',
    unitId: 11,
    topicHint: 'Trauma & Stress Disorders',
    targetTermLowercase: 'post-traumatic stress disorders (ptsd)',
    stem: 'Six months after surviving a serious car accident, Kim still experiences flashbacks, hypervigilance, and trouble sleeping. The disorder most consistent with these symptoms is…',
    answerOverride: 'Post-Traumatic Stress Disorder (PTSD)',
  },
  {
    id: 's11-ocd',
    unitId: 11,
    topicHint: 'OCD & Related',
    targetTermLowercase: 'obsessive-compulsive disorder (ocd)',
    stem: 'Plagued by intrusive thoughts that the stove is on, Devon checks it 30 times before bed each night to relieve his anxiety. His pattern of obsessions and compulsions is most consistent with…',
    answerOverride: 'Obsessive-Compulsive Disorder (OCD)',
  },

  // ---------- Unit 12: Treatment ----------
  {
    id: 's12-systematic-desensitization',
    unitId: 12,
    topicHint: 'Behavioral',
    targetTermLowercase: 'systematic desensitization',
    stem: "To help a client overcome her fear of flying, a therapist pairs deep relaxation with a gradually escalating series of flight-related stimuli — first photos of planes, then videos, then a real terminal visit. This technique is…",
  },
  {
    id: 's12-cognitive-restructuring',
    unitId: 12,
    topicHint: 'Cognitive Perspective',
    targetTermLowercase: 'cognitive restructuring',
    stem: "A therapist helps a depressed client identify the thought 'I'm a total failure because I missed one deadline' and replace it with a more balanced statement. This technique is called…",
  },
];
