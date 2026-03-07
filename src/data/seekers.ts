export interface Seeker {
  id: string;
  name: string;
  avatar: string;
  title: string;
  location: string;
  bio: string;
  experience: string;
  skills: string[];
  availability: "Immediate" | "2 weeks" | "1 month" | "Flexible";
  seniority?: string;
  summary?: string;
  work_mode?: string;
  employment_type?: string;
  salary_min?: number;
  salary_max?: number;
  experience_entries?: {
    title: string;
    company: string;
    startDate: string;
    endDate: string;
    bullets: string[];
  }[];
  links?: {
    portfolio?: string;
    github?: string;
    linkedin?: string;
    website?: string;
  };
  cv_url?: string;
  last_active?: string;
}

const today = new Date();
const daysAgo = (d: number) => new Date(today.getTime() - d * 86400000).toISOString();

export const seekers: Seeker[] = [
  {
    id: "s1",
    name: "Alex Rivera",
    avatar: "👩‍💻",
    title: "Frontend Engineer",
    location: "San Francisco, CA",
    bio: "Passionate about crafting pixel-perfect UIs with modern frameworks. 5 years building production React apps at scale.",
    experience: "5 years",
    skills: ["React", "TypeScript", "Tailwind CSS", "GraphQL", "Next.js", "Jest", "Storybook", "Figma"],
    availability: "2 weeks",
    seniority: "Senior",
    summary: "Frontend engineer specializing in React and scalable UI systems. Built dashboards used by 200k+ users at Stripe and Vercel.",
    work_mode: "Remote",
    employment_type: "Full-time",
    salary_min: 140,
    salary_max: 180,
    experience_entries: [
      {
        title: "Senior Frontend Engineer",
        company: "Stripe",
        startDate: "2022",
        endDate: "2024",
        bullets: [
          "Built React dashboard used by 50k merchants processing $2B annually",
          "Led migration from Angular to React, reducing bundle size by 40%",
        ],
      },
      {
        title: "Frontend Developer",
        company: "Vercel",
        startDate: "2020",
        endDate: "2022",
        bullets: [
          "Developed Next.js templates used by 10k+ developers",
          "Implemented design system adopted across 8 product teams",
        ],
      },
      {
        title: "Junior Developer",
        company: "Freelance",
        startDate: "2019",
        endDate: "2020",
        bullets: [
          "Built 15+ client websites using React and Tailwind CSS",
        ],
      },
    ],
    links: {
      portfolio: "https://alexrivera.dev",
      github: "https://github.com/alexrivera",
      linkedin: "https://linkedin.com/in/alexrivera",
      website: "https://alexrivera.blog",
    },
    cv_url: "https://example.com/cv/alex-rivera.pdf",
    last_active: daysAgo(0),
  },
  {
    id: "s2",
    name: "Jordan Patel",
    avatar: "🧑‍🎨",
    title: "UX/UI Designer",
    location: "New York, NY",
    bio: "Design thinker who bridges the gap between aesthetics and usability. Led redesigns that boosted conversion by 40%.",
    experience: "4 years",
    skills: ["Figma", "Prototyping", "User Research", "Design Systems", "Motion Design", "Adobe XD", "Sketch"],
    availability: "Immediate",
    seniority: "Mid",
    summary: "Product designer focused on user-centered design and rapid prototyping. Redesigned checkout flows that increased revenue by $3M/year.",
    work_mode: "Hybrid",
    employment_type: "Full-time",
    salary_min: 110,
    salary_max: 145,
    experience_entries: [
      {
        title: "Product Designer",
        company: "Shopify",
        startDate: "2022",
        endDate: "2024",
        bullets: [
          "Redesigned merchant checkout flow, boosting conversion by 40%",
          "Created component library used by 12 product teams",
        ],
      },
      {
        title: "UX Designer",
        company: "Agency Five",
        startDate: "2020",
        endDate: "2022",
        bullets: [
          "Led user research for 20+ client projects across fintech and health",
          "Designed mobile-first experiences for apps with 500k+ users",
        ],
      },
    ],
    links: {
      portfolio: "https://jordanpatel.design",
      linkedin: "https://linkedin.com/in/jordanpatel",
    },
    cv_url: "https://example.com/cv/jordan-patel.pdf",
    last_active: daysAgo(1),
  },
  {
    id: "s3",
    name: "Sam Chen",
    avatar: "👨‍💻",
    title: "Full Stack Developer",
    location: "Remote",
    bio: "End-to-end builder who ships fast. Comfortable from database schemas to deployment pipelines.",
    experience: "6 years",
    skills: ["Node.js", "React", "PostgreSQL", "Docker", "AWS", "Python", "Redis", "Terraform"],
    availability: "1 month",
    seniority: "Senior",
    summary: "Full stack engineer with deep backend expertise. Architected microservices handling 10M+ requests/day at scale.",
    work_mode: "Remote",
    employment_type: "Contract",
    salary_min: 150,
    salary_max: 200,
    experience_entries: [
      {
        title: "Staff Engineer",
        company: "Datadog",
        startDate: "2021",
        endDate: "2024",
        bullets: [
          "Architected event pipeline processing 10M+ events/day",
          "Mentored 4 junior engineers and led backend guild",
        ],
      },
      {
        title: "Full Stack Developer",
        company: "Twilio",
        startDate: "2019",
        endDate: "2021",
        bullets: [
          "Built real-time messaging APIs serving 2M daily users",
          "Reduced API latency by 60% through caching layer redesign",
        ],
      },
      {
        title: "Backend Developer",
        company: "StartupXYZ",
        startDate: "2018",
        endDate: "2019",
        bullets: [
          "Built MVP backend from scratch using Node.js and PostgreSQL",
        ],
      },
    ],
    links: {
      github: "https://github.com/samchen",
      linkedin: "https://linkedin.com/in/samchen",
      website: "https://samchen.io",
    },
    last_active: daysAgo(3),
  },
  {
    id: "s4",
    name: "Maya Thompson",
    avatar: "📊",
    title: "Data Analyst",
    location: "Chicago, IL",
    bio: "Turning messy data into clear stories. Expert in building dashboards that drive real business decisions.",
    experience: "3 years",
    skills: ["Python", "SQL", "Tableau", "Statistics", "Excel", "dbt", "Looker"],
    availability: "Flexible",
    seniority: "Mid",
    summary: "Data analyst specializing in product analytics and business intelligence. Built reporting pipelines that saved 20 hours/week.",
    work_mode: "Hybrid",
    employment_type: "Full-time",
    salary_min: 90,
    salary_max: 120,
    experience_entries: [
      {
        title: "Data Analyst",
        company: "Airbnb",
        startDate: "2022",
        endDate: "2024",
        bullets: [
          "Built product analytics dashboards used by 30+ PMs daily",
          "Identified pricing insights that increased host revenue by 15%",
        ],
      },
      {
        title: "Junior Analyst",
        company: "Deloitte",
        startDate: "2021",
        endDate: "2022",
        bullets: [
          "Automated 12 weekly reports saving 20 hours of manual work",
          "Delivered data models for Fortune 500 client engagements",
        ],
      },
    ],
    links: {
      linkedin: "https://linkedin.com/in/mayathompson",
      portfolio: "https://mayathompson.data",
    },
    cv_url: "https://example.com/cv/maya-thompson.pdf",
    last_active: daysAgo(0),
  },
  {
    id: "s5",
    name: "Leo Kimura",
    avatar: "☁️",
    title: "DevOps Engineer",
    location: "Seattle, WA",
    bio: "Infrastructure nerd who automates everything. Reduced deploy times by 80% at my last role.",
    experience: "7 years",
    skills: ["Kubernetes", "Terraform", "CI/CD", "AWS", "Monitoring", "Linux", "Ansible", "Go"],
    availability: "2 weeks",
    seniority: "Lead",
    summary: "DevOps lead with 7 years scaling cloud infrastructure. Managed clusters serving 50M users with 99.99% uptime.",
    work_mode: "Remote",
    employment_type: "Full-time",
    salary_min: 170,
    salary_max: 220,
    experience_entries: [
      {
        title: "DevOps Lead",
        company: "Netflix",
        startDate: "2021",
        endDate: "2024",
        bullets: [
          "Managed Kubernetes clusters across 3 regions serving 50M users",
          "Reduced infrastructure costs by 35% through autoscaling optimization",
        ],
      },
      {
        title: "Site Reliability Engineer",
        company: "Amazon",
        startDate: "2018",
        endDate: "2021",
        bullets: [
          "Built CI/CD pipelines deploying 200+ services daily",
          "Achieved 99.99% uptime for customer-facing payment systems",
        ],
      },
      {
        title: "Systems Administrator",
        company: "Rackspace",
        startDate: "2017",
        endDate: "2018",
        bullets: [
          "Automated server provisioning reducing setup time from days to minutes",
        ],
      },
    ],
    links: {
      github: "https://github.com/leokimura",
      linkedin: "https://linkedin.com/in/leokimura",
      website: "https://leokimura.dev",
    },
    cv_url: "https://example.com/cv/leo-kimura.pdf",
    last_active: daysAgo(2),
  },
  {
    id: "s6",
    name: "Priya Sharma",
    avatar: "📱",
    title: "Mobile Developer",
    location: "Austin, TX",
    bio: "Building delightful mobile experiences for iOS and Android. Shipped 3 apps with 1M+ downloads.",
    experience: "4 years",
    skills: ["React Native", "Swift", "Kotlin", "Firebase", "App Store Optimization", "TypeScript", "GraphQL"],
    availability: "Immediate",
    seniority: "Mid",
    summary: "Mobile developer with cross-platform expertise. Shipped 3 apps with 1M+ combined downloads and 4.8★ average rating.",
    work_mode: "Onsite",
    employment_type: "Full-time",
    salary_min: 120,
    salary_max: 155,
    experience_entries: [
      {
        title: "Mobile Engineer",
        company: "Uber",
        startDate: "2022",
        endDate: "2024",
        bullets: [
          "Built rider app features used by 5M+ daily active users",
          "Reduced app crash rate by 70% through error boundary improvements",
        ],
      },
      {
        title: "React Native Developer",
        company: "Healthify",
        startDate: "2020",
        endDate: "2022",
        bullets: [
          "Developed health tracking app reaching 1M downloads in 6 months",
          "Integrated Apple HealthKit and Google Fit APIs",
        ],
      },
    ],
    links: {
      portfolio: "https://priyasharma.dev",
      github: "https://github.com/priyasharma",
      linkedin: "https://linkedin.com/in/priyasharma",
    },
    cv_url: "https://example.com/cv/priya-sharma.pdf",
    last_active: daysAgo(0),
  },
];
