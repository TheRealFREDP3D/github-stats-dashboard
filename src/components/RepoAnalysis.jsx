import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileCode, Lightbulb, CheckCircle, AlertCircle } from "lucide-react";

export const RepoAnalysis = ({ analysis }) => {
  if (!analysis || (!analysis.overview && (!analysis.files || analysis.files.length === 0) && (!analysis.generalSuggestions || analysis.generalSuggestions.length === 0))) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="w-5 h-5" />
            <span>No analysis data available. Please run the analysis first.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="files">File Analysis</TabsTrigger>
        <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCode className="w-5 h-5" />
              Repository Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="prose prose-sm max-w-none">
                {analysis.overview ? (
                  <p className="whitespace-pre-wrap">{analysis.overview}</p>
                ) : (
                  <p className="text-muted-foreground">No overview available.</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="files" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              File Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              {analysis.files && analysis.files.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {analysis.files.map((file, index) => (
                    <AccordionItem key={index} value={`file-${index}`}>
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center gap-2">
                          <FileCode className="w-4 h-4" />
                          <span className="font-mono text-sm">{file.path}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 pl-6">
                          {file.summary && (
                            <div>
                              <h4 className="font-semibold text-sm mb-1">Summary</h4>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{file.summary}</p>
                            </div>
                          )}
                          {file.suggestions && (
                            <div>
                              <h4 className="font-semibold text-sm mb-1">Suggestions</h4>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{file.suggestions}</p>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <p className="text-muted-foreground">No file analysis available.</p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="suggestions" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Improvement Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              {analysis.generalSuggestions && analysis.generalSuggestions.length > 0 ? (
                <div className="space-y-4">
                  {analysis.generalSuggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <Lightbulb className="w-5 h-5 mt-0.5 text-primary flex-shrink-0" />
                      <div className="flex-1">
                        <Badge variant="secondary" className="mb-2">
                          {suggestion.category || "General"}
                        </Badge>
                        <p className="text-sm whitespace-pre-wrap">{suggestion.text || suggestion}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No suggestions available.</p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};