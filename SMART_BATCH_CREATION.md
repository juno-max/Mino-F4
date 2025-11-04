# Smart Batch Creation - Implementation Guide

## ✅ What's Been Implemented

### 1. Backend Infrastructure

#### Intent Parser (`lib/intent-parser.ts`)
- ✅ Parses natural language to extract goals
- ✅ Identifies input parameters from CSV headers
- ✅ Infers output schema based on task description
- ✅ Generates example JSON outputs
- ✅ Supports natural language modifications
- ✅ Auto-detects ground truth columns

#### CSV Analyzer (`lib/csv-analyzer.ts`)
- ✅ Auto-detects column types (URL, email, price, date, phone, number, boolean, string)
- ✅ Identifies ground truth columns
- ✅ Calculates confidence scores for type detection
- ✅ Validates data quality (nulls, duplicates)
- ✅ Suggests batch names from filename
- ✅ Provides data quality assessment

#### API Endpoints
- ✅ `/api/parse-intent` - Natural language parsing
- ✅ `/api/batches` - CSV upload and batch creation
- ✅ `/api/projects` - Project management

### 2. Frontend Components

#### Enhanced Batch Modal (`EnhancedBatchModal.tsx`)
- ✅ Two-step wizard (Upload → Preview)
- ✅ Project selection OR creation
- ✅ CSV file upload with drag-and-drop
- ✅ Natural language instruction input
- ✅ Smart intent parsing with AI
- ✅ Input schema display
- ✅ Output schema with field cards
- ✅ Example JSON output
- ✅ Natural language modifications
- ✅ CSV data preview (first 5-10 rows)

---

## 🚧 What Still Needs Implementation (Per Detailed Specs)

### Stage 1.1: Upload CSV

#### Features to Add:
```typescript
// File validation and preview enhancements
- [ ] Real-time file size display (MB/KB)
- [ ] Live row count as file uploads
- [ ] Better drag-and-drop zone styling
- [ ] Progress bar for large file uploads
- [ ] CSV structure validation before processing
- [ ] 404 checks on sample URLs (async validation)
- [ ] Detect duplicates and show count
- [ ] Detect malformed URLs
- [ ] Preview exactly first 10 rows (currently 5)
```

#### Component Updates Needed:
```tsx
// In EnhancedBatchModal.tsx - Upload Section
<UploadZone>
  <DragDropArea />
  <FileInfo>
    <FileSize>{fileSize} MB</FileSize>
    <RowCount>{rowCount} rows</RowCount>
  </FileInfo>
  <ValidationStatus>
    ✓ URLs validated (2 errors found)
    ⚠ 5 duplicate rows detected
  </ValidationStatus>
</UploadZone>
```

### Stage 1.2: Describe Task (Natural Language)

#### Features to Add:
```typescript
- [ ] Template library dropdown
  Templates: {
    "Pricing Extraction": "Extract price, currency, and availability",
    "Contact Info": "Extract phone, email, and address",
    "Product Details": "Extract name, description, and images"
  }

- [ ] AI interpretation preview
  "I understand you want to: Extract pricing information for each service
   from the website URL. I'll look for: price, currency, and availability."

- [ ] Refinement conversation UI
  User: "Also get the rating"
  AI: "Updated - I'll also extract: rating (1-5 stars)"

- [ ] Ambiguity detection
  "Did you mean: price per person OR price per service?"
```

#### Component Updates Needed:
```tsx
// Add template selector above natural language input
<TemplateSelector
  templates={templates}
  onSelect={(template) => setFormData({...formData, natural_language: template})}
/>

// Add AI interpretation panel
<AIInterpretation>
  <Sparkles /> I understand you want to:
  <ParsedIntent>{aiInterpretation}</ParsedIntent>
  <Clarifications>
    {ambiguities.map(q => <Question>{q}</Question>)}
  </Clarifications>
</AIInterpretation>
```

### Stage 1.3: Generate Schema

#### Features to Add:
```typescript
- [ ] Visual schema builder with field cards
  Each field shows:
  - Name
  - Type (dropdown: string, number, boolean, date, etc.)
  - Required/Optional toggle
  - Description
  - Delete button

- [ ] Drag-and-drop to reorder fields
- [ ] Add/remove fields manually
- [ ] Template schemas (Pricing, Contact, Product)
- [ ] Auto-match GT columns to output schema
- [ ] Validation: schema completeness vs task intent
- [ ] Show mapping confidence scores
```

#### Component Structure Needed:
```tsx
<SchemaBuilder>
  <TemplateSelector schemas={schemaTemplates} />

  <FieldList>
    {outputSchema.map(field => (
      <FieldCard draggable>
        <FieldName editable>{field.name}</FieldName>
        <FieldType>
          <Select options={types} value={field.type} />
        </FieldType>
        <RequiredToggle checked={field.required} />
        <ConfidenceScore>{field.confidence}%</ConfidenceScore>
        <DeleteButton />
      </FieldCard>
    ))}
  </FieldList>

  <AddFieldButton />
</SchemaBuilder>
```

### Stage 1.4: Preview Parsed Data

#### Features to Add:
```typescript
- [ ] Data preview table with input + output columns
  - Input columns highlighted (from CSV)
  - Output columns shown as empty placeholders
  - First 10 rows displayed

- [ ] Column mapping editor
  - Drag CSV columns to output fields
  - Auto-mapping suggestions
  - Confidence scores per mapping

- [ ] Validation warnings
  - Missing required fields
  - Type mismatches
  - Anomaly detection
```

#### Component Structure:
```tsx
<DataPreviewTable>
  <TableHeader>
    {/* Input columns */}
    {inputColumns.map(col => (
      <th className="bg-blue-50">{col.name}</th>
    ))}
    {/* Output columns */}
    {outputSchema.map(field => (
      <th className="bg-green-50">{field.name} (to extract)</th>
    ))}
  </TableHeader>

  <TableBody>
    {csvData.slice(0, 10).map(row => (
      <tr>
        {inputColumns.map(col => (
          <td>{row[col.name]}</td>
        ))}
        {outputSchema.map(field => (
          <td className="empty-placeholder">...</td>
        ))}
      </tr>
    ))}
  </TableBody>
</DataPreviewTable>

<ColumnMapper>
  <MappingSuggestion>
    "gt_price" → "price" (95% confidence)
    <AcceptButton />
  </MappingSuggestion>
</ColumnMapper>
```

### Stage 1.5: Confirm Test Run

#### Features to Add:
```typescript
- [ ] Test run modal with smart defaults
  - Default: 20 jobs
  - Rationale: "20 jobs gives 95% confidence in results"

- [ ] Cost and time estimates
  - Estimated time: 15 minutes
  - Estimated cost: $2.40 (at $0.12/job)
  - Based on: average execution time from similar projects

- [ ] Diverse sample selection
  - Not just first 20 rows
  - Sample across entire dataset
  - Ensure variety in input parameters

- [ ] Adjustable test size
  - Slider: 5 → 100 jobs
  - Show updated cost/time estimates
  - Warning if too small (<10) or too large (>50)
```

#### Component Structure:
```tsx
<TestRunModal>
  <Header>Ready to Test Your Batch</Header>

  <Recommendation>
    <Sparkles /> We recommend starting with 20 jobs
    <Rationale>
      This sample size gives you reliable accuracy metrics
      while keeping costs low (~$2.40)
    </Rationale>
  </Recommendation>

  <TestSizeSlider
    min={5}
    max={100}
    value={testSize}
    onChange={setTestSize}
  />

  <Estimates>
    <TimeEstimate>~15 minutes</TimeEstimate>
    <CostEstimate>$2.40</CostEstimate>
  </Estimates>

  <SampleStrategy>
    Sample selection: Diverse (not sequential)
    <SamplePreview rows={selectedSamples} />
  </SampleStrategy>

  <Actions>
    <Button onClick={runTest}>Run Test ({testSize} jobs)</Button>
    <Button variant="outline" onClick={runAll}>
      Run All ({totalRows} jobs)
    </Button>
  </Actions>
</TestRunModal>
```

---

## 🔧 Implementation Roadmap

### Phase 1: CSV Upload Enhancements (Current Priority)
1. Add file size/row count display
2. Implement async URL validation
3. Add duplicate detection
4. Enhanced CSV preview styling

### Phase 2: Natural Language Intelligence
1. Add template library
2. Implement AI interpretation preview
3. Add refinement conversation
4. Ambiguity detection and clarification

### Phase 3: Visual Schema Builder
1. Field cards with drag-and-drop
2. Template schemas
3. GT column auto-matching
4. Confidence scores

### Phase 4: Data Preview & Mapping
1. Input/output column table
2. Column mapper with suggestions
3. Validation warnings
4. Anomaly detection

### Phase 5: Smart Test Configuration
1. Test run modal
2. Cost/time estimation
3. Diverse sampling
4. Adjustable test size

---

## 📝 Current Working Features (Ready to Test)

### You Can Currently:

1. **Upload CSV**:
   - Drag and drop or browse
   - See detected columns
   - View first few rows

2. **Enter Natural Language**:
   - Describe what to extract
   - AI parses your intent
   - Generates goal, input/output schemas, and examples

3. **Review Parsed Intent**:
   - See input schema (from CSV)
   - See output schema (what to extract)
   - See example JSON output
   - Edit goal directly
   - Modify output schema via natural language

4. **Create Batch**:
   - Select existing project or create new
   - Submit and run

---

## 🧪 Testing the Current Implementation

### 1. Open Frontend
```
http://localhost:3001
```

### 2. Click "Add New Batch"

### 3. Upload CSV
Create a test file:
```csv
website,service,location,gt_price,gt_rating
https://example-salon.com,Haircut,New York,45,4.5
https://spa-world.com,Massage,LA,80,4.8
https://nails-r-us.com,Manicure,Chicago,35,4.2
```

### 4. Enter Natural Language
```
Extract the price and rating for each service from the website
```

### 5. Click "Parse & Preview"
You should see:
- Input schema: website, service, location
- Output schema: price, rating
- Example output: {"price": 45.00, "rating": 4.5}
- Parsed goal: "Visit {website} and Extract the price and rating for each service"

### 6. Modify (Optional)
Try:
- Edit the goal directly
- Add a field: "add currency"
- Change example: "set price to 99.99"

### 7. Create Batch
Click "Create Batch & Run"

---

## 🎯 Next Steps

To fully implement the detailed specs, we need to add:

1. **CSV Analyzer Integration**
   - Connect `csv-analyzer.ts` to the upload flow
   - Show column type detection
   - Display confidence scores

2. **Template Library**
   - Create 5-10 common templates
   - Add template selector UI
   - Pre-fill natural language from template

3. **Visual Schema Builder**
   - Replace simple list with field cards
   - Add drag-and-drop reordering
   - Editable field properties

4. **Enhanced Preview**
   - Full data preview table (10 rows)
   - Input/output column separation
   - Column mapping UI

5. **Test Run Configuration**
   - Smart sampling algorithm
   - Cost/time estimation
   - Test size slider

Would you like me to implement any of these specific enhancements next?
