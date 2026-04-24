import { z } from 'genkit/beta';
import { ai } from '../genkit';

const LabResultSchema = z.object({
  test: z.string(),
  value: z.string(),
  unit: z.string(),
  referenceRange: z.string(),
  flag: z.enum(['normal', 'high', 'low', 'critical']),
});

const MedicationSchema = z.object({
  name: z.string(),
  dosage: z.string(),
  frequency: z.string(),
  duration: z.string(),
  instructions: z.string().optional(),
});

const VaccinationSchema = z.object({
  vaccine: z.string(),
  dateAdministered: z.string(),
  nextDue: z.string().optional(),
  batchNumber: z.string().optional(),
});

const DocumentOCRResultSchema = z.object({
  documentType: z.enum(['lab_report', 'prescription', 'vaccination']),
  clinicName: z.string().optional(),
  date: z.string().optional(),
  veterinarian: z.string().optional(),
  labResults: z.array(LabResultSchema).optional(),
  medications: z.array(MedicationSchema).optional(),
  vaccinations: z.array(VaccinationSchema).optional(),
  microchipNumber: z.string().optional(),
  notes: z.string().optional(),
  rawText: z.string(),
});

export const vetDocumentOCRFlow = ai.defineFlow(
  {
    name: 'vetDocumentOCR',
    inputSchema: z.object({
      imageUrl: z.string().describe('Photo of the vet document'),
      documentType: z.enum(['lab_report', 'prescription', 'vaccination']),
    }),
    outputSchema: DocumentOCRResultSchema,
  },
  async (input) => {
    const typeInstructions = {
      lab_report: 'Extract all test results with values, units, reference ranges, and flags (normal/high/low/critical). Populate the labResults array.',
      prescription: 'Extract all medications with dosage, frequency, duration, and instructions. Populate the medications array.',
      vaccination: 'Extract all vaccinations with dates administered, next due dates, and batch numbers. Also extract microchip number if present. Populate the vaccinations array.',
    };

    const { output } = await ai.generate({
      prompt: [
        { media: { url: input.imageUrl } },
        {
          text: `You are a veterinary document OCR specialist for PetPawSphere.

Extract structured data from this ${input.documentType.replace('_', ' ')}.

${typeInstructions[input.documentType]}

Also extract:
- Clinic name
- Date of the document
- Veterinarian name
- Any additional notes

Provide the complete raw text of the document as well.
If a field is not visible or legible, omit it rather than guessing.
Dates should be in ISO format (YYYY-MM-DD) when possible.`,
        },
      ],
      output: { schema: DocumentOCRResultSchema },
    });

    return output!;
  }
);
