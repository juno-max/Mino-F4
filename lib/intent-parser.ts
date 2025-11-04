/**
 * Smart Intent Parser
 * Parses natural language instructions and CSV headers to infer:
 * - Input schema (which columns to use as inputs)
 * - Output schema (what data to extract)
 * - Goal/instructions
 * - Example JSON output
 */

export interface ParsedIntent {
  goal: string;
  inputSchema: {
    name: string;
    type: string;
    description: string;
    required: boolean;
  }[];
  outputSchema: {
    name: string;
    type: string;
    description: string;
  }[];
  exampleOutput: Record<string, any>;
}

/**
 * Parse natural language instruction with CSV headers
 */
export function parseIntent(
  naturalLanguage: string,
  csvHeaders: string[]
): ParsedIntent {
  const nl = naturalLanguage.toLowerCase();

  // Identify action verbs
  const actionVerbs = [
    'extract', 'get', 'find', 'scrape', 'fetch', 'retrieve',
    'collect', 'gather', 'obtain', 'capture'
  ];

  const action = actionVerbs.find(verb => nl.includes(verb)) || 'extract';

  // Identify ground truth columns (gt_, _gt suffix, or contains 'expected', 'ground_truth')
  const groundTruthColumns = csvHeaders.filter(header => {
    const h = header.toLowerCase();
    return h.startsWith('gt_') ||
           h.endsWith('_gt') ||
           h.includes('expected') ||
           h.includes('ground_truth') ||
           h.includes('truth');
  });

  // Identify URL columns
  const urlColumns = csvHeaders.filter(header => {
    const h = header.toLowerCase();
    return h.includes('url') ||
           h.includes('website') ||
           h.includes('link') ||
           h.includes('domain') ||
           h === 'site';
  });

  // Input schema = all columns except ground truth
  const inputColumns = csvHeaders.filter(h => !groundTruthColumns.includes(h));

  // Extract mentioned fields from natural language
  const mentionedFields = extractMentionedFields(naturalLanguage, csvHeaders);

  // Infer what user wants to extract
  const outputFields = inferOutputFields(naturalLanguage, groundTruthColumns);

  // Build input schema
  const inputSchema = inputColumns.map(col => ({
    name: col,
    type: urlColumns.includes(col) ? 'url' : 'string',
    description: generateFieldDescription(col, urlColumns.includes(col)),
    required: urlColumns.includes(col) || mentionedFields.includes(col),
  }));

  // Build output schema
  const outputSchema = outputFields.map(field => ({
    name: field.name,
    type: field.type,
    description: field.description,
  }));

  // Generate goal with placeholders
  const goal = generateGoal(naturalLanguage, inputColumns, outputFields);

  // Generate example output
  const exampleOutput = generateExampleOutput(outputFields);

  return {
    goal,
    inputSchema,
    outputSchema,
    exampleOutput,
  };
}

/**
 * Extract fields mentioned in natural language using {brackets}
 */
function extractMentionedFields(nl: string, headers: string[]): string[] {
  const bracketMatches = nl.match(/\{([^}]+)\}/g);
  if (!bracketMatches) return [];

  return bracketMatches
    .map(m => m.replace(/[{}]/g, ''))
    .filter(field => headers.includes(field));
}

/**
 * Infer what fields user wants to extract
 */
function inferOutputFields(
  nl: string,
  groundTruthColumns: string[]
): Array<{ name: string; type: string; description: string }> {
  const fields: Array<{ name: string; type: string; description: string }> = [];

  // Common extraction patterns
  const patterns = [
    { keywords: ['price', 'cost', 'pricing', 'fee'], field: 'price', type: 'number' },
    { keywords: ['currency', 'dollar', 'usd', 'eur'], field: 'currency', type: 'string' },
    { keywords: ['phone', 'telephone', 'contact'], field: 'phone', type: 'string' },
    { keywords: ['email', 'e-mail'], field: 'email', type: 'string' },
    { keywords: ['address', 'location', 'street'], field: 'address', type: 'string' },
    { keywords: ['hour', 'hours', 'opening', 'schedule'], field: 'hours', type: 'string' },
    { keywords: ['rating', 'review', 'star'], field: 'rating', type: 'number' },
    { keywords: ['name', 'title'], field: 'name', type: 'string' },
    { keywords: ['description', 'about'], field: 'description', type: 'string' },
    { keywords: ['availability', 'available', 'in stock'], field: 'availability', type: 'boolean' },
  ];

  // Check ground truth columns first
  groundTruthColumns.forEach(gtCol => {
    const cleanName = gtCol.replace(/^gt_/i, '').replace(/_gt$/i, '');
    const type = inferType(cleanName);
    fields.push({
      name: cleanName,
      type,
      description: `Extracted ${cleanName}`,
    });
  });

  // If no ground truth, infer from natural language
  if (fields.length === 0) {
    patterns.forEach(pattern => {
      if (pattern.keywords.some(kw => nl.toLowerCase().includes(kw))) {
        // Avoid duplicates
        if (!fields.find(f => f.name === pattern.field)) {
          fields.push({
            name: pattern.field,
            type: pattern.type,
            description: `Extracted ${pattern.field}`,
          });
        }
      }
    });
  }

  // Default fallback
  if (fields.length === 0) {
    fields.push({
      name: 'result',
      type: 'string',
      description: 'Extracted data',
    });
  }

  return fields;
}

/**
 * Infer type from field name
 */
function inferType(fieldName: string): string {
  const name = fieldName.toLowerCase();

  if (name.includes('price') || name.includes('cost') || name.includes('amount')) {
    return 'number';
  }
  if (name.includes('rating') || name.includes('score') || name.includes('count')) {
    return 'number';
  }
  if (name.includes('available') || name.includes('stock') || name.includes('active')) {
    return 'boolean';
  }
  if (name.includes('email') || name.includes('phone') || name.includes('url')) {
    return 'string';
  }

  return 'string';
}

/**
 * Generate field description
 */
function generateFieldDescription(fieldName: string, isUrl: boolean): string {
  if (isUrl) {
    return `Target website URL to extract data from`;
  }

  const name = fieldName.replace(/_/g, ' ');
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} parameter`;
}

/**
 * Generate goal with proper placeholders
 */
function generateGoal(
  naturalLanguage: string,
  inputColumns: string[],
  outputFields: Array<{ name: string; type: string; description: string }>
): string {
  // If user already has placeholders, keep them
  if (naturalLanguage.includes('{') && naturalLanguage.includes('}')) {
    return naturalLanguage;
  }

  // Otherwise, create a goal based on the pattern
  const url = inputColumns.find(col =>
    col.toLowerCase().includes('url') ||
    col.toLowerCase().includes('website')
  );

  const otherInputs = inputColumns.filter(col => col !== url);

  let goal = naturalLanguage;

  // Add URL reference if present and not mentioned
  if (url && !goal.toLowerCase().includes('visit') && !goal.toLowerCase().includes(url)) {
    goal = `Visit {${url}} and ${goal}`;
  }

  // Add input parameters if mentioned in NL
  otherInputs.forEach(input => {
    const words = input.split('_');
    const regex = new RegExp(words.join('\\s+'), 'i');
    if (regex.test(goal) && !goal.includes(`{${input}}`)) {
      goal = goal.replace(regex, `{${input}}`);
    }
  });

  return goal;
}

/**
 * Generate example output based on output schema
 */
function generateExampleOutput(
  outputFields: Array<{ name: string; type: string; description: string }>
): Record<string, any> {
  const example: Record<string, any> = {};

  outputFields.forEach(field => {
    switch (field.type) {
      case 'number':
        if (field.name.includes('price') || field.name.includes('cost')) {
          example[field.name] = 45.00;
        } else if (field.name.includes('rating')) {
          example[field.name] = 4.5;
        } else {
          example[field.name] = 10;
        }
        break;

      case 'boolean':
        example[field.name] = true;
        break;

      case 'string':
      default:
        if (field.name.includes('email')) {
          example[field.name] = 'contact@example.com';
        } else if (field.name.includes('phone')) {
          example[field.name] = '+1 (555) 123-4567';
        } else if (field.name.includes('currency')) {
          example[field.name] = 'USD';
        } else if (field.name.includes('address')) {
          example[field.name] = '123 Main St, New York, NY 10001';
        } else if (field.name.includes('hours')) {
          example[field.name] = 'Mon-Fri: 9AM-5PM';
        } else {
          example[field.name] = `Sample ${field.name}`;
        }
        break;
    }
  });

  return example;
}

/**
 * Update output schema based on natural language modification
 */
export function updateOutputSchemaFromNL(
  currentSchema: Array<{ name: string; type: string; description: string }>,
  modification: string
): Array<{ name: string; type: string; description: string }> {
  const mod = modification.toLowerCase();

  // Parse add/remove commands
  if (mod.includes('add') || mod.includes('include')) {
    const newFields = inferOutputFields(modification, []);
    return [...currentSchema, ...newFields.filter(nf =>
      !currentSchema.find(f => f.name === nf.name)
    )];
  }

  if (mod.includes('remove') || mod.includes('delete') || mod.includes('exclude')) {
    // Extract field name to remove
    const words = modification.split(' ');
    const fieldToRemove = words[words.length - 1].replace(/[.,!?]/g, '');
    return currentSchema.filter(f => f.name !== fieldToRemove);
  }

  // Parse rename commands
  if (mod.includes('rename') || mod.includes('change')) {
    // Extract old and new names
    const renameMatch = modification.match(/rename\s+(\w+)\s+to\s+(\w+)/i) ||
                       modification.match(/change\s+(\w+)\s+to\s+(\w+)/i);

    if (renameMatch) {
      const [, oldName, newName] = renameMatch;
      return currentSchema.map(f =>
        f.name === oldName ? { ...f, name: newName } : f
      );
    }
  }

  return currentSchema;
}

/**
 * Generate updated example output based on natural language
 */
export function updateExampleOutputFromNL(
  currentExample: Record<string, any>,
  modification: string,
  schema: Array<{ name: string; type: string; description: string }>
): Record<string, any> {
  const mod = modification.toLowerCase();

  // Parse set value commands
  const setMatch = modification.match(/set\s+(\w+)\s+to\s+(.+)/i) ||
                  modification.match(/change\s+(\w+)\s+to\s+(.+)/i) ||
                  modification.match(/(\w+)\s+should be\s+(.+)/i);

  if (setMatch) {
    const [, fieldName, value] = setMatch;
    const field = schema.find(f => f.name === fieldName);

    if (field) {
      const parsedValue = parseValueByType(value.trim(), field.type);
      return { ...currentExample, [fieldName]: parsedValue };
    }
  }

  return currentExample;
}

/**
 * Parse value string based on expected type
 */
function parseValueByType(value: string, type: string): any {
  switch (type) {
    case 'number':
      const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
      return isNaN(num) ? 0 : num;

    case 'boolean':
      return value.toLowerCase().includes('true') ||
             value.toLowerCase().includes('yes');

    default:
      return value.replace(/^["']|["']$/g, ''); // Remove quotes
  }
}
