// Mock data structure for menu panel - matches the image structure

export interface Batch {
  id: string
  name: string
  itemCount: number
  completionPercentage: number
}

export interface Project {
  id: string
  name: string
  itemCount: number
  completionPercentage: number
  batches: Batch[]
}

export const mockMenuData: Project[] = [
  {
    id: '1',
    name: 'Coca-Cola',
    itemCount: 3929,
    completionPercentage: 19.6,
    batches: [
      {
        id: '1-1',
        name: 'california_pos_system.csv',
        itemCount: 1250,
        completionPercentage: 45
      },
      {
        id: '1-2',
        name: 'texas_pos_system.csv',
        itemCount: 342,
        completionPercentage: 12
      },
      {
        id: '1-3',
        name: 'florida_pos_system.csv',
        itemCount: 908,
        completionPercentage: 100
      }
    ]
  },
  {
    id: '2',
    name: 'PepsiCo',
    itemCount: 2450,
    completionPercentage: 67.3,
    batches: [
      {
        id: '2-1',
        name: 'northeast_inventory.csv',
        itemCount: 890,
        completionPercentage: 78
      },
      {
        id: '2-2',
        name: 'southwest_inventory.csv',
        itemCount: 1560,
        completionPercentage: 62
      }
    ]
  },
  {
    id: '3',
    name: 'Nestlé',
    itemCount: 1823,
    completionPercentage: 34.2,
    batches: [
      {
        id: '3-1',
        name: 'europe_distribution.csv',
        itemCount: 1823,
        completionPercentage: 34.2
      }
    ]
  }
]

