const careerDatabase = {

  personalInfo: {
    name:     "Abdelrahman Yasser",
    title:    "Flutter Software Engineer",
    email:    "abdo.yasser.dev@gmail.com",
    phone:    "+201015694732",
    location: "Cairo, Egypt",
    links: {
      linkedin:  "https://linkedin.com/in/abdelrahmanyasserdev",
      github:    "https://github.com/AbdelrahmanYasserDev",
      portfolio: ""
    }
  },

  professionalSummary:
    "Flutter Software Engineer with 2+ years of hands-on experience building cross-platform mobile and desktop applications. " +
    "Focused on clean architecture, offline-first solutions, and real-world business integrations including POS systems, " +
    "booking platforms, and service marketplaces. Comfortable working across the full Flutter stack from state management " +
    "and local databases to hardware printing and real-time communication.",

  experience: [
    {
      role:    "Flutter Developer",
      company: "Manarat Elasr (Part Time)",
      period:  "Dec 2023 – Present",
      bullets: [
        "Developed and maintained mobile apps using Flutter and clean architecture.",
        "Implemented Bloc and MVVM patterns for scalable and maintainable code.",
        "Integrated RESTful APIs, Firebase services, and custom push notification logic.",
        "Collaborated in a small Agile team (2-3 members) using Git and GitHub for version control."
      ]
    },
    {
      role:    "Flutter Software Engineer",
      company: "Believe Agency",
      period:  "Dec 2025 – Present",
      bullets: [
        "Built and maintained cross-platform Flutter apps for Android, iOS, and Windows.",
        "Implemented offline-first architecture with local SQLite databases and Hive for background data persistence.",
        "Integrated ESC/POS thermal printing over USB, Bluetooth, and IP network interfaces.",
        "Worked with REST APIs, Firebase services, and real-time socket connections.",
        "Refactored existing codebases toward Clean Architecture and feature-based structure."
      ]
    }
  ],

  projects: [
    {
      name:  "Tog v-1 — POS & E-Invoicing",
      desc:  "Point of sale and electronic invoicing system for the Saudi market with ZATCA compliance.",
      bullets: [
        "Designed offline-first local database with 27 SQLite tables, sync logic, and automatic inventory updates.",
        "Integrated multi-interface thermal printer support (USB, Bluetooth, IP) with Arabic RTL receipt rendering.",
        "Implemented ZATCA-compliant e-invoicing workflow with QR code generation.",
        "Optimized desktop performance for Windows POS terminals using window_manager."
      ],
      tech:   "Flutter · SQLite · Hive · Provider · ESC/POS · Dio",
      links: {
        googlePlay: "https://play.google.com/store/apps/details?id=com.manaratalasr.apps.tog1_3",
        appStore:   "",
        github:     "",
        website:    ""
      }
    },
    {
      name:  "Gear — Rider",
      desc:  "Ride-hailing passenger app with real-time trip tracking and management.",
      bullets: [
        "Rendered live route polylines between pickup and destination using Google Maps and flutter_polyline_points.",
        "Integrated OneSignal push notifications and Razorpay payment gateway.",
        "Implemented real-time trip status updates via Socket.io."
      ],
      tech:   "Flutter · GetX · Socket.io · Google Maps · OneSignal · Razorpay",
      links: {
        googlePlay: "https://play.google.com/store/apps/details?id=com.gear.app",
        appStore:   "",
        github:     "",
        website:    ""
      }
    },
    {
      name:  "Gear — Captain",
      desc:  "Ride-hailing driver app for receiving and managing ride requests.",
      bullets: [
        "Built background GPS tracking service that syncs driver location to server via Socket.io.",
        "Implemented slide-to-accept ride request UX for captain app.",
        "Rendered live routes and integrated real-time notifications."
      ],
      tech:   "Flutter · GetX · Socket.io · Google Maps · OneSignal",
      links: {
        googlePlay: "https://play.google.com/store/apps/details?id=com.gear.app.captain",
        appStore:   "",
        github:     "",
        website:    ""
      }
    },
    {
      name:  "Hogga — Legal Consulting",
      desc:  "Platform connecting clients with certified attorneys via text chat and live video consultations.",
      bullets: [
        "Integrated Agora RTC Engine for real-time audio and video consultation sessions.",
        "Built real-time chat using Socket.io with Laravel Echo and Pusher for message delivery status.",
        "Applied Flutter Secure Storage for encrypted token and credentials management."
      ],
      tech:   "Flutter · Bloc · Agora RTC · Socket.io · Laravel Echo · Pusher",
      links: {
        googlePlay: "https://play.google.com/store/apps/details?id=com.hogga.app.hogga",
        appStore:   "",
        github:     "",
        website:    ""
      }
    },
    {
      name:  "Elbayan — Multi-Vendor Marketplace",
      desc:  "E-commerce app with multi-vendor store discovery, product browsing, and delivery tracking.",
      bullets: [
        "Structured the app using Clean Architecture (data / domain / presentation layers) with GetIt injection.",
        "Integrated Google Maps and Mapbox for location-based store discovery and delivery tracking.",
        "Used dartz for functional error handling across repository and use-case layers."
      ],
      tech:   "Flutter · Bloc · GetIt · Dartz · Google Maps · Mapbox · Dio",
      links: {
        googlePlay: "#",
        appStore:   "",
        github:     "",
        website:    ""
      }
    },
    {
      name:  "LearnPress Mobile — LMS",
      desc:  "Learning management system mobile client for a WordPress-based online course platform.",
      bullets: [
        "Secured lecture content from screen recording using platform-level DRM (screen_protector).",
        "Implemented audio course player with just_audio and PDF certificate viewer.",
        "Integrated Google Play and Apple IAP billing for course purchases."
      ],
      tech:   "Flutter · GetX · MobX · just_audio · in_app_purchase · screen_protector",
      links: {
        googlePlay: "#",
        appStore:   "#",
        github:     "",
        website:    ""
      }
    },
    {
      name:  "Zone — Event & Venue Booking",
      desc:  "Booking platform for wedding halls, event venues, and beauty centers.",
      bullets: [
        "Built calendar-based booking UI with Table Calendar and dynamic availability locking from API.",
        "Implemented location-based venue search filtered by governorate and city from local JSON assets.",
        "Integrated Google Maps for venue discovery and directions."
      ],
      tech:   "Flutter · Bloc · Google Maps · Table Calendar · Dio",
      links: {
        googlePlay: "https://play.google.com/store/apps/details?id=com.zone.app.zone",
        appStore:   "",
        github:     "",
        website:    ""
      }
    },
    {
      name:  "Canary 7 — Classified Ads & Dashboard",
      desc:  "Classified ads mobile app (similar to OLX) with a companion Flutter web admin dashboard.",
      bullets: [
        "Built mobile app and admin dashboard in Flutter sharing the same data models.",
        "Implemented image compression pipeline (flutter_image_compress) reducing upload sizes by ~70%.",
        "Developed admin analytics charts (fl_chart) with paginated Firestore queries and local caching."
      ],
      tech:   "Flutter · Bloc · Firebase · Cloud Firestore · fl_chart · flutter_image_compress",
      links: {
        googlePlay: "https://play.google.com/store/apps/details?id=com.canary.app",
        appStore:   "",
        github:     "",
        website:    ""
      }
    },
    {
      name:  "My Feny — Home Services",
      desc:  "On-demand home maintenance marketplace connecting users with licensed technicians.",
      bullets: [
        "Built real-time request status tracker (Pending → Accepted → In-Progress → Completed).",
        "Integrated Firebase Messaging for technician arrival and status update notifications.",
        "Implemented in-app chat and service rating system."
      ],
      tech:   "Flutter · Bloc · Dio · Firebase Messaging · Geolocator",
      links: {
        googlePlay: "https://play.google.com/store/search?q=ماي+فني",
        appStore:   "https://apps.apple.com/kw/app/ماي-فني/id6746807479",
        github:     "",
        website:    ""
      }
    },
    {
      name:  "BuB — Beauty Booking",
      desc:  "Beauty salon appointment app with stylist selection, services catalog, and booking management.",
      bullets: [
        "Built salon and services catalog with Bloc-driven filter and search states.",
        "Integrated push notifications for appointment reminders and confirmations."
      ],
      tech:   "Flutter · Bloc · Dio · Firebase",
      links: {
        googlePlay: "https://play.google.com/store/apps/details?id=com.bub1.app",
        appStore:   "https://apps.apple.com/us/app/bub-book-your-beauty/id6773297044",
        github:     "",
        website:    ""
      }
    },
    {
      name:  "History Tell — Quiz App",
      desc:  "History-focused quiz application with level-based progression.",
      bullets: [
        "Built dynamic question parsing from local JSON assets for 10 sequential difficulty levels.",
        "Implemented state management with Flutter Bloc to handle quiz progression, scoring, and user state.",
        "Used sqflite and shared_preferences to persist user progress and unlockable levels across sessions."
      ],
      tech:   "Flutter · Bloc · SQLite · Shared Preferences",
      links: {
        googlePlay: "",
        appStore:   "",
        github:     "",
        website:    ""
      }
    }
  ],

  skills: {
    "Languages":         ["Dart"],
    "Framework":         ["Flutter (Android, iOS, Windows)"],
    "Architecture":      ["Clean Architecture", "MVVM", "MVC", "Feature-first Architecture"],
    "State Management":  ["Bloc / Cubit", "Provider", "GetX"],
    "Backend Integration":["REST API", "Firebase", "Supabase"],
    "Local Storage":     ["SQLite", "Hive", "SharedPreferences"],
    "Maps & Location":   ["Google Maps", "Geolocator", "Mapbox"],
    "Desktop & Printing":["Windows Desktop", "USB Printing", "ESC/POS", "IP Printers"],
    "Tools":             ["Git", "GitHub", "Play Console", "Firebase Console"]
  },

  education: [
    {
      degree:      "Bachelor of Computer Science (Faculty of Computers and Information)",
      institution: "Beni-Suef University",
      period:      "2018 – 2023"
    }
  ],

  languages: [
    { lang: "Arabic",  level: "Native"        },
    { lang: "English", level: "Professional"  }
  ]

};
