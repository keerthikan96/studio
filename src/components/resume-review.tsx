
import { ParseResumeToAutofillProfileOutput } from "@/ai/flows/resume-parsing-to-autofill-profile";
import { AlertCircle, FileQuestion, BadgePercent } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";

type ResumeReviewProps = {
    parsedData: ParseResumeToAutofillProfileOutput;
    resumeDataUri: string | null;
}

const getConfidenceColor = (score: number | undefined) => {
    if (score === undefined) return 'bg-gray-200 text-gray-800';
    if (score < 0.5) return 'bg-red-100 text-red-800';
    if (score < 0.75) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
};

const FieldDisplay = ({ label, value, confidence }: { label: string; value: any; confidence?: number }) => {
    if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) {
        return null;
    }

    let displayValue: React.ReactNode;

    if (typeof value === 'object' && value.value !== undefined) {
      confidence = value.confidence;
      displayValue = value.value;
    } else {
      displayValue = Array.isArray(value) ? value.join(', ') : value;
    }

    return (
        <div className="text-sm">
            <p className="font-semibold text-muted-foreground">{label}</p>
            <div className="flex items-center justify-between">
                <p>{String(displayValue)}</p>
                {confidence !== undefined && (
                    <Badge variant="outline" className={getConfidenceColor(confidence)}>
                        <BadgePercent className="h-3 w-3 mr-1" />
                        {Math.round(confidence * 100)}%
                    </Badge>
                )}
            </div>
        </div>
    );
};

export function ResumeReview({ parsedData, resumeDataUri }: ResumeReviewProps) {
    const { unsupportedFields, ...supportedFields } = parsedData;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>CV / Resume Preview</CardTitle>
                </CardHeader>
                <CardContent>
                    {resumeDataUri ? (
                        <iframe src={resumeDataUri} className="w-full h-96 rounded-md border" />
                    ) : (
                        <p className="text-muted-foreground">No resume preview available.</p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>AI Extraction Summary</CardTitle>
                    <CardDescription>
                        Key information extracted by the AI. Fields with low confidence are highlighted.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {Object.entries(supportedFields).map(([key, value]) => {
                        const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                        return <FieldDisplay key={key} label={label} value={value} />;
                    })}
                </CardContent>
            </Card>

            {unsupportedFields && unsupportedFields.length > 0 && (
                <Card className="border-amber-300 bg-amber-50/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-amber-800">
                           <FileQuestion className="h-5 w-5" /> Unsupported Fields Found
                        </CardTitle>
                        <CardDescription className="text-amber-700">
                            The AI found the following information in the resume which doesn't map to a standard field in the system.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {unsupportedFields.map((field, index) => (
                            <div key={index} className="text-sm p-2 bg-background rounded-md border">
                                <p className="font-semibold">{field.field}</p>
                                <p className="text-muted-foreground truncate">{field.value}</p>
                            </div>
                        ))}
                         <p className="text-xs text-muted-foreground pt-2">
                            You can manually add this information in the relevant sections if needed. In the future, you will be able to request new custom fields.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
