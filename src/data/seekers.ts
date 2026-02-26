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
}

export const seekers: Seeker[] = [
  {
    id: "s1",
    name: "Alex Rivera",
    avatar: "👩‍💻",
    title: "Frontend Engineer",
    location: "San Francisco, CA",
    bio: "Passionate about crafting pixel-perfect UIs with modern frameworks. 5 years building production React apps at scale.",
    experience: "5 years",
    skills: ["React", "TypeScript", "Tailwind CSS", "GraphQL", "Next.js"],
    availability: "2 weeks",
  },
  {
    id: "s2",
    name: "Jordan Patel",
    avatar: "🧑‍🎨",
    title: "UX/UI Designer",
    location: "New York, NY",
    bio: "Design thinker who bridges the gap between aesthetics and usability. Led redesigns that boosted conversion by 40%.",
    experience: "4 years",
    skills: ["Figma", "Prototyping", "User Research", "Design Systems", "Motion Design"],
    availability: "Immediate",
  },
  {
    id: "s3",
    name: "Sam Chen",
    avatar: "👨‍💻",
    title: "Full Stack Developer",
    location: "Remote",
    bio: "End-to-end builder who ships fast. Comfortable from database schemas to deployment pipelines.",
    experience: "6 years",
    skills: ["Node.js", "React", "PostgreSQL", "Docker", "AWS"],
    availability: "1 month",
  },
  {
    id: "s4",
    name: "Maya Thompson",
    avatar: "📊",
    title: "Data Analyst",
    location: "Chicago, IL",
    bio: "Turning messy data into clear stories. Expert in building dashboards that drive real business decisions.",
    experience: "3 years",
    skills: ["Python", "SQL", "Tableau", "Statistics", "Excel"],
    availability: "Flexible",
  },
  {
    id: "s5",
    name: "Leo Kimura",
    avatar: "☁️",
    title: "DevOps Engineer",
    location: "Seattle, WA",
    bio: "Infrastructure nerd who automates everything. Reduced deploy times by 80% at my last role.",
    experience: "7 years",
    skills: ["Kubernetes", "Terraform", "CI/CD", "AWS", "Monitoring"],
    availability: "2 weeks",
  },
  {
    id: "s6",
    name: "Priya Sharma",
    avatar: "📱",
    title: "Mobile Developer",
    location: "Austin, TX",
    bio: "Building delightful mobile experiences for iOS and Android. Shipped 3 apps with 1M+ downloads.",
    experience: "4 years",
    skills: ["React Native", "Swift", "Kotlin", "Firebase", "App Store Optimization"],
    availability: "Immediate",
  },
];
