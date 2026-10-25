export interface TechItem {
  name: string
  isAddition?: boolean
  note: string
}

export interface TechGroup {
  title: string
  page: 1 | 2
  items: TechItem[]
}

export interface CutoutPhoto {
  src: string
  caption: string
  tilt: number
}

export interface AchievementEntry {
  id: string
  title: string
  badgeText: string
  dateNote: string
  summary: string
  bulletNotes: string[]
  photos: CutoutPhoto[]
}

export interface ProjectEntry {
  id: string
  title: string
  category: string
  desc: string
  tech: string[]
  img: string
  tilt: number
  note: string
  link?: string
}

export interface CertEntry {
  id: string
  title: string
  issuer: string
  year: string
  img: string
  tilt: number
  note: string
}

export const TECH_GROUPS: TechGroup[] = [
  {
    title: 'Frontend Development',
    page: 1,
    items: [
      { name: 'HTML5', note: 'Semantic markup, native dialog APIs, and accessible document structure.' },
      { name: 'CSS3', note: 'Custom properties, 3D transforms, ruled notebook grids, and responsive layouts.' },
      { name: 'JavaScript', note: 'Core language for interactive web apps, DOM choreography, and async logic.' },
      { name: 'Tailwind CSS', note: 'Fast utility-driven styling and design token systems.' },
      { name: 'Bootstrap', note: 'Rapid layout prototyping and legacy responsive web dashboards.' },
      { name: 'React', note: 'Component architecture, custom hooks, and interactive stateful interfaces.' },
      { name: 'Vite', note: 'Instant dev server and optimized production bundling for modern web apps.' },
      { name: 'TypeScript', isAddition: true, note: 'Strict static typing across React components and backend contracts.' },
      { name: 'GSAP', isAddition: true, note: 'Timeline choreography, 3D page turns, and 60fps tactile animations.' },
    ],
  },
  {
    title: 'Mobile Development',
    page: 1,
    items: [
      { name: 'Flutter', note: 'Cross-platform mobile apps with custom widget trees and fluid animations.' },
      { name: 'Dart', note: 'Sound null-safety, async streams, and clean mobile application logic.' },
      { name: 'Android Studio', note: 'Device emulation, profiling, debugging, and native Android builds.' },
    ],
  },
  {
    title: 'Backend Development',
    page: 1,
    items: [
      { name: 'Node.js', note: 'Event-driven server runtime for APIs, realtime tools, and build scripts.' },
      { name: 'Express.js', note: 'Lightweight routing, middleware chains, and backend service endpoints.' },
      { name: 'Java', note: 'Object-oriented systems, data structures, and certified foundations.' },
      { name: 'Python', note: 'Automation scripts, data tooling, and rapid algorithm prototyping.' },
      { name: 'C', note: 'Low-level memory fundamentals, pointers, and systems programming.' },
      { name: 'C++', note: 'Performance-critical algorithms and competitive programming problem solving.' },
      { name: 'REST APIs', isAddition: true, note: 'Clean JSON contracts, authentication flows, and client-server integration.' },
    ],
  },
  {
    title: 'Game Development',
    page: 1,
    items: [
      { name: 'Godot', note: 'Node-based 2D and 3D game engine for indie prototypes and mechanics.' },
      { name: 'GDScript', isAddition: true, note: 'Gameplay scripting for physics, state machines, and scene signals in Godot.' },
    ],
  },
  {
    title: 'Databases',
    page: 2,
    items: [
      { name: 'MySQL', note: 'Relational schema design, joins, indexing, and transactional queries.' },
      { name: 'MongoDB', note: 'Document-oriented collections and flexible schema modeling for Node apps.' },
      { name: 'Firebase', note: 'Realtime syncing, authentication, and fast mobile/web backend setup.' },
      { name: 'Supabase', note: 'Open-source Postgres backend with row-level security and realtime hooks.' },
      { name: 'PostgreSQL', isAddition: true, note: 'Production relational database powering Supabase and structured apps.' },
      { name: 'SQLite', isAddition: true, note: 'Embedded local storage for Flutter mobile apps and offline-first tools.' },
    ],
  },
  {
    title: 'AI Tools',
    page: 2,
    items: [
      { name: 'Codex', isAddition: true, note: "OpenAI's autonomous coding agent for multi-step code generation, editing, and task execution." },
      { name: 'Antigravity', isAddition: true, note: "Google's agentic IDE for orchestrating multi-agent coding and browser workflows." },
      { name: 'Claude Code', isAddition: true, note: "Anthropic's CLI coding agent for deep codebase comprehension and autonomous refactoring." },
      { name: 'OpenCode', isAddition: true, note: 'Open-source terminal agent for agentic dev workflows and tool orchestration.' },
    ],
  },
  {
    title: 'Tools & Platforms',
    page: 2,
    items: [
      { name: 'Git', note: 'Branching workflows, clean commit histories, and team collaboration.' },
      { name: 'Postman', note: 'Testing API endpoints, inspecting payloads, and automating collections.' },
      { name: 'Render', note: 'Cloud hosting for full-stack Node services and web deployments.' },
      { name: 'GitHub', isAddition: true, note: 'Code hosting, pull requests, and collaborative hackathon workflows.' },
      { name: 'VS Code', isAddition: true, note: 'Daily driver code editor configured for TypeScript, React, and Python.' },
      { name: 'Vercel', isAddition: true, note: 'Zero-config edge deployment for React and Vite frontend projects.' },
      { name: 'Figma', isAddition: true, note: 'Wireframing UI layouts, paper mockups, and component systems before coding.' },
    ],
  },
]

export const ACHIEVEMENTS: AchievementEntry[] = [
  {
    id: 'hack4gov-2025',
    title: 'Hack4Gov 2025',
    badgeText: '2ND RUNNER UP',
    dateNote: 'Field Log: 2025 Competition',
    summary:
      'Competed in Hack4Gov 2025 as team Brute4z, tackling high-pressure challenges alongside my teammates. We placed 2nd Runner Up — analyzing problems on the spot and shipping under a strict timer.',
    bulletNotes: [
      'Placed 2nd Runner Up as team Brute4z',
      'Collaborated under time pressure with zero room for hesitation',
      'Applied security, backend, and problem-solving fundamentals live',
      'Taped these two photos right into the diary after the final buzzer',
    ],
    photos: [
      {
        src: '/achievements/hack4gov_2025_1.jpg',
        caption: '2nd Runner Up — Team Brute4z at Hack4Gov 2025',
        tilt: -2.2,
      },
      {
        src: '/achievements/hack4gov_2025_2.jpg',
        caption: 'After surviving the competition rounds!',
        tilt: 2.4,
      },
    ],
  },
  {
    id: 'appbuilders-ph',
    title: 'AppBuilders PH (9th Place)',
    badgeText: '9TH PLACE WINNER',
    dateNote: 'National App Competition',
    summary:
      'Earned 9th Place in AppBuilders Philippines! Our team designed, engineered, and pitched a working software application from concept to live demo.',
    bulletNotes: [
      'Turned a raw problem statement into a polished, working app prototype',
      'Handled architecture, UI execution, and live pitching to judges',
      'Proof that late-night debugging and coffee actually pay off',
    ],
    photos: [
      {
        src: '/achievements/AppBuildersPH_9thPlace_1.jpg',
        caption: 'Stage moment at AppBuilders PH',
        tilt: -2.5,
      },
      {
        src: '/achievements/AppBuildersPH_9thPlace_2.png',
        caption: 'Official 9th Place recognition',
        tilt: 1.8,
      },
      {
        src: '/achievements/AppBuildersPH_9thPlace_3.jpg',
        caption: 'With the whole team on competition day',
        tilt: 2.2,
      },
      {
        src: '/achievements/AppBuildersPH_9thPlace_4.jpg',
        caption: 'Post-pitch celebration snapshot',
        tilt: -1.6,
      },
    ],
  },
]

export const PROJECTS: ProjectEntry[] = [
  {
    id: 'proj-wattwise',
    title: 'WattWise',
    category: '★ Capstone Project',
    desc: 'AI-Based Smart Appliance Energy Consumption Monitoring and Optimization System with Predictive Cost Analysis.',
    tech: ['Flutter', 'Python', 'IoT', 'AI / ML'],
    img: '/project-images/project7.jpg',
    tilt: -1.6,
    note: 'Our academic capstone project — smart energy monitoring & predictive cost breakdown.',
    link: 'https://www.wattwise-app.site/',
  },
  {
    id: 'proj-carm',
    title: 'Carm',
    category: 'CRM & Workspace PWA',
    desc: 'Progressive Web App combining CRM, deals, project tasks, multi-currency invoicing, and team collaboration into a unified workspace.',
    tech: ['Next.js', 'TypeScript', 'Supabase', 'PWA'],
    img: '/project-images/project8.jpg',
    tilt: 1.8,
    note: 'Centralizes customer relationships, deal pipelines & invoicing into one offline-ready PWA.',
    link: 'https://carmhq.vercel.app/',
  },
  {
    id: 'proj-1',
    title: 'REVU: Gamified Flashcards',
    category: 'Mobile Learning App',
    desc: 'Interactive flashcard application designed to make studying more engaging through review sessions, progression tracking, and rewards.',
    tech: ['Android Studio', 'Java', 'SQL'],
    img: '/project-images/project1.png',
    tilt: -1.8,
    note: 'Helps students stay motivated while reviewing and remembering learning materials.',
  },
  {
    id: 'proj-5',
    title: 'Strumm',
    category: 'Mobile Guitar Tuner',
    desc: 'Mobile guitar-tuning application with real-time pitch detection, tuning feedback, and support for different guitar tuning modes.',
    tech: ['Flutter', 'Supabase'],
    img: '/project-images/project5.png',
    tilt: -2.2,
    note: 'Helps guitar players tune their instruments more accurately and easily.',
  },
  {
    id: 'proj-4',
    title: 'Slimeee',
    category: '2D Game',
    desc: 'Interactive 2D game created with the Godot Engine, featuring colorful visuals and engaging gameplay mechanics.',
    tech: ['Godot'],
    img: '/project-images/project4.png',
    tilt: 1.9,
    note: 'Turns a simple game concept into an entertaining and interactive player experience.',
  },
  {
    id: 'proj-3',
    title: 'SMARTEVENT',
    category: 'Event Management App',
    desc: 'Event management application for discovering events, viewing event details, booking activities, communicating with attendees, and checking event history.',
    tech: ['Flutter', 'Supabase'],
    img: '/project-images/project3.png',
    tilt: -1.4,
    note: 'Keeps event discovery, booking, and attendee communication organized in one place.',
  },
  {
    id: 'proj-2',
    title: 'Fastfood Ordering App',
    category: 'Mobile Ordering App',
    desc: 'Mobile food-ordering application for browsing menus, managing customer details, selecting items, reviewing orders, and choosing a payment method.',
    tech: ['Android Studio', 'Java', 'Supabase'],
    img: '/project-images/project2.png',
    tilt: 2.1,
    note: 'Makes ordering food faster and more convenient for customers.',
  },
  {
    id: 'proj-6',
    title: 'Fishdex Catch Log',
    category: 'Fishing Companion App',
    desc: 'Fishing catch-log application that allows users to record catches, save fishing spots, upload photos, and manage their personal fish collection.',
    tech: ['Flutter', 'Supabase'],
    img: '/project-images/project6.png',
    tilt: 1.5,
    note: 'Helps anglers keep their fishing memories, catch records, and locations organized.',
  },
]

export const CERTIFICATES: CertEntry[] = [
  {
    id: 'cert-ai',
    title: 'AI Certification',
    issuer: 'Certification Exam',
    year: 'Verified',
    img: '/certificates/damondamon-AI-certificate.jpg',
    tilt: -2.0,
    note: 'Machine learning fundamentals, neural networks, and AI applications.',
  },
  {
    id: 'cert-prompting',
    title: 'Prompting Essentials',
    issuer: 'Certification Exam',
    year: 'Verified',
    img: '/certificates/damondamon-prompting-essentials-certificate.jpg',
    tilt: 1.7,
    note: 'Crafting effective prompts and guiding AI outputs with precision.',
  },
  {
    id: 'cert-db',
    title: 'Databases Certification',
    issuer: 'IT Specialist',
    year: 'Verified',
    img: '/certificates/damondamon-databases-certificate.png',
    tilt: 2.1,
    note: 'Relational design, SQL queries, normalization, and data integrity.',
  },
  {
    id: 'cert-java',
    title: 'Java Foundations',
    issuer: 'Certification Exam',
    year: 'Verified',
    img: '/certificates/damondamon-javafoundations-Certificate.jpg',
    tilt: -1.8,
    note: 'Core OOP, classes, inheritance, and exception handling in Java.',
  },
  {
    id: 'cert-networking',
    title: 'Networking Certification',
    issuer: 'Certification Exam',
    year: 'Verified',
    img: '/certificates/damondamon-networking-certificate.jpg',
    tilt: 1.5,
    note: 'Network protocols, TCP/IP, routing, and infrastructure fundamentals.',
  },
  {
    id: 'cert-word',
    title: 'Word 2019 Associate',
    issuer: 'Microsoft Office Specialist',
    year: 'Verified',
    img: '/certificates/damondamon-word-2019-associate-certificate.jpg',
    tilt: 1.6,
    note: 'Document automation, structured templates, and technical formatting.',
  },
  {
    id: 'cert-codechum-5th',
    title: 'NPC 2025 · 5th Place',
    issuer: 'CodeChum',
    year: '2025',
    img: '/certificates/codechumrecog_certificate.jpg',
    tilt: -1.8,
    note: 'Won 5th place in Group Stage 1 of the CodeChum National Programming Challenge 2025.',
  },
  {
    id: 'cert-codechum-participation',
    title: 'NPC 2025 Participation',
    issuer: 'CodeChum',
    year: '2025',
    img: '/certificates/codechumparticipatio-certificate.jpg',
    tilt: 1.9,
    note: 'Certificate of Participation in Group Stage 1 of the National Programming Challenge Season 2.',
  },
  {
    id: 'cert-ppt',
    title: 'PowerPoint 2019 Associate',
    issuer: 'Microsoft Office Specialist',
    year: 'Verified',
    img: '/certificates/damondamon-powerPoint-2019-Associate-certificate.jpg',
    tilt: -2.0,
    note: 'Pitch deck storytelling and visual presentation structure.',
  },
]

export interface NavTabItem {
  id: string
  label: string
  shortLabel?: string
  targetPage: number
  spreadIndexes: number[]
  mobilePages: number[]
  exactPages: number[]
}

export const NAV_TABS: NavTabItem[] = [
  { id: 'intro', label: 'Intro', shortLabel: 'Intro', targetPage: 0, spreadIndexes: [0], mobilePages: [0], exactPages: [0] },
  { id: 'me', label: 'Me', shortLabel: 'Me', targetPage: 1, spreadIndexes: [0], mobilePages: [1], exactPages: [1] },
  { id: 'tech', label: 'Tech Stack', shortLabel: 'Tech', targetPage: 2, spreadIndexes: [1], mobilePages: [2, 3], exactPages: [2, 3] },
  { id: 'achievements', label: 'Achievements', shortLabel: 'Awards', targetPage: 4, spreadIndexes: [2], mobilePages: [4, 5], exactPages: [4, 5] },
  { id: 'projects', label: 'Projects', shortLabel: 'Projects', targetPage: 6, spreadIndexes: [3, 4], mobilePages: [6, 7, 8], exactPages: [6, 7, 8, 9] },
  { id: 'certs', label: 'Certs', shortLabel: 'Certs', targetPage: 10, spreadIndexes: [5], mobilePages: [10], exactPages: [10] },
  { id: 'notes', label: 'Notes', shortLabel: 'Notes', targetPage: 11, spreadIndexes: [5], mobilePages: [11], exactPages: [11] },
]

export interface MobilePageTab {
  id: string
  label: string
  page: number
}

// One thumb-index tab per mobile page (desktop grouped tabs stay in NAV_TABS).
// Page 9 is the blank desktop spread-filler and is skipped in 1-page mode.
// Short diary-voice labels; repeated labels per section are intentional.
export const MOBILE_PAGE_TABS: MobilePageTab[] = [
  { id: 'intro', label: 'Intro', page: 0 },
  { id: 'me', label: 'Me', page: 1 },
  { id: 'tech-1', label: 'Tech', page: 2 },
  { id: 'tech-2', label: 'Tech', page: 3 },
  { id: 'awards-1', label: 'Award', page: 4 },
  { id: 'awards-2', label: 'Award', page: 5 },
  { id: 'projects-1', label: 'Proj', page: 6 },
  { id: 'projects-2', label: 'Proj', page: 7 },
  { id: 'projects-3', label: 'Proj', page: 8 },
  { id: 'certs', label: 'Cert', page: 10 },
  { id: 'notes', label: 'Note', page: 11 },
]

export interface SpreadMeta {
  spreadIndex: number
  tabLabel: string
  leftPageTitle: string
  rightPageTitle: string
  mascotSpeech: string
}

export const SPREADS_META: SpreadMeta[] = [
  {
    spreadIndex: 0,
    tabLabel: 'Intro & Me',
    leftPageTitle: 'Intro Logbook',
    rightPageTitle: 'About Louis (Gabo)',
    mascotSpeech: 'Grab a page corner to flip, or use the Left/Right arrow keys!',
  },
  {
    spreadIndex: 1,
    tabLabel: 'Tech Stack',
    leftPageTitle: 'Tech Arsenal',
    rightPageTitle: 'Tech Arsenal',
    mascotSpeech: 'Click any tool chip to read my margin notes on how I use it!',
  },
  {
    spreadIndex: 2,
    tabLabel: 'Achievements',
    leftPageTitle: 'Hack4Gov 2025',
    rightPageTitle: 'AppBuilders PH (9th)',
    mascotSpeech: 'Real competition photos cut out and taped right in. Click any pic to zoom!',
  },
  {
    spreadIndex: 3,
    tabLabel: 'Projects',
    leftPageTitle: 'Shipped Work',
    rightPageTitle: 'More Builds',
    mascotSpeech: 'Capstone WattWise, Carm PWA, and mobile apps I shipped — tap any clipping!',
  },
  {
    spreadIndex: 4,
    tabLabel: 'Projects',
    leftPageTitle: 'More Builds',
    rightPageTitle: 'Blank Page',
    mascotSpeech: 'Fast food ordering app and fishing companion app — tap to zoom!',
  },
  {
    spreadIndex: 5,
    tabLabel: 'Certs & Notes',
    leftPageTitle: 'Official Certificates',
    rightPageTitle: 'Pass Me a Note',
    mascotSpeech: '9 verified credentials & competition awards taped in — tap to zoom!',
  },
]
