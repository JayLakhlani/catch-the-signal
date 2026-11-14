# Single session protocol

This replaces the original written proposal's one-week naturalistic waiting diary. Update the submitted proposal and slides to describe this version if you use it. Do not combine it with claims about having measured everyday waits, EEG or pupil responses.

## Question and scope

Does temporal predictability relate to reported duration during a short, controlled visual activity? Reaction-time costs for unexpected timing are an exploratory behavioural proxy. They are not a direct neural prediction-error signal and cannot prove that time is a computational illusion.

## Participants and procedure

Recruit approximately 20–30 college students aged 18 or older, subject to your supervisor's agreed study process. One visit only, around 3–4 minutes total. Obtain consent on the website, run 8 practice trials, run three 10-trial stages, collect duration and predictability ratings after every stage, then collect one Google Form. No follow-up diary or additional waiting is required.

Phones, tablets and computers are supported. Use the same type of device and response method where possible, and keep the device orientation unchanged. Touch uses the response pad; keyboard uses Space. Keep the task tab visible and avoid background applications. Do not recruit the same person more than once just because they can generate a new code.

## Stage construction

A usually predicts a 600 ms interval and B a 1200 ms interval before the same circle target. One stage is more regular (80% expected, 8 of 10), one is less regular (60% expected, 6 of 10), and the third is randomly assigned to either pattern with equal probability. Stage order is shuffled and trials within each stage are shuffled. No condition labels appear to participants.

Each stage has five 600 ms and five 1200 ms intervals, five A and five B cues, and ten identical targets. At each actual interval, the more regular stage contains 4 expected and 1 unexpected trial; the less regular stage contains 3 expected and 2 unexpected trials. Physical event counts and planned cue-to-target intervals are matched across stage types. This small predictability difference may be weak with only ten trials per stage; the predictability rating is a manipulation check, not evidence that the manipulation necessarily worked.

A fixation lasts at least 450 ms before each cue. The target stays visible for a fixed 1000 ms, even if a response arrives sooner. This helps prevent faster responses from shortening the stage. Held keys can delay the next cue until release. The fixed target duration and balanced intervals matter more than decorative animation, so the task has no celebration, sound or reward during timed stages. Practice gives simple feedback between trials. Stage progress, estimates and breaks occur outside the measurement window.

Actual stage duration is measured from the first cue onset estimate to the end of the tenth target, using the browser's high-resolution timer. It excludes the initial fixation and the subsequent questions. Participants estimate that same interval in whole seconds and rate predictability from 1 to 7. Actual duration remains hidden until all three estimates have been submitted. The final screen then shows actual, estimated and estimated-minus-actual duration per stage and for the total before linking to the Google Form. The total sums stage windows and excludes warm-up, questions and between-stage breaks. All stage ratings are project-specific unvalidated single items.

## Recorded data

- Sessions: code, task session, completion state, consent and device/input information, plus RT summary, total actual/estimated/difference seconds and study version.
- Trials: phase, stage, condition, cue, planned/observed interval, RT, anticipations, interruptions and frame-gap checks.
- Stages: actual duration, felt duration, signed estimated-minus-actual difference, ratio, predictability and interruption/timing flags.
- Google Form: participant code, attention to time, mood, clock checking/counting, distractions, input/device category, optional study guess and technical comments.

Do not store names, student numbers, diagnosis or exact location. Keep the results spreadsheet private. Research team: Group 57. Participants may stop before submitting; submitted responses cannot be withdrawn. The game and Google Form disclose this policy before their separate submissions. Optional dates, supervisor details and retention period are only shown if supplied.

## Analysis plan

Primary duration measure: felt_duration_s / actual_duration_s. Use log(ratio) for exploratory modelling, with a participant random intercept. Compare more versus less regular stages within participants, consider actual duration and stage order, and report uncertainty. Hypothesised direction: less regular stages have greater perceived duration relative to their measured duration. Check whether predictability ratings differ in the intended direction; a failure of that check limits interpretation of a null duration result.

Three reports per participant are repeated measures, not three independent participants. With 20–30 people this is an exploratory class project, not a confirmatory or powered neural-mechanism test. Preselect the main comparison before recruitment. Avoid fitting many covariates to this sample.

Stage-quality flags: exclude interrupted stages from the main duration comparison; review timing_issue flags and reported clock checking/counting, distractions and unusual or mixed input methods. Inspect duration plausibility and report exclusions. Consider inclusive sensitivity summaries. Because participants know in advance they will report duration, asking for estimates may itself direct attention toward time.

Reaction-time quality: omit practice, misses, anticipatory presses, RT below 100 ms or above 1000 ms, interruptions, and frame gaps above 50 ms from the RT summary. The exact thresholds are pilot choices, not universal validated cutoffs. Depending on the third stage’s assigned pattern, there are 10 or 11 expected and 5 or 4 unexpected main trials at each interval. Require at least 8 expected and 3 unexpected valid responses at each interval for an exploratory participant score. Otherwise keep the score missing, not zero.

For each actual interval calculate median unexpected RT minus median expected RT, then average the two differences. Preserve the sign. Use as a secondary descriptive measure; few unexpected trials make individual estimates noisy. Temporal preparation, conditional expectations and motor speed also influence RT. Associations between RT and duration remain exploratory. Browser timestamps are frame-based estimates of screen onset, not hardware measurements.

## What has and has not been checked

Local checks cover balanced stages, matched physical event counts, score thresholds, consent and schema validation, save idempotency and retry behaviour using simulated Google services. The UI can be previewed without sending participant records. Google account permissions, real Forms creation, the actual Vercel deployment and hardware timing must be checked in the final environment. Pilot with a few non-study attempts, identify those codes, then freeze the design before recruiting the sample.

## Mobile input and analysis

Version 2.1 records the actual pointer type on each response, selected input mode, viewport size, touch capability and orientation. Response time is captured at pointerdown for touch/mouse/pen and keydown for keyboard, with the same high-resolution clock. The browser's click event is not used to time taps. Multi-touch and held/repeated contacts are ignored. A cancelled pointer, hidden tab or screen rotation interrupts and flags the current stage.

Compare expected versus unexpected trials within the same input/device context. Report touch, mouse, pen and keyboard RT summaries separately; do not pool their raw latencies as if measured on one apparatus. Mixed-input attempts have a missing individual surprise-cost score. Keep the primary duration contrast within participants and consider input/device category in descriptive summaries, while avoiding too many covariates with this small sample.

Touch and keyboard hardware can introduce different timing delays. The study remains an exploratory browser pilot. Physical phone timing and platform behaviour require a small real-device pilot. Reference: Mental chronometry in the pocket? Timing accuracy of web applications on touchscreen and keyboard devices, https://pmc.ncbi.nlm.nih.gov/articles/PMC7280355/ . Pointer Events: https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent/pointerType .

## Version boundary

Version 2.3 introduces the three-stage design and feedback only after the final duration report. `predicted_duration_s` means the participant’s retrospective estimated/felt duration; it duplicates `felt_duration_s` for clear Sheet exports. `time_difference_s = predicted_duration_s - actual_duration_s`. Previous version 2.2 responses retain their four-stage design and are labelled by `study_version`. Do not silently pool versions. The shorter within-participant design has unequal condition repetitions (two versus one), with the extra condition randomised across participants. The Google Form now follows performance feedback; consider that order when interpreting its attention, mood and study-guess answers.

## Version 2.4: varied pacing and four cue characters

A and C both usually predict the earlier (600 ms) target; B and D both usually predict the later (1200 ms) target. They are aliases of two timing categories, rather than four separate intervals. Every stage includes all four characters. Expected/unexpected proportions, ten signals per stage, and the fixed target duration are preserved.

The three stage pacing baselines (350, 650 and 950 ms before each cue) are shuffled independently of regularity, with another random 0–100 ms on each fixation. Thus there is a shorter, medium and longer stage in each attempt, in random order, with small variation across attempts. Measured stage durations still start at the first cue and end after the last target; the initial fixation is excluded. Trials append planned_fixation_ms in column V. Actual stage duration, estimates and signed differences remain recorded as before.

Treat actual duration and stage order as factors when comparing predictability; pacing is randomised independently to avoid systematically assigning longer stages to one regularity condition. Analyse version 2.4 separately from previous designs. The receiver retains acceptance of versions 2.2 and 2.3 for attempts already in progress.
