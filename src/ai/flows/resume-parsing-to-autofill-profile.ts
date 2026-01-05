
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
      'The resume file as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' // Corrected typo here
    ),
});
export type ParseResumeToAutofillProfileInput = z.infer<
  typeof ParseResumeToAutofillProfileInputSchema
>;

const WorkExperienceSchema = z.object({
  companyName: z.string().describe('The name of the company.'),
  role: z.string().describe('The role or job title.'),
  years: z.string().describe('The start and end dates of the employment (e.g., "2018-2022" or "Jan 2020 - Present").'),
  keyResponsibilities: z.string().describe('A summary of key responsibilities and achievements in the role.'),
});

const EducationSchema = z.object({
    institution: z.string().describe('The name of the educational institution.'),
    degree: z.string().describe('The degree or qualification obtained.'),
    years: z.string().describe('The start and end dates of the education (e.g., "2014-2018").'),
});

const domains = ['Engineering', 'Design', 'Marketing', 'Sales', 'HR'];
const countries = ['Canada', 'USA', 'Sri Lanka'];
const sriLankanBranches = ['Nothern', 'Central', 'Eastern'];
const genders = ['Male', 'Female', 'Other', 'Prefer not to say'];
const employmentTypes = ['Full-time', 'Part-time', 'Contract', 'Intern'];
const employeeLevels = ['L1', 'L2', 'L3', 'Manager', 'Senior Manager', 'Director'];

const ParseResumeToAutofillProfileOutputSchema = z.object({
  first_name: z.string().describe("The person's first name."),
  middle_name: z.string().optional().describe("The person's middle name, if available."),
  last_name: z.string().describe("The person's last name."),
  gender: z.enum(genders as [string, ...string[]]).optional().describe("The person's gender."),
  email: z.string().email().describe("The person's email address."),
  phone: z.string().optional().describe("The person's phone number."),
  street_address: z.string().optional().describe('Street name and number.'),
  city: z.string().optional().describe('City name.'),
  state_province: z.string().optional().describe('State or province name.'),
  postal_code: z.string().optional().describe('Postal or Zip code.'),
  country: z.enum(countries as [string, ...string[]]).optional().describe("Guess the most likely country based on location information in the resume. Choose from: " + countries.join(', ')),
  citizenship: z.string().optional().describe('The person\'s citizenship.'),
  national_id: z.string().optional().describe('The person\'s National ID number.'),
  passport_no: z.string().optional().describe('The person\'s Passport Number.'),
  visa_work_permit: z.string().optional().describe('Visa or Work Permit details, if any.'),
  experience: z.array(WorkExperienceSchema).describe('The work experience of the staff member.'),
  education: z.array(EducationSchema).describe('The education details of the staff member.'),
  skills: z.array(z.string()).describe('A list of individual skills of the staff member.'),
  domain: z.enum(domains as [string, ...string[]]).optional().describe("The most likely job domain/department based on the resume. Choose from: " + domains.join(', ')),
  branch: z.string().optional().describe("Guess the most likely branch, state, or province. If the country is Sri Lanka, choose from: " + sriLankanBranches.join(', ') + ". Otherwise, provide the state or province name."),
  employment_type: z.enum(employmentTypes as [string, ...string[]]).optional().describe("Infer the most recent or likely employment type. Choose from: " + employmentTypes.join(', ')),
  employee_level: z.enum(employeeLevels as [string, ...string[]]).optional().describe("Infer the most likely employee level based on experience. Choose from: " + employeeLevels.join(', ')),
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
  prompt: `You are an expert resume parser. Extract the following information from the resume: 
  - Personal Details: first_name, middle_name (optional), last_name, gender (optional), email, phone.
  - Address: street_address, city, state_province, postal_code, country.
  - Legal: citizenship, national_id, passport_no, visa_work_permit.
  - Professional: a list of work experiences (including companyName, role, years, and keyResponsibilities), a list of education entries (including institution, degree, and years), a list of individual skills. 
  - Inferred Fields: Infer the most appropriate 'domain', 'country', 'branch', 'employment_type', and 'employee_level' from the provided options.

Return the information in JSON format.

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
