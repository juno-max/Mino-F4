import { NextRequest, NextResponse } from 'next/server'
import { parseIntent, updateOutputSchemaFromNL, updateExampleOutputFromNL } from '@/lib/intent-parser'

// Enable CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-User-ID',
}

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders })
}

// POST /api/parse-intent - Parse natural language instruction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { naturalLanguage, csvHeaders, action } = body

    if (action === 'parse') {
      // Initial parsing
      if (!naturalLanguage || !csvHeaders) {
        return NextResponse.json(
          { message: 'naturalLanguage and csvHeaders are required' },
          { status: 400 }
        )
      }

      const parsed = parseIntent(naturalLanguage, csvHeaders)
      return NextResponse.json(parsed, { headers: corsHeaders })
    }

    if (action === 'updateOutputSchema') {
      // Update output schema based on NL modification
      const { currentSchema, modification } = body

      if (!currentSchema || !modification) {
        return NextResponse.json(
          { message: 'currentSchema and modification are required' },
          { status: 400 }
        )
      }

      const updated = updateOutputSchemaFromNL(currentSchema, modification)
      return NextResponse.json({ outputSchema: updated }, { headers: corsHeaders })
    }

    if (action === 'updateExample') {
      // Update example output based on NL modification
      const { currentExample, modification, schema } = body

      if (!currentExample || !modification || !schema) {
        return NextResponse.json(
          { message: 'currentExample, modification, and schema are required' },
          { status: 400 }
        )
      }

      const updated = updateExampleOutputFromNL(currentExample, modification, schema)
      return NextResponse.json({ exampleOutput: updated }, { headers: corsHeaders })
    }

    return NextResponse.json(
      { message: 'Invalid action. Use: parse, updateOutputSchema, or updateExample' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Error parsing intent:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to parse intent' },
      { status: 500 }
    )
  }
}
