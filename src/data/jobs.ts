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
    location: "Warszawa",
    salary: "18 000 zł - 25 000 zł",
    type: "Full-time",
    description: "Twórz nowoczesne aplikacje webowe w React i TypeScript. Dołącz do zespołu pasjonatów budujących przyszłość SaaS.",
    tags: ["React", "TypeScript", "GraphQL"],
    posted: "2 dni temu",
  },
  {
    id: "2",
    title: "Product Designer",
    company: "PixelCraft Studios",
    logo: "🎨",
    location: "Kraków",
    salary: "14 000 zł - 20 000 zł",
    type: "Full-time",
    description: "Projektuj piękne, intuicyjne interfejsy dla milionów użytkowników. Cenimy kreatywność, empatię i perfekcję w każdym detalu.",
    tags: ["Figma", "UI/UX", "Design Systems"],
    posted: "1 dzień temu",
  },
  {
    id: "3",
    title: "Backend Engineer",
    company: "DataForge",
    logo: "⚡",
    location: "Zdalnie",
    salary: "20 000 zł - 28 000 zł",
    type: "Remote",
    description: "Skaluj nasze systemy rozproszone przetwarzające miliardy zdarzeń dziennie. Pracuj z Go, Kafka i PostgreSQL.",
    tags: ["Go", "PostgreSQL", "Kafka"],
    posted: "3 dni temu",
  },
  {
    id: "4",
    title: "Mobile Developer",
    company: "AppVenture",
    logo: "📱",
    location: "Wrocław",
    salary: "15 000 zł - 22 000 zł",
    type: "Full-time",
    description: "Twórz świetne doświadczenia mobilne w React Native. Dostarczaj funkcje wpływające na miliony aktywnych użytkowników.",
    tags: ["React Native", "iOS", "Android"],
    posted: "5 godzin temu",
  },
  {
    id: "5",
    title: "DevOps Engineer",
    company: "CloudPeak",
    logo: "☁️",
    location: "Gdańsk",
    salary: "18 000 zł - 26 000 zł",
    type: "Full-time",
    description: "Projektuj i utrzymuj infrastrukturę chmurową na AWS. Automatyzuj wszystko i zapewniaj 99.99% dostępności.",
    tags: ["AWS", "Terraform", "Docker"],
    posted: "tydzień temu",
  },
  {
    id: "6",
    title: "Data Scientist",
    company: "InsightAI",
    logo: "🧠",
    location: "Zdalnie",
    salary: "22 000 zł - 30 000 zł",
    type: "Remote",
    description: "Stosuj uczenie maszynowe do realnych problemów. Buduj modele, które napędzają decyzje biznesowe i funkcje produktu.",
    tags: ["Python", "ML", "TensorFlow"],
    posted: "4 dni temu",
  },
  {
    id: "7",
    title: "Marketing Manager",
    company: "GrowthLab",
    logo: "📈",
    location: "Poznań",
    salary: "12 000 zł - 18 000 zł",
    type: "Full-time",
    description: "Kieruj inicjatywami marketingu wzrostu w wielu kanałach. Napędzaj pozyskiwanie użytkowników i budowanie marki.",
    tags: ["SEO", "Content", "Analytics"],
    posted: "6 dni temu",
  },
  {
    id: "8",
    title: "Full Stack Developer",
    company: "BuildBetter",
    logo: "🏗️",
    location: "Zdalnie",
    salary: "16 000 zł - 24 000 zł",
    type: "Contract",
    description: "Dołącz do dynamicznego startupu budującego nową generację narzędzi do zarządzania projektami. Pełna odpowiedzialność end-to-end.",
    tags: ["Next.js", "Node.js", "MongoDB"],
    posted: "12 godzin temu",
  },
];
