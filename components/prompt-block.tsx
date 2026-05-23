import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function PromptBlock({
  question,
  answer,
  hookable = false,
  onHook
}: {
  question: string;
  answer: string;
  hookable?: boolean;
  onHook?: () => void;
}) {
  return (
    <Card>
      <CardBody className="flex flex-col gap-6">
        <p className="prompt-q">{question}</p>
        <p className="prompt-a">{answer}</p>
        {hookable && (
          <div className="pt-2 border-t border-hairline flex items-center justify-between gap-4">
            <span className="text-xs text-muted">Hook this prompt</span>
            <Button variant="ink" onClick={onHook}>Hook</Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
