export interface Country {
  name: string;
  code: string;
  region: string;
  position: string;
  keywords: string[];
  flag: string;
}

export interface Committee {
  name: string;
  fullName: string;
  description: string;
  topics: string[];
  icon: string;
}

export interface ProcedureItem {
  name: string;
  type: 'point' | 'motion';
  when: string;
  how: string;
  requires: string;
  vote?: string;
  example: string;
  tip: string;
}

export interface UnmodScenario {
  id: number;
  title: string;
  context: string;
  yourRole: string;
  objective: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  keyStakeholders: { country: string; interest: string; stance: string }[];
  tips: string[];
}

export const COUNTRIES: Country[] = [
  {
    name: 'United States', code: 'US', region: 'Western', flag: '🇺🇸',
    position: 'Champion of democracy, free markets, and human rights. Often leads international coalitions and prioritizes national security. Key member of NATO, G7, and G20.',
    keywords: ['democracy', 'freedom', 'security', 'alliance', 'sanctions', 'NATO', 'rule of law']
  },
  {
    name: 'China', code: 'CN', region: 'Asia-Pacific', flag: '🇨🇳',
    position: 'Advocates for state sovereignty, non-interference, and multipolarity. Leads Belt and Road Initiative. Opposes sanctions and Western-led military interventions.',
    keywords: ['sovereignty', 'non-interference', 'development', 'cooperation', 'multilateral', 'Belt and Road']
  },
  {
    name: 'Russia', code: 'RU', region: 'Eastern Europe', flag: '🇷🇺',
    position: 'Promotes multipolar world order and opposes NATO expansion. Frequently uses veto in Security Council. Emphasizes traditional sovereignty norms.',
    keywords: ['sovereignty', 'multipolar', 'security', 'veto', 'traditional values', 'sphere of influence']
  },
  {
    name: 'United Kingdom', code: 'GB', region: 'Western', flag: '🇬🇧',
    position: 'Post-Brexit "Global Britain" strategy. Strong on human rights, climate action, and international law. P5 member with global diplomatic reach.',
    keywords: ['human rights', 'international law', 'climate', 'diplomacy', 'multilateralism', 'P5']
  },
  {
    name: 'France', code: 'FR', region: 'Western', flag: '🇫🇷',
    position: 'Champions European unity, cultural diplomacy, and humanitarian law. Active in West Africa and the Sahel. Strong on climate and multilateralism.',
    keywords: ['multilateralism', 'humanitarian', 'climate', 'European', 'cultural', 'Sahel']
  },
  {
    name: 'Germany', code: 'DE', region: 'Western', flag: '🇩🇪',
    position: 'Economic powerhouse that advocates for diplomatic solutions over military force. Strong climate commitment. EU leadership and humanitarian law champion.',
    keywords: ['diplomacy', 'EU', 'climate', 'economic', 'human rights', 'multilateral', 'ODA']
  },
  {
    name: 'India', code: 'IN', region: 'Asia-Pacific', flag: '🇮🇳',
    position: 'World\'s largest democracy pursuing strategic autonomy. Climate justice advocate emphasizing historical emissions responsibility. Seeks permanent UNSC seat.',
    keywords: ['strategic autonomy', 'development', 'climate justice', 'sovereignty', 'reform', 'Global South']
  },
  {
    name: 'Brazil', code: 'BR', region: 'Latin America', flag: '🇧🇷',
    position: 'Amazon conservation, social development, and South-South cooperation. BRICS member advocating reformed global governance and climate finance.',
    keywords: ['Amazon', 'environment', 'development', 'BRICS', 'cooperation', 'forest', 'South-South']
  },
  {
    name: 'South Africa', code: 'ZA', region: 'Africa', flag: '🇿🇦',
    position: 'African solidarity, post-apartheid human rights tradition. AU leadership. Advocates for African solutions to African problems and UNSC reform.',
    keywords: ['Africa', 'human rights', 'solidarity', 'development', 'Pan-African', 'Ubuntu']
  },
  {
    name: 'Nigeria', code: 'NG', region: 'Africa', flag: '🇳🇬',
    position: 'Africa\'s largest economy and most populous nation. Advocates for African development, peacekeeping, continental representation, and debt relief.',
    keywords: ['Africa', 'development', 'peace', 'economic growth', 'representation', 'debt relief']
  },
  {
    name: 'Saudi Arabia', code: 'SA', region: 'Middle East', flag: '🇸🇦',
    position: 'Oil economy diversification (Vision 2030), OPEC leadership, regional stability. Cautious on human rights criticism. Islamic world leadership role.',
    keywords: ['stability', 'development', 'economic', 'regional', 'energy', 'Vision 2030', 'OPEC']
  },
  {
    name: 'Iran', code: 'IR', region: 'Middle East', flag: '🇮🇷',
    position: 'Opposes Western sanctions and intervention. Nuclear program as sovereignty right. Islamic Republic principles. Regional influence through proxy networks.',
    keywords: ['sovereignty', 'sanctions', 'resistance', 'Islamic', 'nuclear rights', 'anti-imperialism']
  },
  {
    name: 'Japan', code: 'JP', region: 'Asia-Pacific', flag: '🇯🇵',
    position: 'Peace constitution and pacifist tradition. Nuclear abolition advocate. World\'s top development aid contributor. US alliance with Indo-Pacific strategy.',
    keywords: ['peace', 'disarmament', 'nuclear abolition', 'ODA', 'cooperation', 'Indo-Pacific']
  },
  {
    name: 'Canada', code: 'CA', region: 'Western', flag: '🇨🇦',
    position: 'Middle power diplomacy and peacekeeping tradition. Multiculturalism model. Strong climate and human rights advocate. G7 member and high ODA contributor.',
    keywords: ['peacekeeping', 'multilateral', 'climate', 'human rights', 'multiculturalism', 'ODA']
  },
  {
    name: 'Australia', code: 'AU', region: 'Asia-Pacific', flag: '🇦🇺',
    position: 'Indo-Pacific security (AUKUS, Quad), climate action, Indigenous rights. Middle power with strong US alliance and regional leadership ambitions.',
    keywords: ['security', 'Pacific', 'climate', 'development', 'human rights', 'Indo-Pacific', 'AUKUS']
  },
  {
    name: 'Mexico', code: 'MX', region: 'Latin America', flag: '🇲🇽',
    position: 'Non-intervention (Estrada Doctrine), humanitarian migration approach. Drug trafficking crisis. Emerging economy with USMCA trade leadership.',
    keywords: ['non-intervention', 'sovereignty', 'migration', 'development', 'humanitarian', 'Estrada']
  },
  {
    name: 'Indonesia', code: 'ID', region: 'Asia-Pacific', flag: '🇮🇩',
    position: 'World\'s largest Muslim democracy, ASEAN centrality, non-alignment. Development focus, maritime sovereignty, active peacekeeping contributor.',
    keywords: ['ASEAN', 'non-alignment', 'development', 'democracy', 'peacekeeping', 'maritime']
  },
  {
    name: 'Kenya', code: 'KE', region: 'Africa', flag: '🇰🇪',
    position: 'East African hub and renewable energy leader (geothermal). Climate vulnerable nation. Active in AU and regional peace processes (Somalia, South Sudan).',
    keywords: ['Africa', 'climate', 'renewable energy', 'peace', 'development', 'East Africa']
  },
  {
    name: 'Egypt', code: 'EG', region: 'Africa/Middle East', flag: '🇪🇬',
    position: 'Arab world diplomatic hub, Suez Canal significance. Stability-over-democracy approach. Active in MENA diplomacy and Nile water rights negotiations.',
    keywords: ['Arab', 'stability', 'regional', 'development', 'Africa', 'MENA', 'Nile', 'Suez']
  },
  {
    name: 'Pakistan', code: 'PK', region: 'Asia-Pacific', flag: '🇵🇰',
    position: 'Kashmir dispute, nuclear power, Islamic solidarity. Balancing US-China relations. Climate vulnerability champion despite being a low-emissions nation.',
    keywords: ['Kashmir', 'sovereignty', 'Islamic solidarity', 'climate vulnerable', 'nuclear', 'development']
  },
  {
    name: 'Turkey', code: 'TR', region: 'Middle East/Europe', flag: '🇹🇷',
    position: 'NATO member pursuing strategic autonomy. Active mediator (Ukraine-Russia, grain deal). Ottoman legacy regional influence. Muslim world leader aspirations.',
    keywords: ['mediation', 'NATO', 'autonomous', 'regional', 'Turkic', 'Muslim world', 'Bosphorus']
  },
  {
    name: 'Sweden', code: 'SE', region: 'Western', flag: '🇸🇪',
    position: 'Humanitarian law champion, top ODA contributor. Feminist foreign policy. Strong climate action commitment. Transitioned from neutrality to NATO membership.',
    keywords: ['humanitarian', 'development', 'feminist foreign policy', 'climate', 'human rights', 'ODA']
  },
  {
    name: 'Norway', code: 'NO', region: 'Western', flag: '🇳🇴',
    position: 'Peace process facilitator (Oslo Accords tradition), highest per-capita ODA, Arctic governance. UNHCR and WFP top contributor. Mediator role.',
    keywords: ['peace', 'mediation', 'humanitarian', 'Arctic', 'development', 'UNHCR', 'Oslo']
  },
  {
    name: 'Cuba', code: 'CU', region: 'Latin America', flag: '🇨🇺',
    position: 'Anti-blockade champion, health diplomacy model, socialist system defender. Votes against US positions consistently. South-South medical cooperation.',
    keywords: ['blockade', 'sovereignty', 'health', 'anti-imperialism', 'socialist', 'self-determination']
  },
  {
    name: 'Ukraine', code: 'UA', region: 'Eastern Europe', flag: '🇺🇦',
    position: 'Sovereignty and territorial integrity champion post-2022 invasion. EU/NATO integration aspirant. Democratic values defender. Humanitarian crisis documentation.',
    keywords: ['sovereignty', 'territorial integrity', 'democracy', 'European', 'self-determination', 'security', 'aggression']
  },
];

export const COMMITTEES: Committee[] = [
  {
    name: 'DISEC', icon: '⚔️',
    fullName: 'First Committee – Disarmament & International Security',
    description: 'Deals with disarmament, arms control, and threats to international peace and security.',
    topics: [
      'Nuclear non-proliferation and disarmament',
      'Cybersecurity and digital warfare between states',
      'Small arms and light weapons trafficking',
      'Autonomous weapons systems and AI in warfare',
      'Space security and anti-satellite weapons',
      'Preventing weaponization of emerging technologies'
    ]
  },
  {
    name: 'SPECPOL', icon: '🕊️',
    fullName: 'Fourth Committee – Special Political & Decolonization',
    description: 'Addresses decolonization, UN peacekeeping operations, and special political issues.',
    topics: [
      'Palestinian refugee crisis and UNRWA funding',
      'UN peacekeeping reform and effectiveness',
      'Western Sahara self-determination',
      'Information technology in peacekeeping operations',
      'Decolonization of remaining non-self-governing territories',
      'Mine action and landmine clearance in post-conflict zones'
    ]
  },
  {
    name: 'ECOFIN', icon: '💹',
    fullName: 'Second Committee – Economic & Financial',
    description: 'Addresses international economic, development, and financial matters.',
    topics: [
      'Sustainable Development Goals (SDGs) financing gap',
      'Debt relief and restructuring for developing nations',
      'Cryptocurrency and digital financial regulation',
      'Global trade equity and WTO reform',
      'Foreign direct investment in least developed countries',
      'Economic impacts of climate change on small island states'
    ]
  },
  {
    name: 'SOCHUM', icon: '🤝',
    fullName: 'Third Committee – Social, Humanitarian & Cultural',
    description: 'Addresses social development, human rights, and humanitarian affairs.',
    topics: [
      'Refugee rights and protection of stateless persons',
      'Human trafficking and modern slavery eradication',
      'Gender equality and women\'s political empowerment',
      'Child labor and universal education access',
      'Freedom of expression and digital rights',
      'Indigenous peoples\' rights and land protections'
    ]
  },
  {
    name: 'Security Council', icon: '🛡️',
    fullName: 'UN Security Council',
    description: 'Primary responsibility for international peace and security. P5 hold veto power.',
    topics: [
      'Armed conflict and civilian protection',
      'Sanctions regime review and effectiveness',
      'Humanitarian corridor access in active conflicts',
      'International terrorism and foreign fighters',
      'Nuclear threats and non-proliferation enforcement',
      'Post-conflict reconstruction and transitional justice'
    ]
  },
  {
    name: 'WHO', icon: '🏥',
    fullName: 'World Health Organization',
    description: 'Addresses global public health challenges and international health governance.',
    topics: [
      'Pandemic preparedness and prevention treaty',
      'Universal health coverage (UHC) access',
      'Antimicrobial resistance global action plan',
      'Mental health as a global crisis',
      'Vaccine equity and fair distribution mechanisms',
      'Digital health data sovereignty'
    ]
  },
  {
    name: 'UNHRC', icon: '⚖️',
    fullName: 'UN Human Rights Council',
    description: 'Strengthens the promotion and protection of human rights worldwide.',
    topics: [
      'Racial discrimination and systemic racism',
      'Arbitrary detention and political prisoners',
      'LGBTQ+ rights and criminalization globally',
      'Human rights defenders protection',
      'Corporate accountability for human rights violations',
      'Digital surveillance, privacy, and freedom online'
    ]
  },
  {
    name: 'ENVIRO', icon: '🌍',
    fullName: 'UN Environment Assembly',
    description: 'Addresses global environmental challenges and sustainable development pathways.',
    topics: [
      'Climate change adaptation finance (Loss & Damage)',
      'Plastic pollution treaty and ocean health',
      'Deforestation, biodiversity loss, and nature restoration',
      'Just energy transition from fossil fuels',
      'Carbon pricing and market mechanisms',
      'Environmental justice for frontline communities'
    ]
  },
];

export const DIPLOMATIC_PHRASES = [
  'calls upon', 'strongly urges', 'notes with concern', 'notes with deep concern',
  'reaffirms', 'emphasizes', 'stresses', 'recognizes', 'acknowledges',
  'encourages', 'welcomes', 'condemns', 'deplores', 'expresses concern',
  'commends', 'requests', 'demands', 'invites', 'affirms', 'declares',
  'the delegation of', 'my delegation', 'our delegation', 'we firmly believe',
  'it is the position of', 'in accordance with', 'pursuant to',
  'as outlined in resolution', 'calls for immediate action',
  'urges member states', 'international community', 'cooperation among',
  'sustainable development', 'territorial integrity', 'sovereignty',
  'humanitarian assistance', 'peaceful resolution', 'diplomatic channels',
  'comprehensive solution', 'multilateral approach', 'global partnership',
  'in the interest of', 'bearing in mind', 'taking into account',
  'deeply concerned', 'fully committed', 'strongly believes'
];

export const PROCEDURE_ITEMS: ProcedureItem[] = [
  {
    name: 'Point of Order',
    type: 'point',
    when: 'When you believe the rules of procedure are being violated during committee session',
    how: 'Stand and say "Point of Order" — this interrupts the current speaker',
    requires: 'Chair must recognize immediately. No second needed.',
    example: '"Point of Order. The delegate has exceeded their allotted speaking time by over 30 seconds."',
    tip: 'Only use for procedural violations — NOT to comment on speech content. Misuse annoys chairs and loses credibility.'
  },
  {
    name: 'Point of Parliamentary Inquiry',
    type: 'point',
    when: 'When you have a question about parliamentary procedure — NOT substance or content',
    how: 'Wait for the floor to be available, then say "Point of Parliamentary Inquiry"',
    requires: 'Chair discretion to recognize. Lower priority than Points of Order.',
    example: '"Point of Parliamentary Inquiry. Does a motion to extend the unmoderated caucus require a simple majority or two-thirds majority?"',
    tip: 'Ask before the session if you can. Using this during debate signals you didn\'t prep — it\'s not a good look.'
  },
  {
    name: 'Point of Personal Privilege',
    type: 'point',
    when: 'When something physically prevents you from participating (can\'t hear, room too cold, technical issues)',
    how: 'May interrupt the current speaker only for urgent physical concerns',
    requires: 'Chair\'s discretion. Misuse is considered rude.',
    example: '"Point of Personal Privilege. The microphone is not functioning and I cannot hear the speaker at the podium."',
    tip: 'ONLY use for genuine physical needs. Using this to comment on content or as a delay tactic is a major red flag for judges.'
  },
  {
    name: 'Point of Information (to Speaker)',
    type: 'point',
    when: 'When the current speaker has yielded to points of information and you want to ask them a question',
    how: 'Wait for speaker to yield, then raise placard. Chair recognizes you for one question.',
    requires: 'Speaker must explicitly yield to POIs after their speech.',
    example: '"To the previous speaker: How does your delegation\'s proposed fund address the needs of small island developing states specifically?"',
    tip: 'POIs are strategic gold. Ask a sharp question that exposes a weakness in their argument. Don\'t waste it on easy softballs.'
  },
  {
    name: 'Motion for Moderated Caucus',
    type: 'motion',
    when: 'To open structured, focused debate on a specific subtopic — most common motion',
    how: 'State: (1) total caucus time, (2) individual speaking time, (3) specific topic/purpose',
    requires: 'Simple majority vote. Chair may rule out of order if poorly formed.',
    vote: 'Simple majority',
    example: '"The delegation of Germany motions for a 15-minute moderated caucus with 60-second speaking time to discuss verification mechanisms for nuclear disarmament agreements."',
    tip: 'Be specific about the subtopic — vague motions ("to discuss the topic") often lose to competitors with clearer focus. The more specific, the better.'
  },
  {
    name: 'Motion for Unmoderated Caucus',
    type: 'motion',
    when: 'To allow delegates to informally negotiate, draft working papers, or lobby for blocs',
    how: 'State the total time requested and briefly state the purpose',
    requires: 'Simple majority vote',
    vote: 'Simple majority',
    example: '"The delegation of France motions for a 20-minute unmoderated caucus to allow delegations to work collaboratively on draft resolution language."',
    tip: 'Call for an unmod when you have a clear lobbying goal. Use the time aggressively — don\'t just socialize, secure signatories and merge papers.'
  },
  {
    name: 'Motion to Open Speakers List',
    type: 'motion',
    when: 'At the start of substantive debate or after returning from a caucus',
    how: 'Simply state the motion when recognized by the Chair',
    requires: 'Simple majority',
    vote: 'Simple majority',
    example: '"The delegation of Japan motions to open the speakers list."',
    tip: 'Get on the speakers list EARLY. First speakers set the tone and get more airtime. Sign up as soon as it opens — don\'t wait.'
  },
  {
    name: 'Motion to Close Speakers List',
    type: 'motion',
    when: 'When you want to signal debate is wrapping up and limit new speakers from joining',
    how: 'State the motion — note this does NOT end debate, just stops new additions',
    requires: 'Simple majority. Can be reopened by another simple majority motion.',
    vote: 'Simple majority',
    example: '"The delegation of China motions to close the speakers list."',
    tip: 'Closing the list early is a tactical move. If you\'re a late speaker and the list closes before you sign up, you may miss your chance to speak!'
  },
  {
    name: 'Motion to Table Topic',
    type: 'motion',
    when: 'To suspend consideration of a topic entirely for the remainder of the session',
    how: 'Make the motion clearly stating which topic — this is a high-stakes, drastic move',
    requires: 'Two-thirds majority — very high bar. Rarely succeeds.',
    vote: 'Two-thirds majority',
    example: '"The delegation of Russia motions to table the topic of cybersecurity sanctions and move to the next topic on the agenda."',
    tip: 'Think carefully before tabling a topic — you might table something you actually want debated. Usually a blocking tactic by countries who dislike the topic.'
  },
  {
    name: 'Motion to Move to Previous Question',
    type: 'motion',
    when: 'To immediately end debate and proceed directly to voting procedures',
    how: 'State clearly which resolution or amendment you\'re moving to vote on',
    requires: 'Two-thirds majority — use only when you\'re confident you have the votes to pass the resolution',
    vote: 'Two-thirds majority',
    example: '"The delegation of the United Kingdom motions to move to the previous question and proceed to voting on draft resolution 1.1."',
    tip: 'Dangerous if you miscalculate. If your bloc isn\'t ready to vote and someone calls this, your resolution could fail. Count votes before calling this.'
  },
  {
    name: 'Right of Reply',
    type: 'point',
    when: 'When your nation\'s dignity or integrity has been directly and personally attacked by a speaker',
    how: 'Submit a written request to the Chair immediately after the speech. Not recognized during speech.',
    requires: 'Chair\'s exclusive discretion. Must be a direct attack on your country, not just disagreement.',
    example: '"The delegation of [Country] requests a Right of Reply. The previous speaker made a false and defamatory claim about our country\'s human rights record that demands response."',
    tip: 'Right of Reply is powerful but rare. Don\'t waste it on minor disagreements — save it for genuine attacks on your country\'s character. Judges respect delegates who use it sparingly and precisely.'
  },
  {
    name: 'Motion to Extend Debate',
    type: 'motion',
    when: 'When a caucus or debate period needs more time to reach consensus',
    how: 'State how much additional time you are requesting',
    requires: 'Simple majority. Usually only one extension is allowed per original motion.',
    vote: 'Simple majority',
    example: '"The delegation of India motions to extend the current unmoderated caucus by an additional 10 minutes to finalize working paper language."',
    tip: 'Only call for an extension if you have a productive reason — "we need more time" isn\'t enough. Tell the committee WHAT will be accomplished in the extra time.'
  },
];

export const UNMOD_SCENARIOS: UnmodScenario[] = [
  {
    id: 1,
    title: 'Climate Finance Coalition',
    context: 'ENVIRO is debating climate finance. Developed vs. developing nation blocs are at an impasse. You need to broker a deal before the session ends.',
    yourRole: 'Germany — lead EU negotiator',
    objective: 'Get Brazil, India, and Nigeria to co-sponsor your working paper committing developed nations to contribute 0.5% GDP to the Green Climate Fund.',
    difficulty: 'Medium',
    keyStakeholders: [
      { country: 'Brazil 🇧🇷', interest: 'Wants Amazon protection funds AND development rights preserved', stance: 'Cautiously supportive if specific Amazon funding language is included' },
      { country: 'India 🇮🇳', interest: 'Needs climate finance, but refuses any cap on development emissions', stance: 'Resistant unless "climate justice" framing and historical responsibility are explicitly acknowledged' },
      { country: 'Nigeria 🇳🇬', interest: 'Wants adaptation funding, not just mitigation money', stance: 'Flexible swing vote — win them and the African Group likely follows' },
      { country: 'China 🇨🇳', interest: 'Does NOT want to be classified as "developed" for finance obligations', stance: 'Will fund its own South-South climate cooperation but not the Western-led GCF' },
    ],
    tips: [
      'Lead with what YOU are offering, not what you want from them',
      'The phrase "climate justice" and "historical responsibility" is the key to winning India',
      'Brazil cares more about Amazon-specific funding than abstract global pledges',
      'Nigeria is your swing vote — win them privately and the African Group often follows',
      'Never put China in the "developed nations" category or you\'ll lose them instantly',
      'Offer Germany as the first signatory on the 0.5% commitment — lead by example'
    ]
  },
  {
    id: 2,
    title: 'Veto Avoidance: Security Council',
    context: 'You\'re drafting a Security Council resolution on humanitarian access in an active conflict. Russia and China have signaled veto threats over the language.',
    yourRole: 'France — P5 sponsor of the resolution',
    objective: 'Soften resolution language enough to avoid a Russian/Chinese veto while keeping the humanitarian substance intact.',
    difficulty: 'Hard',
    keyStakeholders: [
      { country: 'Russia 🇷🇺', interest: 'Opposes any language implying mandatory compliance or regime-change framing', stance: 'Will veto if resolution uses "demands" or implies Chapter VII enforcement' },
      { country: 'China 🇨🇳', interest: 'Non-interference principle, sovereignty language is sacred', stance: 'May abstain — not veto — if language acknowledges state sovereignty' },
      { country: 'USA 🇺🇸', interest: 'Wants strong enforcement language and accountability mechanisms', stance: 'Your ally but overplays their hand — manage their expectations privately' },
      { country: 'UK 🇬🇧', interest: 'Co-sponsor, wants the resolution to pass more than to keep original language', stance: 'Will follow your lead on compromise language' },
    ],
    tips: [
      'Replace "demands" with "strongly urges" — often enough for China to abstain instead of veto',
      'Russia will veto "condemns" — try "notes with deep concern" instead',
      'An abstention is a WIN for you. You only need 9 yes votes + no veto.',
      'Offer Russia a separate bilateral on implementation mechanisms — give them a face-saving out',
      'Add "reaffirming state sovereignty" to the preamble — costs nothing, saves the resolution',
      'USA\'s maximalist demands make it harder to pass; privately ask them to accept "strongly urges" language'
    ]
  },
  {
    id: 3,
    title: 'Working Paper Merger: SOCHUM',
    context: 'SOCHUM has three competing working papers on human trafficking. The dais wants one unified draft resolution by end of session.',
    yourRole: 'Sweden — lead author of WP 1.1 (strongest victim-centered approach)',
    objective: 'Merge your WP with USA\'s WP 1.2 and India\'s WP 1.3 without losing victim-centered language and prosecution frameworks.',
    difficulty: 'Medium',
    keyStakeholders: [
      { country: 'USA 🇺🇸', interest: 'Wants strong prosecution and law enforcement language', stance: 'Cooperative but wants lead sponsorship credit — offer co-lead' },
      { country: 'India 🇮🇳', interest: 'Concerned about conflation of trafficking with migration and smuggling', stance: 'Valid concern — their distinction would actually strengthen the resolution' },
      { country: 'Thailand 🇹🇭', interest: 'Tourism and fishing industry protection — fears overly broad language', stance: 'Will block or abstain if language sweeps up labor practices too broadly' },
      { country: 'Philippines 🇵🇭', interest: 'Major migrant-sending country wanting strong worker protections', stance: 'Natural ally — secure them early for legitimacy and bloc solidarity' },
    ],
    tips: [
      'Start by identifying 3 clauses in your WP that are absolutely non-negotiable',
      'Give USA co-lead sponsorship credit — they\'ll soften other demands for it',
      'India\'s trafficking vs. smuggling distinction is actually correct and improves the resolution',
      'Preambulatory clauses can acknowledge Thailand\'s concerns without weakening operative language',
      'Philippines is your automatic ally — secure them first, it gives you credibility',
      'Frame the merger as "combining the best of all three papers" — everyone gets a win'
    ]
  },
  {
    id: 4,
    title: 'Crisis Committee: Cyber Attribution',
    context: 'Emergency crisis session. A nation-state cyberattack just disabled major global financial infrastructure. The committee needs to act in 45 minutes.',
    yourRole: 'Japan — affected nation and Indo-Pacific tech leader',
    objective: 'Build support for an emergency attribution mechanism and targeted measures against the perpetrator state.',
    difficulty: 'Hard',
    keyStakeholders: [
      { country: 'USA 🇺🇸', interest: 'Wants action but won\'t accept a permanent international attribution body that could expose their own capabilities', stance: 'Support targeted measures but not institutional mechanisms' },
      { country: 'Germany 🇩🇪', interest: 'EU economic interests hit, rule of law champion', stance: 'Strong ally — push for international law framing together' },
      { country: 'Russia 🇷🇺', interest: 'Potentially responsible; will block any attribution mechanisms', stance: 'Will delay, water down, and obfuscate evidence' },
      { country: 'China 🇨🇳', interest: 'Also has offensive capabilities, protects non-interference norm', stance: 'Will abstain if "targeted measures" language replaces "sanctions"' },
    ],
    tips: [
      'Frame attribution as "technical, not political" — this wins over hesitant USA',
      'Propose a time-limited expert panel (not a permanent body) — less threatening to major powers',
      'Never say "sanctions" with China in the room — use "targeted measures" or "proportional response"',
      'Germany + EU bloc = powerful mathematical majority, use it',
      'Crisis committees move fast — have your draft resolution language ready BEFORE the unmod ends',
      'Document the attack\'s impact with numbers: "$X billion in losses" lands better than vague claims'
    ]
  },
  {
    id: 5,
    title: 'African Group Bloc Coordination',
    context: 'Pre-vote African Group coordination caucus on a debt relief and restructuring resolution. You need 54 votes moving in the same direction.',
    yourRole: 'South Africa — African Group coordinator in the GA',
    objective: 'Achieve bloc cohesion and get all AU member states to support the resolution as-written without amendments that weaken it.',
    difficulty: 'Easy',
    keyStakeholders: [
      { country: 'Nigeria 🇳🇬', interest: 'Oil revenue protection clauses — doesn\'t want fossil fuel references to debt', stance: 'Usually asserts leadership; meet them as equals, not subordinates' },
      { country: 'Egypt 🇪🇬', interest: 'Sometimes aligns with Arab Group over African Group when interests diverge', stance: 'Secure them early — if they defect, Morocco and Tunisia may follow' },
      { country: 'Kenya 🇰🇪', interest: 'East African integration champion, your natural ally', stance: 'Strong yes — will help you lobby others if asked' },
      { country: 'Ethiopia 🇪🇹', interest: 'Development language required; GERD dispute separate', stance: 'Supportive if development framing is strong and water rights not conflated' },
    ],
    tips: [
      'Bloc cohesion is power — open with "54 votes" and remind everyone that unity = leverage',
      'Acknowledge Nigeria as a co-leader, not a follower — they have their own ambitions',
      'Address Egypt\'s concerns privately first; a public defection is harder to recover from',
      'Anchor your pitch in the Ezulwini Consensus — it\'s African Group\'s own agreed position',
      'One defection can trigger a cascade — identify waverers and give them private face-saving language',
      'Kenya will do outreach for you if you ask — delegate the lobbying, don\'t do it all yourself'
    ]
  }
];

export const SPEECH_OPENERS = [
  'Honorable Chair, distinguished delegates,',
  'Mr./Ms. Chair, honorable delegates,',
  'Respected Chair and fellow delegates,',
  'Esteemed Chair, distinguished delegates, and guests,',
];

export const SPEECH_CLOSERS = [
  'The delegation of [Country] yields the floor.',
  'For these reasons, [Country] calls upon all member states to join this effort. Thank you.',
  '[Country] urges the committee to act decisively on this critical matter. We yield the floor.',
  'The delegation of [Country] thanks the Chair and all delegates. We yield.',
];
