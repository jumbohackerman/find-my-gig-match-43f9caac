export interface Seeker {
  id: string;
  name: string;
  avatar: string;
  title: string;
  location: string;
  bio: string;
  experience: string;
  skills: string[];
  availability: "Natychmiast" | "2 tygodnie" | "1 miesiąc" | "Elastycznie";
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
    name: "Aleksandra Kowalska",
    avatar: "👩‍💻",
    title: "Frontend Engineer",
    location: "Warszawa",
    bio: "Pasjonatka tworzenia pixel-perfect UI z nowoczesnymi frameworkami. 5 lat budowania produkcyjnych aplikacji React na dużą skalę.",
    experience: "5 lat",
    skills: ["React", "TypeScript", "Tailwind CSS", "GraphQL", "Next.js", "Jest", "Storybook", "Figma"],
    availability: "2 tygodnie",
    seniority: "Senior",
    summary: "Frontend engineer specjalizująca się w React i skalowalnych systemach UI. Budowała dashboardy używane przez 200 tys.+ użytkowników w Allegro i CD Projekt.",
    work_mode: "Zdalnie",
    employment_type: "Full-time",
    salary_min: 18,
    salary_max: 25,
    experience_entries: [
      {
        title: "Senior Frontend Engineer",
        company: "Allegro",
        startDate: "2022",
        endDate: "2024",
        bullets: [
          "Budowała dashboard React używany przez 50 tys. sprzedawców obsługujących 2 mld zł rocznie",
          "Prowadziła migrację z Angular do React, zmniejszając rozmiar bundla o 40%",
        ],
      },
      {
        title: "Frontend Developer",
        company: "CD Projekt",
        startDate: "2020",
        endDate: "2022",
        bullets: [
          "Tworzyła narzędzia wewnętrzne używane przez 200+ deweloperów",
          "Wdrożyła design system przyjęty przez 8 zespołów produktowych",
        ],
      },
      {
        title: "Junior Developer",
        company: "Freelance",
        startDate: "2019",
        endDate: "2020",
        bullets: [
          "Zbudowała 15+ stron klienckich w React i Tailwind CSS",
        ],
      },
    ],
    links: {
      portfolio: "https://aleksandrakowalska.dev",
      github: "https://github.com/akowalska",
      linkedin: "https://linkedin.com/in/akowalska",
      website: "https://akowalska.blog",
    },
    cv_url: "https://example.com/cv/aleksandra-kowalska.pdf",
    last_active: daysAgo(0),
  },
  {
    id: "s2",
    name: "Jakub Nowak",
    avatar: "🧑‍🎨",
    title: "UX/UI Designer",
    location: "Kraków",
    bio: "Projektant myślący designem, który łączy estetykę z użytecznością. Prowadził redesign zwiększający konwersję o 40%.",
    experience: "4 lata",
    skills: ["Figma", "Prototyping", "User Research", "Design Systems", "Motion Design", "Adobe XD", "Sketch"],
    availability: "Natychmiast",
    seniority: "Mid",
    summary: "Product designer skupiony na user-centered design i rapid prototyping. Przeprojektował flow checkout zwiększając przychód o 3 mln zł/rok.",
    work_mode: "Hybrydowo",
    employment_type: "Full-time",
    salary_min: 14,
    salary_max: 20,
    experience_entries: [
      {
        title: "Product Designer",
        company: "Allegro",
        startDate: "2022",
        endDate: "2024",
        bullets: [
          "Przeprojektował checkout sprzedawcy, zwiększając konwersję o 40%",
          "Stworzył bibliotekę komponentów używaną przez 12 zespołów produktowych",
        ],
      },
      {
        title: "UX Designer",
        company: "K2 Internet",
        startDate: "2020",
        endDate: "2022",
        bullets: [
          "Prowadził badania użytkowników dla 20+ projektów klientów z fintech i zdrowia",
          "Projektował mobile-first doświadczenia dla aplikacji z 500 tys.+ użytkowników",
        ],
      },
    ],
    links: {
      portfolio: "https://jakubnowak.design",
      linkedin: "https://linkedin.com/in/jakubnowak",
    },
    cv_url: "https://example.com/cv/jakub-nowak.pdf",
    last_active: daysAgo(1),
  },
  {
    id: "s3",
    name: "Michał Wiśniewski",
    avatar: "👨‍💻",
    title: "Full Stack Developer",
    location: "Zdalnie",
    bio: "Buduje end-to-end i dostarcza szybko. Komfortowo od schematów baz danych po pipeline'y wdrożeniowe.",
    experience: "6 lat",
    skills: ["Node.js", "React", "PostgreSQL", "Docker", "AWS", "Python", "Redis", "Terraform"],
    availability: "1 miesiąc",
    seniority: "Senior",
    summary: "Full stack engineer z głęboką wiedzą backendową. Zaprojektował mikroserwisy obsługujące 10 mln+ żądań dziennie.",
    work_mode: "Zdalnie",
    employment_type: "Contract",
    salary_min: 22,
    salary_max: 30,
    experience_entries: [
      {
        title: "Staff Engineer",
        company: "DocPlanner",
        startDate: "2021",
        endDate: "2024",
        bullets: [
          "Zaprojektował event pipeline przetwarzający 10 mln+ zdarzeń dziennie",
          "Mentorował 4 juniorów i prowadził backend guild",
        ],
      },
      {
        title: "Full Stack Developer",
        company: "Brainly",
        startDate: "2019",
        endDate: "2021",
        bullets: [
          "Budował API czasu rzeczywistego obsługujące 2 mln aktywnych użytkowników dziennie",
          "Zmniejszył latencję API o 60% przez redesign warstwy cache",
        ],
      },
      {
        title: "Backend Developer",
        company: "Startup XYZ",
        startDate: "2018",
        endDate: "2019",
        bullets: [
          "Zbudował MVP backendu od zera w Node.js i PostgreSQL",
        ],
      },
    ],
    links: {
      github: "https://github.com/mwisniewski",
      linkedin: "https://linkedin.com/in/mwisniewski",
      website: "https://mwisniewski.io",
    },
    last_active: daysAgo(3),
  },
  {
    id: "s4",
    name: "Anna Zielińska",
    avatar: "📊",
    title: "Data Analyst",
    location: "Poznań",
    bio: "Zamienia bałagan w danych w jasne historie. Ekspertka w budowaniu dashboardów napędzających realne decyzje biznesowe.",
    experience: "3 lata",
    skills: ["Python", "SQL", "Tableau", "Statistics", "Excel", "dbt", "Looker"],
    availability: "Elastycznie",
    seniority: "Mid",
    summary: "Data analyst specjalizująca się w product analytics i business intelligence. Zbudowała pipeline'y raportowe oszczędzające 20 godzin/tydzień.",
    work_mode: "Hybrydowo",
    employment_type: "Full-time",
    salary_min: 12,
    salary_max: 18,
    experience_entries: [
      {
        title: "Data Analyst",
        company: "Allegro",
        startDate: "2022",
        endDate: "2024",
        bullets: [
          "Zbudowała dashboardy product analytics używane codziennie przez 30+ PM-ów",
          "Zidentyfikowała insighty cenowe zwiększające przychód sprzedawców o 15%",
        ],
      },
      {
        title: "Junior Analyst",
        company: "Deloitte Polska",
        startDate: "2021",
        endDate: "2022",
        bullets: [
          "Zautomatyzowała 12 tygodniowych raportów, oszczędzając 20 godzin pracy ręcznej",
          "Dostarczała modele danych dla klientów z listy Fortune 500",
        ],
      },
    ],
    links: {
      linkedin: "https://linkedin.com/in/annazielinska",
      portfolio: "https://annazielinska.data",
    },
    cv_url: "https://example.com/cv/anna-zielinska.pdf",
    last_active: daysAgo(0),
  },
  {
    id: "s5",
    name: "Tomasz Kamiński",
    avatar: "☁️",
    title: "DevOps Engineer",
    location: "Gdańsk",
    bio: "Nerd infrastruktury, który automatyzuje wszystko. Zmniejszył czas deploymentu o 80% w ostatniej roli.",
    experience: "7 lat",
    skills: ["Kubernetes", "Terraform", "CI/CD", "AWS", "Monitoring", "Linux", "Ansible", "Go"],
    availability: "2 tygodnie",
    seniority: "Lead",
    summary: "DevOps lead z 7 latami skalowania infrastruktury chmurowej. Zarządzał klastrami obsługującymi 50 mln użytkowników z 99.99% uptime.",
    work_mode: "Zdalnie",
    employment_type: "Full-time",
    salary_min: 22,
    salary_max: 30,
    experience_entries: [
      {
        title: "DevOps Lead",
        company: "Allegro",
        startDate: "2021",
        endDate: "2024",
        bullets: [
          "Zarządzał klastrami Kubernetes w 3 regionach obsługującymi miliony użytkowników",
          "Zmniejszył koszty infrastruktury o 35% przez optymalizację autoscalingu",
        ],
      },
      {
        title: "Site Reliability Engineer",
        company: "OVHcloud",
        startDate: "2018",
        endDate: "2021",
        bullets: [
          "Budował pipeline'y CI/CD wdrażające 200+ serwisów dziennie",
          "Osiągnął 99.99% uptime dla systemów płatności klientów",
        ],
      },
      {
        title: "Administrator Systemów",
        company: "Comarch",
        startDate: "2017",
        endDate: "2018",
        bullets: [
          "Zautomatyzował provisionowanie serwerów, zmniejszając czas setup z dni do minut",
        ],
      },
    ],
    links: {
      github: "https://github.com/tkaminski",
      linkedin: "https://linkedin.com/in/tkaminski",
      website: "https://tkaminski.dev",
    },
    cv_url: "https://example.com/cv/tomasz-kaminski.pdf",
    last_active: daysAgo(2),
  },
  {
    id: "s6",
    name: "Maja Lewandowska",
    avatar: "📱",
    title: "Mobile Developer",
    location: "Wrocław",
    bio: "Buduje przyjemne doświadczenia mobilne na iOS i Android. Wydała 3 aplikacje z ponad 1 mln pobrań.",
    experience: "4 lata",
    skills: ["React Native", "Swift", "Kotlin", "Firebase", "App Store Optimization", "TypeScript", "GraphQL"],
    availability: "Natychmiast",
    seniority: "Mid",
    summary: "Mobile developer z doświadczeniem cross-platform. Wydała 3 aplikacje z łącznie 1 mln+ pobrań i średnią oceną 4.8★.",
    work_mode: "Stacjonarnie",
    employment_type: "Full-time",
    salary_min: 15,
    salary_max: 22,
    experience_entries: [
      {
        title: "Mobile Engineer",
        company: "Bolt",
        startDate: "2022",
        endDate: "2024",
        bullets: [
          "Budowała funkcje aplikacji pasażera używane przez 5 mln+ aktywnych użytkowników dziennie",
          "Zmniejszyła wskaźnik crash'y aplikacji o 70% przez poprawę error boundary",
        ],
      },
      {
        title: "React Native Developer",
        company: "Docplanner",
        startDate: "2020",
        endDate: "2022",
        bullets: [
          "Rozwinęła aplikację zdrowotną osiągającą 1 mln pobrań w 6 miesięcy",
          "Zintegrowała Apple HealthKit i Google Fit API",
        ],
      },
    ],
    links: {
      portfolio: "https://majalewandowska.dev",
      github: "https://github.com/mlewandowska",
      linkedin: "https://linkedin.com/in/mlewandowska",
    },
    cv_url: "https://example.com/cv/maja-lewandowska.pdf",
    last_active: daysAgo(0),
  },
];
