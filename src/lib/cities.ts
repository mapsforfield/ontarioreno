export type CityEntry = {
  name: string;
  href: string;
  descriptor: string;
  summary: string;
  featured?: boolean;
};

export const cityDirectory: CityEntry[] = [
  {
    name: 'Hamilton',
    href: '/basement-renovation-cost-hamilton',
    descriptor: 'Costs, permits, and grant guidance',
    summary:
      'Strong starting point for Hamilton basement pricing, permit planning, and grant research.',
    featured: true,
  },
  {
    name: 'Mississauga',
    href: '/basement-renovation-mississauga',
    descriptor: 'Basements, permits, and legal suites',
    summary:
      'Explore renovation direction, legal basement planning, and permit-related considerations.',
    featured: true,
  },
  {
    name: 'St. Catharines',
    href: '/st-catharines',
    descriptor: 'ADU grants, costs, and legal suites',
    summary:
      'Strong starting point for homeowners comparing St. Catharines ADU grants, realistic costs, and legal suite requirements.',
    featured: true,
  },
  {
    name: 'Brampton',
    href: '/basement-renovation-brampton',
    descriptor: 'Family basements and second-unit planning',
    summary:
      'Useful for homeowners comparing standard basement finishing with legal suite scope.',
    featured: true,
  },
  {
    name: 'Burlington',
    href: '/basement-renovation-burlington',
    descriptor: 'Renovation scope and retrofit planning',
    summary:
      'Good fit for Burlington homeowners balancing layout constraints, costs, and permits.',
    featured: true,
  },
  {
    name: 'Barrie',
    href: '/basement-renovation-barrie',
    descriptor: 'Basements, funding, and ARU planning',
    summary:
      'Built for Barrie homeowners comparing basement finishing, secondary suites, funding programs, and ARU planning.',
    featured: true,
  },
  {
    name: 'Milton',
    href: '/basement-renovation-milton',
    descriptor: 'Newer homes and unfinished basements',
    summary:
      'Built for Milton projects where unfinished basements and permit scope overlap early.',
  },
  {
    name: 'Ajax',
    href: '/basement-renovation-ajax',
    descriptor: 'Costs, layouts, and local permit context',
    summary:
      'Helps Ajax homeowners compare price, scope, and second-unit direction before quoting.',
  },
  {
    name: 'Pickering',
    href: '/basement-renovation-pickering',
    descriptor: 'Basement planning for mixed housing stock',
    summary:
      'Useful for balancing retrofit realities, pricing, and local permit expectations.',
  },
  {
    name: 'Whitby',
    href: '/basement-renovation-whitby',
    descriptor: 'Family-use basements and legal basement paths',
    summary:
      'A strong Whitby starting point for homeowners sorting costs, permits, and legal use.',
    featured: true,
  },
  {
    name: 'Oshawa',
    href: '/basement-renovation-oshawa',
    descriptor: 'Retrofits, pricing, and permit-focused planning',
    summary:
      'Built for Oshawa homeowners comparing standard basement renovations with legal-unit scope.',
    featured: true,
  },
];

export const featuredCities = cityDirectory.filter((city) => city.featured);
