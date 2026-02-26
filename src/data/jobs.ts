export interface Job {
  id: string;
  title: string;
  company: string;
  logo: string;
  location: string;
  salary: string;
  type: "Full-time" | "Part-time" | "Contract" | "Remote";
  description: string;
  tags: string[];
  posted: string;
}

export const jobs: Job[] = [
  {
    id: "1",
    title: "Senior Frontend Developer",
    company: "TechNova",
    logo: "🚀",
    location: "San Francisco, CA",
    salary: "$140k - $180k",
    type: "Full-time",
    description: "Build cutting-edge web applications using React and TypeScript. Join a team of passionate engineers shaping the future of SaaS.",
    tags: ["React", "TypeScript", "GraphQL"],
    posted: "2 days ago",
  },
  {
    id: "2",
    title: "Product Designer",
    company: "PixelCraft Studios",
    logo: "🎨",
    location: "New York, NY",
    salary: "$120k - $150k",
    type: "Full-time",
    description: "Design beautiful, intuitive interfaces for millions of users. We value creativity, empathy, and pixel-perfect execution.",
    tags: ["Figma", "UI/UX", "Design Systems"],
    posted: "1 day ago",
  },
  {
    id: "3",
    title: "Backend Engineer",
    company: "DataForge",
    logo: "⚡",
    location: "Remote",
    salary: "$130k - $170k",
    type: "Remote",
    description: "Scale our distributed systems processing billions of events daily. Work with Go, Kafka, and PostgreSQL.",
    tags: ["Go", "PostgreSQL", "Kafka"],
    posted: "3 days ago",
  },
  {
    id: "4",
    title: "Mobile Developer",
    company: "AppVenture",
    logo: "📱",
    location: "Austin, TX",
    salary: "$110k - $145k",
    type: "Full-time",
    description: "Create delightful mobile experiences with React Native. Ship features that impact millions of daily active users.",
    tags: ["React Native", "iOS", "Android"],
    posted: "5 hours ago",
  },
  {
    id: "5",
    title: "DevOps Engineer",
    company: "CloudPeak",
    logo: "☁️",
    location: "Seattle, WA",
    salary: "$135k - $165k",
    type: "Full-time",
    description: "Architect and maintain cloud infrastructure on AWS. Automate everything and ensure 99.99% uptime.",
    tags: ["AWS", "Terraform", "Docker"],
    posted: "1 week ago",
  },
  {
    id: "6",
    title: "Data Scientist",
    company: "InsightAI",
    logo: "🧠",
    location: "Remote",
    salary: "$150k - $190k",
    type: "Remote",
    description: "Apply machine learning to real-world problems. Build models that drive business decisions and product features.",
    tags: ["Python", "ML", "TensorFlow"],
    posted: "4 days ago",
  },
  {
    id: "7",
    title: "Marketing Manager",
    company: "GrowthLab",
    logo: "📈",
    location: "Chicago, IL",
    salary: "$90k - $120k",
    type: "Full-time",
    description: "Lead growth marketing initiatives across multiple channels. Drive user acquisition and brand awareness.",
    tags: ["SEO", "Content", "Analytics"],
    posted: "6 days ago",
  },
  {
    id: "8",
    title: "Full Stack Developer",
    company: "BuildBetter",
    logo: "🏗️",
    location: "Remote",
    salary: "$125k - $160k",
    type: "Contract",
    description: "Join a fast-paced startup building the next generation of project management tools. End-to-end ownership.",
    tags: ["Next.js", "Node.js", "MongoDB"],
    posted: "12 hours ago",
  },
];
