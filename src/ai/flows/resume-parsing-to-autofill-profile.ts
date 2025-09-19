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

const ParseResumeToAutofillProfileOutputSchema = z.object({
  name: z.string().describe('The name of the staff member.'),
  email: z.string().email().describe('The email address of the staff member.'),
  phone: z
    .string()
    .describe('The phone number of the staff member.'),
  experience: z
    .string()
    .describe('The work experience of the staff member.'),
  education: z.string().describe('The education details of the staff member.'),
  skills: z.string().describe('The skills of the staff member'),
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
  prompt: `You are an expert resume parser. Extract the following information from the resume: name, email, phone, experience, education, and skills.  Return the information in JSON format.

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
