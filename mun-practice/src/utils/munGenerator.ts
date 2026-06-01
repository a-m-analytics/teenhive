import { COUNTRIES, type Country } from '../data/munData'

// ─── Talking points for other delegates in Mod Caucus ───────────────────────

const STANCE_TEMPLATES: ((c: Country, topic: string) => string)[] = [
  (c, t) => `Emphasizes that any ${t.toLowerCase()} framework must fundamentally respect national ${c.keywords[0]} — a principle ${c.name} will not compromise on`,
  (c, t) => `Notes with deep concern that current ${t.toLowerCase()} proposals fail to account for the unique challenges facing ${c.region} nations`,
  (c, t) => `Calls upon all member states to prioritize ${c.keywords[1] || c.keywords[0]} when crafting any operative language on ${t.toLowerCase()}`,
  (c, t) => `Reaffirms ${c.name}'s longstanding commitment to ${c.keywords[0]} as an indispensable element of any ${t.toLowerCase()} solution`,
  (c, t) => `Strongly urges the committee to recognize that ${t.toLowerCase()} cannot be resolved without addressing the root issue of ${c.keywords[0]}`,
  (c, t) => `Welcomes dialogue on ${t.toLowerCase()} but stresses that ${c.name} cannot accept any language that undermines ${c.keywords[0]}`,
  (c, t) => `Recognizes that the ${c.region} region bears disproportionate burden in ${t.toLowerCase()} — and that burden-sharing must be central to any resolution`,
  (c, t) => `Stresses the need for equitable, multilateral solutions to ${t.toLowerCase()} that respect the ${c.keywords[0]} of all participating nations`,
  (c, t) => `Affirms ${c.name}'s position that ${t.toLowerCase()} requires a comprehensive approach that does not single out any one group of nations`,
  (c, t) => `Urges the committee to consider how ${t.toLowerCase()} measures interact with ${c.keywords[0]} — a matter of vital national interest for ${c.name}`,
]

export function generateTalkingPoints(country: Country, topic: string): string[] {
  const shuffled = [...STANCE_TEMPLATES].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 3).map(fn => fn(country, topic))
}

export type VotingIntent = 'support' | 'oppose' | 'abstain'

export function getVotingIntent(country: Country, yourCountry: Country): VotingIntent {
  const sharedKeywords = country.keywords.filter(k => yourCountry.keywords.includes(k))
  const sameRegion = country.region === yourCountry.region
  if (sharedKeywords.length >= 2 || sameRegion) return 'support'
  if (sharedKeywords.length === 1) return 'abstain'
  return 'oppose'
}

// ─── Unmod scenario generation ───────────────────────────────────────────────

export interface GeneratedUnmodScenario {
  context: string
  keyTension: string
  blocPartners: Country[]
  opposition: Country[]
}

const TENSIONS = [
  (topic: string) => `The committee is deadlocked on whether ${topic.toLowerCase()} should be addressed through binding obligations or voluntary pledges`,
  (topic: string) => `Developed and developing nations are sharply divided on who should bear the financial burden of ${topic.toLowerCase()} measures`,
  (topic: string) => `A powerful bloc is blocking all language with enforcement mechanisms, while another push for mandatory compliance on ${topic.toLowerCase()}`,
  (topic: string) => `The debate has fractured along regional lines — no bloc currently has the votes to pass a resolution on ${topic.toLowerCase()}`,
  (topic: string) => `Two competing working papers on ${topic.toLowerCase()} have split the committee — delegates must merge or one bloc will fail`,
]

const CONTEXTS = [
  (topic: string, tension: string) => `The committee has been in formal session for 90 minutes debating "${topic}." ${tension}. The Chair has opened a 20-minute unmoderated caucus to allow delegations to negotiate informally.`,
  (topic: string, tension: string) => `After a contentious moderated caucus on "${topic}", the Chair suspended formal debate. ${tension}. You now have 15 minutes to build a coalition before voting begins.`,
  (topic: string, tension: string) => `Working paper negotiations on "${topic}" have stalled. ${tension}. The dais is pushing for a unified draft resolution — you need to lobby key delegations now.`,
]

export function generateUnmodScenario(yourCountry: Country, topic: string): GeneratedUnmodScenario {
  const others = COUNTRIES.filter(c => c.name !== yourCountry.name)

  const allies = others.filter(c =>
    c.keywords.some(k => yourCountry.keywords.includes(k)) || c.region === yourCountry.region
  )
  const opponents = others.filter(c => !allies.includes(c))

  const shuffledAllies = [...allies].sort(() => Math.random() - 0.5)
  const shuffledOpponents = [...opponents].sort(() => Math.random() - 0.5)

  const tension = TENSIONS[Math.floor(Math.random() * TENSIONS.length)](topic)
  const contextFn = CONTEXTS[Math.floor(Math.random() * CONTEXTS.length)]

  return {
    context: contextFn(topic, tension),
    keyTension: tension,
    blocPartners: shuffledAllies.slice(0, 3),
    opposition: shuffledOpponents.slice(0, 2),
  }
}

// ─── Strategy quiz questions ─────────────────────────────────────────────────

export interface StrategyQuestion {
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export function generateStrategyQuestions(
  yourCountry: Country,
  partners: Country[],
  opposition: Country[],
  topic: string
): StrategyQuestion[] {
  const p0 = partners[0] || COUNTRIES[1]
  const p1 = partners[1] || COUNTRIES[2]
  const opp = opposition[0] || COUNTRIES[3]

  return [
    {
      question: `You need co-sponsors for your working paper on ${topic.toLowerCase()}. Who should you approach first?`,
      options: [
        `${p0.flag} ${p0.name} — they share your ${p0.keywords[0]} priorities`,
        `${opp.flag} ${opp.name} — neutralize the opposition before they block you`,
        `The largest regional bloc — quantity matters more than alignment`,
        `Wait for others to approach you — show confidence`,
      ],
      correctIndex: 0,
      explanation: `Always start with your natural allies. ${p0.name} shares your ${p0.keywords[0]} priorities, so they're a fast, high-confidence win. Building momentum with early co-sponsors makes it much easier to convince fence-sitters later. Never open with the opposition — you'll burn time and signal weakness.`,
    },
    {
      question: `${opp.flag} ${opp.name} is threatening to vote against your resolution. Their core concern is "${opp.keywords[0]}." What's the smartest move?`,
      options: [
        `Add preambulatory language acknowledging ${opp.keywords[0]} — costs nothing, buys face-saving`,
        `Ignore them — you can pass without their vote`,
        `Offer them lead co-sponsorship to buy their vote`,
        `Confront them publicly in formal debate to expose the blocking tactic`,
      ],
      correctIndex: 0,
      explanation: `Preambulatory acknowledgment is the classic diplomatic unlock. It signals respect for their concern without changing what the resolution actually requires (operative clauses do that). They get to say they shaped the resolution; you keep the substance intact. Ignoring them risks a veto or procedural blocking — even if you have majority votes.`,
    },
    {
      question: `${p1.flag} ${p1.name} wants language on ${p1.keywords[0]} stronger than you're comfortable with. They're pushing back on your draft. What do you offer?`,
      options: [
        `Strengthen the preambulatory clause on ${p1.keywords[0]} in exchange for keeping your operative language unchanged`,
        `Give in fully on their demand — you can't afford to lose them`,
        `Walk away — other co-sponsors can fill the gap`,
        `Escalate to the Chair and ask for a moderated caucus on the issue`,
      ],
      correctIndex: 0,
      explanation: `The preamble/operative trade is the bread and butter of resolution negotiation. Preamble clauses are statements of principle — they acknowledge and reaffirm. Operative clauses require actual action and create binding obligations. Giving ${p1.name} a stronger preamble on ${p1.keywords[0]} lets them claim a win, while your core operative language stays intact. Pure diplomatic judo.`,
    },
  ]
}

// ─── Roleplay response generation ────────────────────────────────────────────

export interface RoleplayResponse {
  text: string
  sentiment: 'positive' | 'neutral' | 'negative'
  hint?: string
}

const POSITIVE_RESPONSES: ((c: Country, topic: string) => string)[] = [
  (c, t) => `"${c.name} is encouraged by your proposal on ${t.toLowerCase()}. Your mention of ${c.keywords[0]} is exactly the kind of language we've been seeking. We're open to discussing co-sponsorship — what specific operative language do you have in mind?"`,
  (c, t) => `"This aligns with ${c.name}'s own priorities. We appreciate that you addressed ${c.keywords[0]} directly. Preliminary support is possible — though we'll need to review the full draft before committing. Can you walk us through the key operative clauses?"`,
  (c, t) => `"${c.name} sees a strong basis for collaboration here. Your framing around ${c.keywords[0]} gives us confidence. We're prepared to co-sponsor, subject to a few minor adjustments in the preamble. Let's talk specifics."`,
]

const NEUTRAL_RESPONSES: ((c: Country, topic: string) => string)[] = [
  (c, t) => `"${c.name} is still evaluating its position on ${t.toLowerCase()}. While we appreciate the outreach, you haven't addressed our concern about ${c.keywords[0]}. That's a prerequisite for any support. Be more specific about how you'll handle that."`,
  (c, t) => `"Interesting approach. ${c.name} notes that ${c.keywords[0]} is conspicuously absent from your proposal. We're not opposed in principle, but we need to understand how you'll accommodate that before we consider co-sponsoring."`,
  (c, t) => `"We've heard similar proposals before. What makes yours different is still unclear to ${c.name}. Specifically, how does your resolution address ${c.keywords[0]}? That's the key question for our delegation."`,
]

const NEGATIVE_RESPONSES: ((c: Country, topic: string) => string)[] = [
  (c, t) => `"${c.name} has serious concerns. Your proposal on ${t.toLowerCase()} doesn't mention ${c.keywords[0]} once. That's a non-starter for us. We cannot co-sponsor any resolution that ignores this fundamental issue."`,
  (c, t) => `"Respectfully, this doesn't address ${c.name}'s core interests. We've been clear that ${c.keywords[0]} must be front and center on any ${t.toLowerCase()} resolution. As currently framed, this proposal does not meet that bar."`,
]

export function generateRoleplayResponse(country: Country, playerMessage: string, topic: string): RoleplayResponse {
  const msgLower = playerMessage.toLowerCase()
  const keywords = country.keywords.map(k => k.toLowerCase())

  const mentionedCount = keywords.filter(k => msgLower.includes(k)).length
  const hasOffer = /(offer|provide|ensure|include|commit|fund|support|guarantee|willing|propose)/i.test(playerMessage)
  const hasQuestion = playerMessage.includes('?')
  const wordCount = playerMessage.trim().split(/\s+/).filter(Boolean).length

  if (wordCount < 12) {
    return {
      text: `"That's quite brief. ${country.name} would need to hear an actual proposal before responding. What specifically are you offering, and how does it address our priorities?"`,
      sentiment: 'neutral',
      hint: `Too short — a real delegate opening should be at least 2–3 sentences with a clear ask.`,
    }
  }

  let sentiment: 'positive' | 'neutral' | 'negative'
  let hint: string | undefined

  if (mentionedCount >= 2 && hasOffer) {
    sentiment = 'positive'
  } else if (mentionedCount >= 1 || (hasOffer && hasQuestion)) {
    sentiment = 'neutral'
    if (mentionedCount === 0) {
      hint = `Good offer, but ${country.name} cares most about "${country.keywords[0]}" — mention that specifically next time.`
    }
  } else {
    sentiment = 'negative'
    if (mentionedCount === 0 && !hasOffer) {
      hint = `You stated your position but made no offer and didn't address ${country.name}'s key interest: "${country.keywords[0]}". Always lead with what you'll give them.`
    } else if (!hasOffer) {
      hint = `You mentioned the right keywords but made no concrete offer. What will you actually give ${country.name} in exchange for their co-sponsorship?`
    }
  }

  const pool = sentiment === 'positive' ? POSITIVE_RESPONSES :
               sentiment === 'negative' ? NEGATIVE_RESPONSES : NEUTRAL_RESPONSES

  const fn = pool[Math.floor(Math.random() * pool.length)]

  return { text: fn(country, topic), sentiment, hint }
}
