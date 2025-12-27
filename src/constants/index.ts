import type {
  TNavLink,
  TService,
  TTechnology,
  TExperience,
  TTestimonial,
  TProject,
} from "../types";

import {
  mobile,
  backend,
  web,
  javascript,
  typescript,
  html,
  css,
  reactjs,
  nodejs,
  mongodb,
  git,
  docker,
  carrent,
  jobit,
  tripguide,
  threejs,
} from "../assets";

export const navLinks: TNavLink[] = [
  {
    id: "about",
    title: "About",
  },
  {
    id: "work",
    title: "Work",
  },
  {
    id: "contact",
    title: "Contact",
  },
];

const services: TService[] = [
  {
    title: "iOS Developer",
    icon: mobile,
  },
  {
    title: "Full-Stack Developer",
    icon: web,
  },
  {
    title: "Backend Developer",
    icon: backend,
  },
  {
    title: "Mobile Engineer",
    icon: mobile,
  },
];

const technologies: TTechnology[] = [
  {
    name: "Swift",
    icon: mobile, // Using mobile icon for Swift/iOS
  },
  {
    name: "React JS",
    icon: reactjs,
  },
  {
    name: "TypeScript",
    icon: typescript,
  },
  {
    name: "JavaScript",
    icon: javascript,
  },
  {
    name: "Node JS",
    icon: nodejs,
  },
  {
    name: "Python",
    icon: nodejs, // Using nodejs icon as placeholder for Python
  },
  {
    name: "PostgreSQL",
    icon: mongodb, // Using mongodb icon as placeholder
  },
  {
    name: "Docker",
    icon: docker,
  },
  {
    name: "Git",
    icon: git,
  },
  {
    name: "HTML 5",
    icon: html,
  },
  {
    name: "CSS 3",
    icon: css,
  },
  {
    name: "Three JS",
    icon: threejs,
  },
];

const experiences: TExperience[] = [
  {
    title: "iOS Developer Intern",
    companyName: "XIRCLS",
    icon: mobile,
    iconBg: "#915EFF",
    date: "Apr 2025 - Jul 2025",
    points: [
      "Shipped the first iOS build of Tulk by XIRCLS, owning design, development, testing, and release; launched to 500+ pilot users.",
      "Built core chat features and integrated REST APIs for leads and tasks, reducing lead entry time by approximately 40%.",
      "Designed task popups, swipe-up call summary sheets, reusable UI components, boosting engagement by 25%.",
      "Improved reliability with secure networking and XCTest coverage, reducing crashes by approximately 30%.",
    ],
  },
  {
    title: "Mobile Engineer Intern",
    companyName: "TechQkonnect",
    icon: mobile,
    iconBg: "#1d1836",
    date: "Jan 2024 - Jun 2024",
    points: [
      "Contributed to iOS and Android apps using Swift/SwiftUI, UIKit, and Dart in collaboration with backend teams.",
      "Implemented authentication, push notifications, offline caching, improving retention by approximately 20%.",
      "Introduced Git-based code reviews, reducing integration issues by approximately 35%.",
      "Streamlined releases using CI Checks and TestFlight, accelerating delivery by approximately 25%.",
    ],
  },
];

const testimonials: TTestimonial[] = [
  {
    testimonial:
      "I thought it was impossible to make a website as beautiful as our product, but Rick proved me wrong.",
    name: "Sara Lee",
    designation: "CFO",
    company: "Acme Co",
    image: "https://randomuser.me/api/portraits/women/4.jpg",
  },
  {
    testimonial:
      "I've never met a web developer who truly cares about their clients' success like Rick does.",
    name: "Chris Brown",
    designation: "COO",
    company: "DEF Corp",
    image: "https://randomuser.me/api/portraits/men/5.jpg",
  },
  {
    testimonial:
      "After Rick optimized our website, our traffic increased by 50%. We can't thank them enough!",
    name: "Lisa Wang",
    designation: "CTO",
    company: "456 Enterprises",
    image: "https://randomuser.me/api/portraits/women/6.jpg",
  },
];

const projects: TProject[] = [
  {
    name: "AgilePulse System",
    description:
      "An intelligent Agile management platform designed to streamline story refinement, sprint readiness, MVP planning, and progress tracking. Built with React, NestJS, TypeScript, and PostgreSQL over 3 sprints with stand-ups, reviews, and retrospectives.",
    tags: [
      {
        name: "react",
        color: "blue-text-gradient",
      },
      {
        name: "nestjs",
        color: "green-text-gradient",
      },
      {
        name: "postgresql",
        color: "pink-text-gradient",
      },
      {
        name: "typescript",
        color: "blue-text-gradient",
      },
    ],
    image: carrent,
    sourceCodeLink: "https://github.com/Omei55/portfolio/tree/main/projects/agile-pulse-system",
  },
  {
    name: "POD Market Analytics Platform",
    description:
      "Deployed a multi-node CockroachDB cluster across three regions with fault tolerance. Built a full-stack analytics dashboard supporting natural language queries translated into optimized SQL for multi-location convenience store chains.",
    tags: [
      {
        name: "cockroachdb",
        color: "green-text-gradient",
      },
      {
        name: "nodejs",
        color: "blue-text-gradient",
      },
      {
        name: "react",
        color: "pink-text-gradient",
      },
      {
        name: "python",
        color: "blue-text-gradient",
      },
    ],
    image: jobit,
    sourceCodeLink: "https://github.com/Omei55/portfolio/tree/main/projects/pod-market-analytics",
  },
  {
    name: "To-Do List iOS Application",
    description:
      "Built a productivity app using Swift, SwiftUI, and Core Data with Firebase for real-time sync. Implemented authentication, push notifications, recurring tasks, and analytics with a scalable data model.",
    tags: [
      {
        name: "swift",
        color: "blue-text-gradient",
      },
      {
        name: "swiftui",
        color: "green-text-gradient",
      },
      {
        name: "firebase",
        color: "pink-text-gradient",
      },
      {
        name: "coredata",
        color: "blue-text-gradient",
      },
    ],
    image: tripguide,
    sourceCodeLink: "https://github.com/Omei55/portfolio",
  },
  {
    name: "Augmented Reality POS System",
    description:
      "Built a mobile AR application using Google ARCore and Unity to visualize purchasable items as 3D models. Integrated cryptocurrency-based payments for secure checkout within AR environments.",
    tags: [
      {
        name: "csharp",
        color: "blue-text-gradient",
      },
      {
        name: "python",
        color: "green-text-gradient",
      },
      {
        name: "arcore",
        color: "pink-text-gradient",
      },
      {
        name: "unity",
        color: "blue-text-gradient",
      },
    ],
    image: carrent,
    sourceCodeLink: "https://github.com/Omei55/portfolio",
  },
];

export { services, technologies, experiences, testimonials, projects };
