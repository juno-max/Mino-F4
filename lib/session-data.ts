export interface ToolCall {
  id: string
  action: string
  timestamp: string // Format: "00:12" or full datetime
  description: string
  screenshot?: string
  status: 'completed' | 'pending' | 'failed'
}

export interface SessionOutput {
  raw?: string
  location?: string
  service?: string
  error?: string
  reason?: string
  [key: string]: any
}

export interface HistoricSession {
  id: string
  sessionNumber: number
  date: string
  time: string
  status: 'completed' | 'failed' | 'running'
  output: SessionOutput
}

export interface SessionDetails {
  id: string
  status: 'completed' | 'failed' | 'running'
  goal: string
  latestOutput: SessionOutput
  toolCalls: ToolCall[]
  currentStep: string
  progress: number // 0-100
  historicSessions: HistoricSession[]
  url: string
  service: string
  location: string
}

// Mock data generator
export function getSessionDetails(sessionId: string): SessionDetails {
  const isRunning = sessionId === '2247726'
  const isCompleted = sessionId === '2247727'
  
  if (isRunning) {
    return {
      id: sessionId,
      status: 'running',
      goal: 'Extract pricing information for Underarm Waxing service at Charisma Salon in Menlo Park',
      latestOutput: {
        raw: 'The price for Underarm Waxing at Charisma Salon is $20.00.',
        location: 'Menlo Park',
        service: 'Underarm Waxing'
      },
      toolCalls: [
        {
          id: '1',
          action: 'Initial Navigation',
          timestamp: '00:12',
          description: 'Navigated to homepage',
          status: 'completed'
        },
        {
          id: '2',
          action: 'Service Search',
          timestamp: '00:15',
          description: 'Searching for service menu...',
          status: 'pending'
        },
        {
          id: '3',
          action: 'Price Extraction',
          timestamp: '',
          description: 'Extracting pricing data...',
          status: 'pending'
        },
        {
          id: '4',
          action: 'Verification',
          timestamp: '',
          description: 'Verifying extracted data...',
          status: 'pending'
        },
        {
          id: '5',
          action: 'Final Output',
          timestamp: '',
          description: 'Generating final output...',
          status: 'pending'
        }
      ],
      currentStep: 'Initial Navigation',
      progress: 20,
      historicSessions: [
        {
          id: 'session-12',
          sessionNumber: 12,
          date: 'Oct 21, 2025',
          time: '18:09:56',
          status: 'failed',
          output: {
            raw: 'The price for Underarm Waxing at Charisma Salon is $20.00.',
            location: 'Menlo Park',
            service: 'Underarm Waxing'
          }
        },
        {
          id: 'session-11',
          sessionNumber: 11,
          date: 'Oct 18, 2025',
          time: '07:18:11',
          status: 'failed',
          output: {
            error: 'Failed to extract pricing',
            reason: 'Page navigation timeout'
          }
        },
        {
          id: 'session-10',
          sessionNumber: 10,
          date: 'Oct 15, 2025',
          time: '14:32:45',
          status: 'completed',
          output: {
            raw: 'The price for Full Body Massage at Wellness Center is $120.00.',
            location: 'San Francisco',
            service: 'Full Body Massage'
          }
        }
      ],
      url: 'http://charismasalonmenlopark.com/',
      service: 'Underarm Waxing',
      location: 'Menlo Park'
    }
  }

  if (isCompleted) {
    return {
      id: sessionId,
      status: 'completed',
      goal: 'Extract pricing information for Full Body Massage service at Wellness Center in San Francisco',
      latestOutput: {
        raw: 'The price for Full Body Massage at Wellness Center is $120.00.',
        location: 'San Francisco',
        service: 'Full Body Massage'
      },
      toolCalls: [
        {
          id: '1',
          action: 'Initial Navigation',
          timestamp: '00:05',
          description: 'Navigated to homepage',
          screenshot: 'https://via.placeholder.com/800x600?text=Homepage',
          status: 'completed'
        },
        {
          id: '2',
          action: 'Service Search',
          timestamp: '00:08',
          description: 'Found services menu',
          screenshot: 'https://via.placeholder.com/800x600?text=Services+Menu',
          status: 'completed'
        },
        {
          id: '3',
          action: 'Price Extraction',
          timestamp: '00:12',
          description: 'Extracted pricing data',
          screenshot: 'https://via.placeholder.com/800x600?text=Pricing+Page',
          status: 'completed'
        },
        {
          id: '4',
          action: 'Verification',
          timestamp: '00:15',
          description: 'Verified extracted data',
          screenshot: 'https://via.placeholder.com/800x600?text=Verification',
          status: 'completed'
        },
        {
          id: '5',
          action: 'Final Output',
          timestamp: '00:18',
          description: 'Generated final output',
          screenshot: 'https://via.placeholder.com/800x600?text=Final+Output',
          status: 'completed'
        }
      ],
      currentStep: 'Final Output',
      progress: 100,
      historicSessions: [
        {
          id: 'session-12',
          sessionNumber: 12,
          date: 'Oct 21, 2025',
          time: '18:09:56',
          status: 'completed',
          output: {
            raw: 'The price for Full Body Massage at Wellness Center is $120.00.',
            location: 'San Francisco',
            service: 'Full Body Massage'
          }
        },
        {
          id: 'session-11',
          sessionNumber: 11,
          date: 'Oct 18, 2025',
          time: '07:18:11',
          status: 'failed',
          output: {
            error: 'Failed to extract pricing',
            reason: 'Page navigation timeout'
          }
        }
      ],
      url: 'http://wellness-center.com/',
      service: 'Full Body Massage',
      location: 'San Francisco'
    }
  }

  // Default failed session
  return {
    id: sessionId,
    status: 'failed',
    goal: 'Extract pricing information for Hot Stone Therapy service at Wellness Center in Palo Alto',
    latestOutput: {
      error: 'Failed to extract pricing',
      reason: 'Page navigation timeout'
    },
    toolCalls: [
      {
        id: '1',
        action: 'Initial Navigation',
        timestamp: '00:05',
        description: 'Navigated to homepage',
        screenshot: 'https://via.placeholder.com/800x600?text=Homepage',
        status: 'completed'
      },
      {
        id: '2',
        action: 'Service Search',
        timestamp: '00:08',
        description: 'Searching for service menu...',
        status: 'failed'
      }
    ],
    currentStep: 'Service Search',
    progress: 40,
    historicSessions: [
      {
        id: 'session-12',
        sessionNumber: 12,
        date: 'Oct 21, 2025',
        time: '18:09:56',
        status: 'failed',
        output: {
          error: 'Failed to extract pricing',
          reason: 'Page navigation timeout'
        }
      },
      {
        id: 'session-11',
        sessionNumber: 11,
        date: 'Oct 18, 2025',
        time: '07:18:11',
        status: 'failed',
        output: {
          error: 'Failed to extract pricing',
          reason: 'Page navigation timeout'
        }
      }
    ],
    url: 'http://wellness-center.com/',
    service: 'Hot Stone Therapy',
    location: 'Palo Alto'
  }
}

