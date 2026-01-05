
'use server';
/**
 * @fileOverview Parses a resume to pre-fill a staff profile form.
 *
 * - parseResumeToAutofillProfile - A function that parses the resume and returns the extracted information.
 * - ParseResumeToAutofillProfileInput - The input type for the parseResumeToAutofillProfile function.
 * - ParseResumeToAutofillProfileOutput - The return type for the parseResumeToAutofillProfile function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ParseResumeToAutofillProfileInputSchema = z.object({
  resumeDataUri: z
    .string()
    .describe(
      "The resume file as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'." // Corrected typo here
    ),
});
export type ParseResumeToAutofillProfileInput = z.infer<
  typeof ParseResumeToAutofillProfileInputSchema
>;

const FieldSchema = z.object({
    value: z.any().describe("The extracted value for the field."),
    confidence: z.number().min(0).max(1).describe("The confidence score (0.0 to 1.0) of the extraction for this field. If the value cannot be found, the value should be null and the confidence should be 0."),
    source: z.literal('cv').describe("The source of the data, which is 'cv' for resume parsing.")
});

const WorkExperienceSchema = z.object({
  companyName: FieldSchema.extend({ value: z.string() }),
  role: FieldSchema.extend({ value: z.string() }),
  years: FieldSchema.extend({ value: z.string() }),
  keyResponsibilities: FieldSchema.extend({ value: z.string() }),
});

const EducationSchema = z.object({
    institution: FieldSchema.extend({ value: z.string() }),
    degree: FieldSchema.extend({ value: z.string() }),
    years: FieldSchema.extend({ value: z.string() }),
});

const UnsupportedFieldSchema = z.object({
    field: z.string().describe("The name of the field that was found in the resume but is not supported by the system."),
    value: z.string().describe("The value associated with the unsupported field."),
});

const domains = ['Engineering', 'Design', 'Marketing', 'Sales', 'HR'];
const countries = ['Canada', 'USA', 'Sri Lanka'];
const sriLankanBranches = ['Nothern', 'Central', 'Eastern'];
const genders = ['Male', 'Female', 'Other', 'Prefer not to say'];
const employmentTypes = ['Full-time', 'Part-time', 'Contract', 'Intern'];
const employeeLevels = ['L1', 'L2', 'L3', 'Manager', 'Senior Manager', 'Director'];

const ParseResumeToAutofillProfileOutputSchema = z.object({
  first_name: FieldSchema.extend({ value: z.string() }),
  middle_name: FieldSchema.extend({ value: z.string().optional() }).optional(),
  last_name: FieldSchema.extend({ value: z.string() }),
  gender: FieldSchema.extend({ value: z.enum(genders as [string, ...string[]]).optional() }).optional(),
  email: FieldSchema.extend({ value: z.string().email() }),
  phone: FieldSchema.extend({ value: z.string().optional() }).optional(),
  street_address: FieldSchema.extend({ value: z.string().optional() }).optional(),
  city: FieldSchema.extend({ value: z.string().optional() }).optional(),
  state_province: FieldSchema.extend({ value: z.string().optional() }).optional(),
  postal_code: FieldSchema.extend({ value: z.string().optional() }).optional(),
  country: FieldSchema.extend({ value: z.enum(countries as [string, ...string[]]).optional() }).optional(),
  citizenship: FieldSchema.extend({ value: z.string().optional() }).optional(),
  national_id: FieldSchema.extend({ value: z.string().optional() }).optional(),
  passport_no: FieldSchema.extend({ value: z.string().optional() }).optional(),
  visa_work_permit: FieldSchema.extend({ value: z.string().optional() }).optional(),
  experience: FieldSchema.extend({ value: z.array(WorkExperienceSchema) }),
  education: FieldSchema.extend({ value: z.array(EducationSchema) }),
  skills: FieldSchema.extend({ value: z.array(z.string()) }),
  domain: FieldSchema.extend({ value: z.enum(domains as [string, ...string[]]).optional() }).optional(),
  branch: FieldSchema.extend({ value: z.string().optional() }).optional(),
  employment_type: FieldSchema.extend({ value: z.enum(employmentTypes as [string, ...string[]]).optional() }).optional(),
  employee_level: FieldSchema.extend({ value: z.enum(employeeLevels as [string, ...string[]]).optional() }).optional(),
  unsupportedFields: z.array(UnsupportedFieldSchema).optional().describe("A list of fields found in the resume that do not map to any of the standard fields."),
});


export type ParseResumeToAutofillProfileOutput = z.infer<
  typeof ParseResumeToAutofillProfileOutputSchema
>;

export async function parseResumeToAutofillProfile(
  input: ParseResumeToAutofillProfileInput
): Promise<ParseResumeToAutofillProfileOutput> {
  return parseResumeToAutofillProfileFlow(input);
}

const prompt = ai.definePrompt({
  name: 'parseResumeToAutofillProfilePrompt',
  input: {schema: ParseResumeToAutofillProfileInputSchema},
  output: {schema: ParseResumeToAutofillProfileOutputSchema},
  prompt: `You are an expert resume parser. Your task is to extract information from the provided resume and return it in a structured JSON format. For each field you extract, you MUST provide the extracted value, a confidence score between 0.0 and 1.0, and the source, which is always 'cv'.

  - If you cannot find a value for a specific field, the 'value' should be null and the 'confidence' score MUST be 0.
  - For complex fields like 'experience' and 'education', the 'value' will be an array of objects. The confidence for the parent field should be the average confidence of its child items.
  - Carefully infer fields like 'domain', 'country', 'employment_type', and 'employee_level' based on the entire resume content.
  - If you find any information in the resume that does not fit into the defined schema (e.g., 'Hobbies', 'Awards', 'Certifications'), add it to the 'unsupportedFields' array.

  Extract the following information:
  - Personal Details: first_name, middle_name (optional), last_name, gender (optional), email, phone.
  - Address: street_address, city, state_province, postal_code, country.
  - Legal: citizenship, national_id, passport_no, visa_work_permit.
  - Professional: a list of work experiences (including companyName, role, years, and keyResponsibilities), a list of education entries (including institution, degree, and years), a list of individual skills. 
  - Inferred Fields: Infer the most appropriate 'domain', 'country', 'branch', 'employment_type', and 'employee_level' from the provided options.

  Resume: {{media url=resumeDataUri}}`,
});

const parseResumeToAutofillProfileFlow = ai.defineFlow(
  {
    name: 'parseResumeToAutofillProfileFlow',
    inputSchema: ParseResumeToAutofillProfileInputSchema,
    outputSchema: ParseResumeToAutofillProfileOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
