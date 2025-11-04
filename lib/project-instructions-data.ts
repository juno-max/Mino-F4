// Shared data structure and mock data for all design variants

export interface Tag {
  label: string
  active: boolean
}

export interface ProjectInstructionsData {
  overview: {
    projectName: string
    instructions: string
  }
  inputParameters: Tag[]
  navigationRules: Tag[]
  locationMatching: {
    options: Tag[]
    fallback: Tag
  }
  serviceMatching: {
    types: Tag[]
    checks: Tag[]
  }
  pricingExtraction: Tag[]
  desiredOutput: string
}

export const defaultInstructionsData: ProjectInstructionsData = {
  overview: {
    projectName: 'Wellness Pricing Extraction',
    instructions: 'Navigate wellness provider website to extract original pricing for specified service at given location. Must validate location match and apply best-effort service name matching rules.'
  },
  inputParameters: [
    { label: 'Business URL', active: true },
    { label: 'Business Name', active: true },
    { label: 'Location', active: true },
    { label: 'City', active: true },
    { label: 'Service Name', active: true },
    { label: 'Class id', active: true },
    { label: 'Venue_id', active: true },
    { label: 'Price', active: true },
    { label: 'Currency', active: true }
  ],
  navigationRules: [
    { label: 'Max 5 pages', active: true },
    { label: 'No revisits', active: true },
    { label: 'Alt path on timeout', active: true },
    { label: 'Invalid site error', active: false }
  ],
  locationMatching: {
    options: [
      { label: 'Match City/Location', active: true },
      { label: 'Use dropdowns/search', active: false }
    ],
    fallback: { label: 'Fallback: Any available pricing', active: true }
  },
  serviceMatching: {
    types: [
      { label: 'Exact', active: true },
      { label: 'Semantic', active: true },
      { label: 'Price-based', active: true },
      { label: 'Closest', active: true }
    ],
    checks: [
      { label: 'Duration check', active: false },
      { label: 'Sessions check', active: false }
    ]
  },
  pricingExtraction: [
    { label: 'Click details/add to cart/book', active: true },
    { label: 'Sum component prices', active: true },
    { label: 'Extract original price only', active: true }
  ],
  desiredOutput: `{
  "currency": "$",
  "name": "input name",
  "original_name": "website name",
  "price": "number or empty"
}`
}

